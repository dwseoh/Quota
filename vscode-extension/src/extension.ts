/**
 * extension.ts - main entry point
 * wires together all components (parser, codelens, treeview)
 */

import * as vscode from 'vscode';
import { cost_codelens_provider } from './codelens_provider';
import { cost_tree_provider } from './treeview_provider';
import { llm_call } from './types';
import { initializeParser, indexWorkspace } from './parser';

export function activate(context: vscode.ExtensionContext) {
  console.log('cost-tracker extension is now active');

  // Get workspace root
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    vscode.window.showWarningMessage('Cost Tracker: No workspace folder found');
    return;
  }

  const workspaceRoot = workspaceFolders[0].uri.fsPath;

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

  // listen for document changes (debounced for performance)
  let changeTimer: NodeJS.Timeout | undefined;
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      // Debounce: only refresh codelens on typing
      if (changeTimer) clearTimeout(changeTimer);
      changeTimer = setTimeout(() => {
        codelens_provider.refresh();
      }, 300);
    })
  );

  // re-index on save for incremental updates
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(async (document) => {
      const filePath = document.uri.fsPath;
      if (filePath.endsWith('.py') || filePath.endsWith('.ts') || filePath.endsWith('.js')) {
        try {
          await indexWorkspace(workspaceRoot);
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
