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
  ): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
    // TODO: implement codelens generation
    // 1. call parse_llm_calls(document) to get detected calls
    // 2. for each call, create a CodeLens at that line
    // 3. show cost estimate in the codelens title
    // 4. add command to show detailed breakdown on click
    
    const detected_calls = parse_llm_calls(document);
    const codelenses: vscode.CodeLens[] = [];
    
    // mock implementation - replace with real logic
    for (const call of detected_calls) {
      const range = new vscode.Range(call.line, 0, call.line, 0);
      const command: vscode.Command = {
        title: `💰 ~$${call.estimated_cost.toFixed(4)} per call`,
        command: 'cost-tracker.showCostDetails',
        arguments: [call]
      };
      codelenses.push(new vscode.CodeLens(range, command));
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
