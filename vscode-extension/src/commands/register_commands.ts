/**
 * registers cost-tracker commands (details, refresh, jump, suggestions).
 */

import * as vscode from 'vscode';
import { llm_call } from '../types';
import { indexWorkspace } from '../parser';
import { OptimizationSuggestion } from '../optimization/types';
import { cost_codelens_provider } from '../codelens_provider';
import { cost_tree_provider } from '../treeview';

export interface RegisterCommandsDeps {
  workspaceRoot: string;
  tree_provider: cost_tree_provider;
  codelens_provider: cost_codelens_provider;
  refreshWorkspaceAnalysis: () => Promise<void>;
}

export function registerCostTrackerCommands(context: vscode.ExtensionContext, deps: RegisterCommandsDeps): void {
  const { workspaceRoot, tree_provider, codelens_provider, refreshWorkspaceAnalysis } = deps;

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'cost-tracker.showSuggestionDetails',
      (suggestion: OptimizationSuggestion) => {
        vscode.window.showInformationMessage(
          `Suggestion: ${suggestion.title}\n\n${suggestion.description}\n\nImpact: ${suggestion.costImpact}`,
          'Learn More'
        ).then(selection => {
          if (selection === 'Learn More') {
            // could open a link in future
          }
        });
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
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
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
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
          await refreshWorkspaceAnalysis();
        }
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'cost-tracker.refresh',
      async () => {
        await vscode.window.withProgress({
          location: vscode.ProgressLocation.Notification,
          title: 'Cost Tracker: Re-indexing workspace...',
          cancellable: false
        }, async () => {
          try {
            await indexWorkspace(workspaceRoot);
            await refreshWorkspaceAnalysis();
            codelens_provider.refresh();
            tree_provider.refresh();
            vscode.window.showInformationMessage('Cost analysis refreshed');
          } catch (error) {
            vscode.window.showErrorMessage(`Refresh failed: ${error}`);
          }
        });
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'cost-tracker.showCallDetails',
      (item) => {
        if (item.call_data) {
          const call = item.call_data;
          vscode.window.showInformationMessage(
            `${call.provider} • ${call.model}\nLine: ${call.line}\nTokens: ~${call.estimated_tokens}\nCost: ~$${call.estimated_cost.toFixed(6)}\nPrompt: "${call.prompt_text.substring(0, 50)}..."`
          );
        }
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
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

          const line = Math.max(0, call.line - 1);
          const position = new vscode.Position(line, 0);
          const range = new vscode.Range(position, position);

          editor.selection = new vscode.Selection(position, position);
          editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
        } catch (error) {
          vscode.window.showErrorMessage(`Failed to open file: ${error}`);
        }
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
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
    )
  );
}
