/**
 * codelens_provider.ts - person 2's work area
 * provides inline cost annotations using vscode codelens api
 */

import * as vscode from 'vscode';
import { llm_call } from './types';
import { parse_llm_calls } from './parser';

export class cost_codelens_provider implements vscode.CodeLensProvider {
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

  /**
   * provide codelens for a document
   */
  public provideCodeLenses(
  document: vscode.TextDocument,
  token: vscode.CancellationToken
): vscode.CodeLens[] {
  if (token.isCancellationRequested) return [];

  // Person 1 likely expects TextDocument; if they switch to string later,
  // this is the only line you’ll change.
  const detected_calls = parse_llm_calls(document);

  const codelenses: vscode.CodeLens[] = [];

  for (const call of detected_calls) {
    // llm_call.line is 1-based in your shared type (line: number)
    const lineIdx = Math.max(0, Math.min(document.lineCount - 1, call.line - 1));

    const lineRange = document.lineAt(lineIdx).range;

    const title = `💰 ~$${call.estimated_cost.toFixed(4)} • ${call.estimated_tokens} tok • ${call.provider}:${call.model}`;

    const command: vscode.Command = {
      title,
      command: "cost-tracker.showCostDetails",
      arguments: [call]
    };

    codelenses.push(new vscode.CodeLens(lineRange, command));
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
