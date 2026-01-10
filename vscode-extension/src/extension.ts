/**
 * extension.ts - main entry point
 * wires together all components (parser, codelens, treeview)
 */

import * as vscode from 'vscode';
import { cost_codelens_provider } from './codelens_provider';
import { cost_tree_provider } from './treeview_provider';
// import { parse_llm_calls } from './parser'; // TODO: uncomment when person 1 finishes

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
      if (vscode.window.activeTextEditor) {
        update_providers(vscode.window.activeTextEditor.document);
      }
      codelens_provider.refresh();
      tree_provider.refresh();
      vscode.window.showInformationMessage('Cost analysis refreshed');
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
  
  // helper function to update all providers with parsed data
  const update_providers = (document: vscode.TextDocument) => {
    // only process supported file types
    const supported_languages = ['python', 'typescript', 'javascript'];
    if (!supported_languages.includes(document.languageId)) {
      return;
    }
    
    // TODO: when person 1 finishes parser, uncomment this:
    // const calls = parse_llm_calls(document);
    // tree_provider.update_calls(calls);
    
    // for now, just refresh to show mock data
    codelens_provider.refresh();
    tree_provider.refresh();
  };
  
  // listen for document changes to update analysis
  vscode.workspace.onDidChangeTextDocument((event) => {
    update_providers(event.document);
  });

  vscode.workspace.onDidOpenTextDocument((document) => {
    update_providers(document);
  });
  
  // analyze currently active document on activation
  if (vscode.window.activeTextEditor) {
    update_providers(vscode.window.activeTextEditor.document);
  }
}

export function deactivate() {
  console.log('cost-tracker extension is now deactivated');
}
