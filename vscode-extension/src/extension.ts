/**
 * extension.ts - main entry point
 * wires together all components (parser, codelens, treeview)
 */

import * as vscode from 'vscode';
import { cost_codelens_provider } from './codelens_provider';
import { cost_tree_provider } from './treeview_provider';
import { llm_call } from './types';
import { initializeParser, indexWorkspace, getCachedGraph } from './parser';

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
  const updateTreeviewWithAllCalls = () => {
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
        // Import helper functions from parser
        const model = extractModelFromClassification(unit.body, classification.provider);
        const promptText = extractPromptFromUnit(unit.body);
        const tokens = estimateTokens(promptText);
        const cost = calculateCost(model, tokens);
        
        console.log(`✅ LLM Call Found: ${unit.name} | Model: ${model} | Tokens: ${tokens} | Cost: $${cost.toFixed(6)}`);
        
        allCalls.push({
          line: unit.location.startLine, // Keep 1-indexed for display
          provider: classification.provider === 'openai' ? 'openai' : 'anthropic',
          model: model,
          prompt_text: promptText,
          estimated_tokens: tokens,
          estimated_cost: cost
        });
      }
    }
    
    console.log(`\n🎯 TOTAL: Found ${allCalls.length} LLM calls across workspace`);
    if (allCalls.length === 0) {
      console.log('⚠️ No LLM calls detected! Check:');
      console.log('  1. Are files being parsed? (check units count above)');
      console.log('  2. Are imports detected? (check classification logs)');
      console.log('  3. Is quick detection working? (check intelligence.ts)');
    }
    tree_provider.update_calls(allCalls);
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
        updateTreeviewWithAllCalls();
        
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
        tree_provider.refresh();
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
          updateTreeviewWithAllCalls();
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
          await indexWorkspace(workspaceRoot);
          updateTreeviewWithAllCalls();
          codelens_provider.refresh();
          tree_provider.refresh();
        } catch (error) {
          console.error('Error re-indexing on save:', error);
        }
      }
    })
  );

  // refresh on document open
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((document) => {
      codelens_provider.refresh();
      tree_provider.refresh();
    })
  );

  // refresh on active editor change
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        codelens_provider.refresh();
        tree_provider.refresh();
      }
    })
  );
}

export function deactivate() {
  console.log('cost-tracker extension is now deactivated');
}
