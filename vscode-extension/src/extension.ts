/**
 * extension.ts - main entry point
 * wires together all components (parser, codelens, treeview)
 */

import * as vscode from 'vscode';
import { cost_codelens_provider } from './codelens_provider';
import { cost_tree_provider } from './treeview_provider';
import { llm_call } from './types';
import { initializeParser, indexWorkspace, getCachedGraph } from './parser';
import { OptimizationManager } from './optimization/manager';
import { LoopDetector } from './optimization/detectors/loop_detector';
import { PatternDetector } from './optimization/detectors/pattern_detector';
import { OptimizationSuggestion } from './optimization/types';
import { CostCodeActionProvider } from './code_action_provider';
import { CostDecorationProvider } from './decoration_provider';

export function activate(context: vscode.ExtensionContext) {
  console.log('cost-tracker extension is now active');

  // Get workspace root
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    vscode.window.showWarningMessage('Cost Tracker: No workspace folder found');
    return;
  }

  const workspaceRoot = workspaceFolders[0].uri.fsPath;

  // Helper function to collect all LLM calls from cached graph
  const updateTreeviewWithAllCalls = async () => {
    const graph = getCachedGraph();
    if (!graph) {
      console.log('❌ No cached graph available yet');
      return;
    }

    console.log(`📊 Graph has ${graph.units.length} units, ${Object.keys(graph.classifications).length} classifications`);

    const allCalls: llm_call[] = [];
    
    // Iterate through all units and find LLM calls
    for (const unit of graph.units) {
      const classification = graph.classifications[unit.id];
      
      console.log(`🔍 Unit: ${unit.name} | Classification: ${classification ? `${classification.role}/${classification.category}/${classification.provider}` : 'none'}`);
      
      if (classification && classification.role === 'consumer' && classification.category === 'llm') {
        const model = extractModelFromClassification(unit.body, classification.provider);
        const promptText = extractPromptFromUnit(unit.body);
        const tokens = estimateTokens(promptText);
        const cost = calculateCost(model, tokens);
        
        allCalls.push({
          line: unit.location.startLine, // Keep 1-indexed for display
          file_path: unit.location.fileUri,
          provider: classification.provider === 'openai' ? 'openai' : 'anthropic',
          model: model,
          prompt_text: promptText,
          estimated_tokens: tokens,
          estimated_cost: cost
        });
      }
    }
    
    console.log(`\n🎯 TOTAL: Found ${allCalls.length} LLM calls across workspace`);
    
    // --- Run Optimization Analysis Globally ---
    // Optimization: Debounce this heavily? For now, we just rely on explicit calls or save events.
    // Optimization: Use FS read instead of openTextDocument to avoid heavy editor overhead.

    const allSuggestions: OptimizationSuggestion[] = [];
    const optManager = OptimizationManager.getInstance();

    // Helper to process files safely and fast
    const processFilesFast = async (uris: vscode.Uri[]) => {
        // Process in chunks of 5 to avoid event loop blocking
        const CHUNK_SIZE = 5;
        for (let i = 0; i < uris.length; i += CHUNK_SIZE) {
            const chunk = uris.slice(i, i + CHUNK_SIZE);
            await Promise.all(chunk.map(async (uri) => {
                try {
                    // Fast read from disk
                    const fileContent = await vscode.workspace.fs.readFile(uri);
                    const text = new TextDecoder().decode(fileContent);
                    const ext = uri.fsPath.split('.').pop() || '';
                    
                    const suggestions = await optManager.analyze({
                        uri: uri,
                        content: text,
                        languageId: ext === 'ts' ? 'typescript' : ext === 'py' ? 'python' : ext
                    });
                    
                    suggestions.forEach(s => allSuggestions.push(s));
                } catch (e) {
                    console.warn(`Skipping optim scan for ${uri.fsPath}: ${e}`);
                }
            }));
            // Tiny yield to let UI breathe
            await new Promise(r => setTimeout(r, 1)); 
        }
    };

    // 1. Scan Config Files (Found by glob)
    // Cache the glob result? For now, glob is relatively fast, but reading is slow.
    const configFiles = await vscode.workspace.findFiles('**/*.{tf,yml,yaml,json}', '**/node_modules/**');
    await processFilesFast(configFiles);

    // 2. Scan Code Files (from graph)
    const filePathsToScan = new Set<string>(allCalls.map(c => c.file_path || '').filter(Boolean));
    if (vscode.window.activeTextEditor) {
        filePathsToScan.add(vscode.window.activeTextEditor.document.uri.fsPath);
    }
    
    // Convert to URIs
    const codeUris = Array.from(filePathsToScan).map(p => vscode.Uri.file(p));
    // Limit total scan to prevention locking up on massive repos
    const limitedCodeUris = codeUris.slice(0, 50); 
    await processFilesFast(limitedCodeUris);

    // Dedup by ID
    const uniqueSuggestions = Array.from(new Map(allSuggestions.map(s => [s.id + s.location.fileUri, s])).values());
    
    // Update tree provider efficiently (single refresh)
    tree_provider.update_all_data(allCalls, graph, uniqueSuggestions);
    
    // Update status bar with new totals
    const totalCost = allCalls.reduce((sum, call) => sum + call.estimated_cost, 0);
    const userCount = tree_provider.get_user_count();
    updateStatusBar(totalCost, userCount);

    // Update Decorations
    if (vscode.window.activeTextEditor) {
        decorationProvider.updateDecorations(vscode.window.activeTextEditor, allCalls);
    }
  };

  // Helper functions (simplified versions from parser)
  const extractModelFromClassification = (code: string, provider: string): string => {
    const modelMatch = code.match(/model\s*[:=]\s*["']([^"']+)["']/);
    if (modelMatch) return modelMatch[1];
    if (provider === 'openai') return 'gpt-4';
    if (provider === 'anthropic') return 'claude-sonnet-4';
    return 'unknown';
  };

  const extractPromptFromUnit = (code: string): string => {
    const contentMatch = code.match(/content\s*[:=]\s*["']([^"']+)["']/);
    if (contentMatch) return contentMatch[1];
    const messagesMatch = code.match(/messages\s*[:=]\s*\[(.*?)\]/s);
    if (messagesMatch) return messagesMatch[1].substring(0, 200);
    return code.substring(0, 200);
  };

  const estimateTokens = (text: string): number => {
    return Math.ceil(text.length / 4);
  };

  // status bar
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  context.subscriptions.push(statusBarItem);

  const calculateCost = (model: string, tokens: number): number => {
    // Normalize model name (remove date suffixes)
    let normalizedModel = model;
    if (model.includes('claude-sonnet')) normalizedModel = 'claude-sonnet-4';
    else if (model.includes('claude-haiku')) normalizedModel = 'claude-haiku';
    else if (model.includes('gpt-4')) normalizedModel = 'gpt-4';
    else if (model.includes('gpt-3.5')) normalizedModel = 'gpt-3.5-turbo';
    
    const pricing: Record<string, number> = {
      'gpt-4': 0.03,
      'gpt-3.5-turbo': 0.0005,
      'claude-sonnet-4': 0.003,
      'claude-haiku': 0.00025
    };
    const rate = pricing[normalizedModel] || 0.01;
    return (tokens / 1000) * rate;
  };

  const updateStatusBar = (totalCost: number, userCount: number) => {
    const config = vscode.workspace.getConfiguration('cost-tracker');
    const budget = config.get<number>('monthlyBudget') || 500;
    
    // Calculate projected monthly cost based on current simulation settings
    const dailyCost = totalCost * userCount;
    const monthlyCost = dailyCost * 30;
    
    statusBarItem.text = `$(graph) $${monthlyCost.toFixed(2)} / $${budget}`;
    statusBarItem.tooltip = `Projected Monthly Cost: $${monthlyCost.toFixed(2)}\nBudget: $${budget}`;
    
    // Color logic
    if (monthlyCost >= budget) {
      statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
    } else if (monthlyCost >= budget * 0.8) {
      statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
      
      // Show warning if not recently shown (basic debounce could be added here, 
      // but for now we rely on the fact that this is called on updates)
      // To avoid spam, we could check a timestamp, but let's keep it simple for MVP.
    } else {
      statusBarItem.backgroundColor = undefined; // Default color
    }
    
    statusBarItem.show();
    
    // Trigger notification if over 80%
    if (monthlyCost >= budget * 0.8) {
      // Prevent spamming: using VS Code's built-in suppression for identical messages isn't always enough if params change slightly
      // For MVP, we'll just show it. VS Code handles duplicate messages well.
      vscode.window.showWarningMessage(`Budget Alert: You've reached over 80% of your $${budget} monthly budget!`);
    }
  };


  // --- person 2's registration: codelens provider ---
  const codelens_provider = new cost_codelens_provider();
  const codelens_disposable = vscode.languages.registerCodeLensProvider(
    [
      { language: 'python', scheme: 'file' },
      { language: 'typescript', scheme: 'file' },
      { language: 'javascript', scheme: 'file' }
    ],
    codelens_provider
  );
  context.subscriptions.push(codelens_disposable);

  // --- person 3's registration: treeview provider ---
  const tree_provider = new cost_tree_provider();
  const tree_view = vscode.window.createTreeView('cost-tracker-panel', {
    treeDataProvider: tree_provider
  });
  context.subscriptions.push(tree_view);

  // Initialize parser system
  initializeParser(workspaceRoot).then(() => {
    console.log('Parser system initialized');

    // --- Optimization Manager Initialization ---
    // Import dynamically or at top level. Assuming top level imports are added by user/formatter, 
    // but here we rely on the file being valid TS.
    // Note: ensure we import these at the top of file!
    const optManager = OptimizationManager.getInstance();
    optManager.registerDetector(new LoopDetector());
    optManager.registerDetector(new PatternDetector());
    console.log('✨ Optimization Manager initialized with detectors');

    // Run initial workspace indexing in background
    vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'Cost Tracker: Indexing workspace...',
      cancellable: false
    }, async (progress) => {
      try {
        progress.report({ increment: 0, message: 'Scanning files...' });
        await indexWorkspace(workspaceRoot);
        progress.report({ increment: 100, message: 'Complete!' });
        
        console.log('\n========================================');
        console.log('🚀 INDEXING COMPLETE - Updating Treeview');
        console.log('========================================\n');
        
        // Update treeview with real data from all files
        await updateTreeviewWithAllCalls();
        
        vscode.window.showInformationMessage('Cost Tracker: Workspace indexed successfully');
        
        // Refresh providers after indexing
        codelens_provider.refresh();
        tree_provider.refresh();
      } catch (error) {
        console.error('Error during workspace indexing:', error);
        vscode.window.showErrorMessage(`Cost Tracker: Indexing failed - ${error}`);
      }
    });
  }).catch(error => {
    console.error('Failed to initialize parser:', error);
    vscode.window.showErrorMessage(`Cost Tracker: Parser initialization failed - ${error}`);
  });

  // --- Optimization Commands ---
  // Register Code Action Provider (One-Click Savings)
  const codeActionProvider = new CostCodeActionProvider();
  context.subscriptions.push(
      vscode.languages.registerCodeActionsProvider(
          ['python', 'typescript', 'javascript', 'json'],
          codeActionProvider,
          {
              providedCodeActionKinds: [vscode.CodeActionKind.QuickFix]
          }
      )
  );

  const show_suggestion_cmd = vscode.commands.registerCommand(
      'cost-tracker.showSuggestionDetails',
      (suggestion: OptimizationSuggestion) => {
          vscode.window.showInformationMessage(
              `Suggestion: ${suggestion.title}\n\n${suggestion.description}\n\nImpact: ${suggestion.costImpact}`,
              'Learn More'
          ).then(selection => {
              if (selection === 'Learn More') {
                  // Could open a link in future
              }
          });
      }
  );
  context.subscriptions.push(show_suggestion_cmd);

  // --- commands ---

  // command to show cost details (used by codelens)
  const show_details_cmd = vscode.commands.registerCommand(
    'cost-tracker.showCostDetails',
    (call: llm_call) => {
      vscode.window.showInformationMessage(
        `Cost Details:\n` +
          `Provider: ${call.provider}\n` +
          `Model: ${call.model}\n` +
          `Line: ${call.line}\n` +
          `Tokens: ~${call.estimated_tokens}\n` +
          `Cost: ~$${Number(call.estimated_cost ?? 0).toFixed(4)}`
      );
    }
  );
  context.subscriptions.push(show_details_cmd);

  // command to update user count (used by treeview)
  const update_user_count_cmd = vscode.commands.registerCommand(
    'cost-tracker.updateUserCount',
    async () => {
      const input = await vscode.window.showInputBox({
        prompt: 'Enter daily user count for cost simulation',
        value: '100',
        validateInput: (value) => {
          return isNaN(Number(value)) ? 'Please enter a valid number' : null;
        }
      });

      if (input) {
        tree_provider.update_user_count(Number(input));
        
        // Update status bar immediately
        await updateTreeviewWithAllCalls(); 
      }
    }
  );
  context.subscriptions.push(update_user_count_cmd);

  // command to refresh analysis
  const refresh_cmd = vscode.commands.registerCommand(
    'cost-tracker.refresh',
    async () => {
      // Re-index workspace
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Cost Tracker: Re-indexing workspace...',
        cancellable: false
      }, async (progress) => {
        try {
          await indexWorkspace(workspaceRoot);
          await updateTreeviewWithAllCalls();
          codelens_provider.refresh();
          tree_provider.refresh();
          vscode.window.showInformationMessage('Cost analysis refreshed');
        } catch (error) {
          vscode.window.showErrorMessage(`Refresh failed: ${error}`);
        }
      });
    }
  );
  context.subscriptions.push(refresh_cmd);

  // command to toggle mock data (for testing)
  const toggle_mock_cmd = vscode.commands.registerCommand(
    'cost-tracker.toggleMockData',
    () => {
      tree_provider.toggle_mock_data();
      vscode.window.showInformationMessage('Toggled mock data for testing');
    }
  );
  context.subscriptions.push(toggle_mock_cmd);

  // command to show call details from tree item
  const show_call_details_cmd = vscode.commands.registerCommand(
    'cost-tracker.showCallDetails',
    (item) => {
      if (item.call_data) {
        const call = item.call_data;
        vscode.window.showInformationMessage(
          `${call.provider} • ${call.model}\nLine: ${call.line}\nTokens: ~${call.estimated_tokens}\nCost: ~$${call.estimated_cost.toFixed(6)}\nPrompt: "${call.prompt_text.substring(0, 50)}..."`
        );
      }
    }
  );
  context.subscriptions.push(show_call_details_cmd);

  // command to jump to code location from tree item
  const jump_to_call_cmd = vscode.commands.registerCommand(
    'cost-tracker.jumpToCall',
    async (call: llm_call) => {
      if (!call || !call.file_path) {
        vscode.window.showWarningMessage('No file path available for this call');
        return;
      }

      try {
        const uri = vscode.Uri.file(call.file_path);
        const document = await vscode.workspace.openTextDocument(uri);
        const editor = await vscode.window.showTextDocument(document);
        
        // Jump to the line (convert 1-indexed to 0-indexed)
        const line = Math.max(0, call.line - 1);
        const position = new vscode.Position(line, 0);
        const range = new vscode.Range(position, position);
        
        // Move cursor and reveal the line
        editor.selection = new vscode.Selection(position, position);
        editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to open file: ${error}`);
      }
    }
  );
  context.subscriptions.push(jump_to_call_cmd);

  // command to jump to optimization suggestion
  const jump_to_suggestion_cmd = vscode.commands.registerCommand(
      'cost-tracker.jumpToSuggestion',
      async (suggestion: OptimizationSuggestion) => {
          if (!suggestion || !suggestion.location || !suggestion.location.fileUri) {
              vscode.window.showWarningMessage('No location data available for this suggestion');
              return;
          }

          try {
              const rawPath = suggestion.location.fileUri;
              const uri = rawPath.startsWith('file:') ? vscode.Uri.parse(rawPath) : vscode.Uri.file(rawPath);
                  
              const document = await vscode.workspace.openTextDocument(uri);
              const editor = await vscode.window.showTextDocument(document);

              // 0-indexed conversion
              const startLine = Math.max(0, suggestion.location.startLine - 1);
              const startChar = Math.max(0, suggestion.location.startColumn - 1);
              const endLine = Math.max(0, suggestion.location.endLine - 1);
              const endChar = Math.max(0, suggestion.location.endColumn - 1);

              const range = new vscode.Range(startLine, startChar, endLine, endChar);
              editor.selection = new vscode.Selection(startLine, startChar, startLine, startChar);
              editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
          } catch (error) {
              vscode.window.showErrorMessage(`Failed to jump to suggestion: ${error}`);
          }
      }
  );
  context.subscriptions.push(jump_to_suggestion_cmd);

  // --- document listeners ---

  // Note: We don't refresh CodeLens on typing because parse_llm_calls() uses
  // the cached graph which only updates on save. Refreshing on typing would
  // cause duplicate/stale CodeLens to appear.

  // re-index on save for incremental updates
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(async (document) => {
      const filePath = document.uri.fsPath;
      if (filePath.endsWith('.py') || filePath.endsWith('.ts') || filePath.endsWith('.js')) {
        try {
          // Debounce logic could be here, but for now relying on async queue
          await indexWorkspace(workspaceRoot);
          
          // Don't await this blocking UI - let it happen in background
          updateTreeviewWithAllCalls().catch(console.error);
          
          codelens_provider.refresh();
          tree_provider.refresh();
        } catch (error) {
          console.error('Error re-indexing on save:', error);
        }
      }
    })
  );

  // --- Decoration Provider (Visual Heatmap) ---
  const decorationProvider = new CostDecorationProvider();
  
  // refresh on active editor change
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        codelens_provider.refresh();
        tree_provider.refresh();
        updateTreeviewWithAllCalls(); 
      }
    })
  );

  // refresh on document open
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((document) => {
      codelens_provider.refresh();
      tree_provider.refresh();
      updateTreeviewWithAllCalls();
    })
  );

  // re-index on save for incremental updates
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(async (document) => {
      const filePath = document.uri.fsPath;
      if (filePath.endsWith('.py') || filePath.endsWith('.ts') || filePath.endsWith('.js')) {
        try {
          await indexWorkspace(workspaceRoot);
          
          await updateTreeviewWithAllCalls();
          
          codelens_provider.refresh();
          tree_provider.refresh();
        } catch (error) {
          console.error('Error re-indexing on save:', error);
        }
      }
    })
  );

}

export function deactivate() {
  console.log('cost-tracker extension is now deactivated');
}
