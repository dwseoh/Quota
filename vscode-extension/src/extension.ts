/**
 * extension.ts - main entry point
 * wires together all components (parser, codelens, treeview)
 */

import * as vscode from "vscode";
import { cost_codelens_provider } from "./codelens_provider";
import { cost_tree_provider } from "./treeview_provider";
import { llm_call } from "./types";

export function activate(context: vscode.ExtensionContext) {
  console.log("cost-tracker extension is now active");

  // --- person 2's registration: codelens provider ---
  const codelens_provider = new cost_codelens_provider();
  const codelens_disposable = vscode.languages.registerCodeLensProvider(
    [
      { language: "python", scheme: "file" },
      { language: "typescript", scheme: "file" },
      { language: "javascript", scheme: "file" }
    ],
    codelens_provider
  );
  context.subscriptions.push(codelens_disposable);

  // --- person 3's registration: treeview provider ---
  const tree_provider = new cost_tree_provider();
  const tree_view = vscode.window.createTreeView("cost-tracker-panel", {
    treeDataProvider: tree_provider
  });
  context.subscriptions.push(tree_view);

  // --- commands ---

  // command to show cost details (used by codelens)
  const show_details_cmd = vscode.commands.registerCommand(
    "cost-tracker.showCostDetails",
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
    "cost-tracker.updateUserCount",
    async () => {
      const input = await vscode.window.showInputBox({
        prompt: "Enter daily user count for cost simulation",
        value: "100",
        validateInput: (value) => {
          return isNaN(Number(value)) ? "Please enter a valid number" : null;
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
  const refresh_cmd = vscode.commands.registerCommand("cost-tracker.refresh", () => {
    codelens_provider.refresh();
    tree_provider.refresh();
    vscode.window.showInformationMessage("Cost analysis refreshed");
  });
  context.subscriptions.push(refresh_cmd);

  // --- document listeners (debounced so it doesn't spam refresh on each keystroke) ---
  let refreshTimer: NodeJS.Timeout | undefined;
  const debouncedRefresh = () => {
    if (refreshTimer) clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      codelens_provider.refresh();
      tree_provider.refresh();
    }, 200);
  };

  context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(debouncedRefresh));
  context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(debouncedRefresh));
  context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(debouncedRefresh));

  // initial refresh
  debouncedRefresh();
}

export function deactivate() {
  console.log("cost-tracker extension is now deactivated");
}
