import * as vscode from 'vscode';
import { cost_codelens_provider } from './codelens_provider';
import { cost_tree_provider } from './treeview_provider';
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
  });

  // --- person 2's registration: codelens provider ---
  const codelens_provider = new cost_codelens_provider();
  const codelens_disposable = vscode.languages.registerCodeLensProvider(
    [
      { language: 'python' },
      { language: 'typescript' },
      { language: 'javascript' }
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

  // --- commands ---

  // command to show cost details (used by codelens)
  const show_details_cmd = vscode.commands.registerCommand(
    'cost-tracker.showCostDetails',
    (call) => {
      vscode.window.showInformationMessage(
        `Cost Details:\nModel: ${call.model}\nTokens: ~${call.estimated_tokens}\nCost: ~$${call.estimated_cost.toFixed(4)}`
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

  // --- document listeners ---

  // listen for document changes to update analysis
  vscode.workspace.onDidChangeTextDocument((event) => {
    // Debounce: only refresh codelens (full re-index on save)
    codelens_provider.refresh();
  });

  vscode.workspace.onDidSaveTextDocument(async (document) => {
    // Re-index on save for incremental updates
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
  });

  vscode.workspace.onDidOpenTextDocument((document) => {
    codelens_provider.refresh();
  });
}

export function deactivate() {
  console.log('cost-tracker extension is now deactivated');
}
