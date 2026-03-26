/**
 * extension.ts — activation: wire parser, analysis refresh, providers, listeners.
 */

import * as vscode from "vscode";
import { cost_codelens_provider } from "./codelens_provider";
import { cost_tree_provider } from "./treeview";
import { llm_call } from "./types";
import { initializeParser, indexWorkspace } from "./parser";
import { loadPricing } from "./pricing_fetcher";
import { OptimizationManager } from "./optimization/manager";
import { LoopDetector } from "./optimization/detectors/loop_detector";
import { PatternDetector } from "./optimization/detectors/pattern_detector";
import { IacDetector } from "./iac/detector";
import { CostCodeActionProvider } from "./code_action_provider";
import { CostDecorationProvider } from "./decoration_provider";
import { refreshWorkspaceAnalysis } from "./analysis/refresh_workspace_analysis";
import { createBudgetStatusBar } from "./ui/budget_status_bar";
import { registerQuotaCommands } from "./commands/register_commands";

export function activate(context: vscode.ExtensionContext) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    vscode.window.showWarningMessage("Quota: No workspace folder found");
    return;
  }

  const workspaceRoot = workspaceFolders[0].uri.fsPath;

  let cachedAllCalls: llm_call[] = [];

  const codelens_provider = new cost_codelens_provider();
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      [
        { language: "python", scheme: "file" },
        { language: "typescript", scheme: "file" },
        { language: "javascript", scheme: "file" },
      ],
      codelens_provider,
    ),
  );

  const tree_provider = new cost_tree_provider();
  const tree_view = vscode.window.createTreeView("quota-panel", {
    treeDataProvider: tree_provider,
  });
  context.subscriptions.push(tree_view);

  const decorationProvider = new CostDecorationProvider();

  const budgetStatusBar = createBudgetStatusBar(context);

  const runRefresh = () =>
    refreshWorkspaceAnalysis({
      tree_provider,
      decorationProvider,
      updateStatusBar: budgetStatusBar.update,
      onCallsUpdated: (calls) => {
        cachedAllCalls = calls;
      },
    });

  const onGeminiRefinementComplete = () => {
    void runRefresh();
    codelens_provider.refresh();
    tree_provider.refresh();
  };

  registerQuotaCommands(context, {
    workspaceRoot,
    tree_provider,
    codelens_provider,
    refreshWorkspaceAnalysis: runRefresh,
    onGeminiRefinementComplete,
  });

  const codeActionProvider = new CostCodeActionProvider();
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      ["python", "typescript", "javascript", "json"],
      codeActionProvider,
      {
        providedCodeActionKinds: [vscode.CodeActionKind.QuickFix],
      },
    ),
  );

  loadPricing(context.globalStorageUri.fsPath).catch(() => {
    /* falls back to hardcoded table */
  });

  initializeParser(workspaceRoot)
    .then(() => {
      const optManager = OptimizationManager.getInstance();
      optManager.registerDetector(new LoopDetector());
      optManager.registerDetector(new PatternDetector());
      optManager.registerDetector(new IacDetector());

      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Quota: Indexing workspace...",
          cancellable: false,
        },
        async (progress) => {
          try {
            progress.report({ increment: 0, message: "Scanning files..." });
            await indexWorkspace(workspaceRoot, onGeminiRefinementComplete);
            progress.report({ increment: 100, message: "Complete!" });
            await runRefresh();
            vscode.window.showInformationMessage(
              "Quota: Workspace indexed successfully",
            );
            codelens_provider.refresh();
            tree_provider.refresh();
          } catch (error) {
            vscode.window.showErrorMessage(`Quota: Indexing failed - ${error}`);
          }
        },
      );
    })
    .catch((error) => {
      vscode.window.showErrorMessage(
        `Quota: Parser initialization failed - ${error}`,
      );
    });

  let saveDebounceTimer: ReturnType<typeof setTimeout> | undefined;
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((document) => {
      const filePath = document.uri.fsPath;
      if (
        filePath.endsWith(".ts") ||
        filePath.endsWith(".js") ||
        filePath.endsWith(".py") ||
        filePath.endsWith(".tf")
      ) {
        clearTimeout(saveDebounceTimer);
        saveDebounceTimer = setTimeout(async () => {
          try {
            await indexWorkspace(workspaceRoot, onGeminiRefinementComplete);
            await runRefresh();
            codelens_provider.refresh();
            tree_provider.refresh();
          } catch (error) {
            vscode.window.showErrorMessage(`re-index failed: ${error}`);
          }
        }, 500);
      }
    }),
  );

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        codelens_provider.refresh();
        decorationProvider.updateDecorations(editor, cachedAllCalls);
      }
    }),
  );
}

export function deactivate() {}
