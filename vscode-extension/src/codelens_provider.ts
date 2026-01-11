/**
 * codelens_provider.ts - person 2's work area
 * provides inline cost annotations using vscode codelens api
 */

import * as vscode from 'vscode';
import { llm_call } from './types';
import { parse_llm_calls } from './parser';

import { OptimizationManager } from './optimization/manager';

export class cost_codelens_provider implements vscode.CodeLensProvider {
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

  /**
   * provide codelens for a document
   */
  public async provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<vscode.CodeLens[]> {
    if (token.isCancellationRequested) return [];

    // 1. Existing functionality: Cost tracking
    const detected_calls = parse_llm_calls(document);
    const codelenses: vscode.CodeLens[] = [];

    for (const call of detected_calls) {
      const lineIdx = Math.max(0, Math.min(document.lineCount - 1, call.line - 1));
      const lineRange = document.lineAt(lineIdx).range;
      const title = `💰 ~$${call.estimated_cost.toFixed(4)} • ${call.estimated_tokens} tok • ${call.provider}:${call.model}`.toLowerCase();

      const command: vscode.Command = {
        title,
        command: "cost-tracker.showCostDetails",
        arguments: [call]
      };

      codelenses.push(new vscode.CodeLens(lineRange, command));
    }

    // 2. New functionality: Optimization Suggestions
    try {
        const suggestions = await OptimizationManager.getInstance().analyze(document);
        
        for (const suggestion of suggestions) {
            // Map location to range
            const startPos = new vscode.Position(suggestion.location.startLine - 1, suggestion.location.startColumn);
            const endPos = new vscode.Position(suggestion.location.endLine - 1, suggestion.location.endColumn);
            const range = new vscode.Range(startPos, endPos);

            const icon = suggestion.severity === 'warning' ? '⚠️' : '💡';
            
            const command: vscode.Command = {
                title: `${icon} suggestion: ${suggestion.title.toLowerCase()}`,
                command: 'cost-tracker.showSuggestionDetails',
                arguments: [suggestion]
            };
            
            codelenses.push(new vscode.CodeLens(range, command));
        }
    } catch (error) {
        console.error('Error fetching optimization suggestions:', error);
    }

    return codelenses;
  }


  /**
   * refresh codelens display
   */
  public refresh(): void {
    this._onDidChangeCodeLenses.fire();
  }
}
