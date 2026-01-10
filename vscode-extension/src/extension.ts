/**
 * extension.ts - main entry point
 * wires together all components (parser, codelens, treeview)
 */

import * as vscode from 'vscode';
import { cost_codelens_provider } from './codelens_provider';
import { cost_tree_provider } from './treeview_provider';

export function activate(context: vscode.ExtensionContext) {
  console.log('cost-tracker extension is now active');

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
    () => {
      codelens_provider.refresh();
      tree_provider.refresh();
      vscode.window.showInformationMessage('Cost analysis refreshed');
    }
  );
  context.subscriptions.push(refresh_cmd);

  // --- document listeners ---
  
  // listen for document changes to update analysis
  vscode.workspace.onDidChangeTextDocument((event) => {
    // TODO: person 1 will implement parse_llm_calls
    // then we can update the providers here
    codelens_provider.refresh();
  });

  vscode.workspace.onDidOpenTextDocument((document) => {
    // TODO: person 1 will implement parse_llm_calls
    // then we can update the providers here
    codelens_provider.refresh();
  });
}

export function deactivate() {
  console.log('cost-tracker extension is now deactivated');
}
