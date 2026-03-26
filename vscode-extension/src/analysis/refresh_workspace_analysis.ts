/**
 * recomputes cached llm calls, runs optimization scans, updates tree/status/decorations.
 */

import * as vscode from 'vscode';
import { llm_call } from '../types';
import { getCachedGraph } from '../parser';
import { OptimizationManager } from '../optimization/manager';
import { OptimizationSuggestion } from '../optimization/types';
import { cost_tree_provider } from '../treeview';
import { CostDecorationProvider } from '../decoration_provider';
import { collectLlmCallsFromGraph } from './collect_llm_calls';

export interface RefreshWorkspaceAnalysisDeps {
  tree_provider: cost_tree_provider;
  decorationProvider: CostDecorationProvider;
  updateStatusBar: (totalCost: number, userCount: number) => void;
  onCallsUpdated: (calls: llm_call[]) => void;
}

export async function refreshWorkspaceAnalysis(deps: RefreshWorkspaceAnalysisDeps): Promise<void> {
  const graph = getCachedGraph();
  if (!graph) {
    return;
  }

  const allCalls = collectLlmCallsFromGraph(graph);
  deps.onCallsUpdated(allCalls);

  const allSuggestions: OptimizationSuggestion[] = [];
  const optManager = OptimizationManager.getInstance();

  const processFilesFast = async (uris: vscode.Uri[]) => {
    const CHUNK_SIZE = 5;
    for (let i = 0; i < uris.length; i += CHUNK_SIZE) {
      const chunk = uris.slice(i, i + CHUNK_SIZE);
      await Promise.all(chunk.map(async (uri) => {
        try {
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
      await new Promise(r => setTimeout(r, 1));
    }
  };

  const configFiles = await vscode.workspace.findFiles('**/*.{tf,yml,yaml,json}', '**/node_modules/**');
  await processFilesFast(configFiles);

  const filePathsToScan = new Set<string>(allCalls.map(c => c.file_path || '').filter(Boolean));
  if (vscode.window.activeTextEditor) {
    filePathsToScan.add(vscode.window.activeTextEditor.document.uri.fsPath);
  }

  const codeUris = Array.from(filePathsToScan).map(p => vscode.Uri.file(p));
  const limitedCodeUris = codeUris.slice(0, 50);
  await processFilesFast(limitedCodeUris);

  const uniqueSuggestions = Array.from(new Map(allSuggestions.map(s => [s.id + s.location.fileUri, s])).values());

  deps.tree_provider.update_all_data(allCalls, graph, uniqueSuggestions);

  const totalCost = allCalls.reduce((sum, call) => sum + (call.estimated_cost ?? 0), 0);
  const userCount = deps.tree_provider.get_user_count();
  deps.updateStatusBar(totalCost, userCount);

  if (vscode.window.activeTextEditor) {
    deps.decorationProvider.updateDecorations(vscode.window.activeTextEditor, allCalls);
  }
}
