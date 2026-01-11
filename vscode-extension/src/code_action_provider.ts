import * as vscode from 'vscode';
import { OptimizationManager } from './optimization/manager';

export class CostCodeActionProvider implements vscode.CodeActionProvider {
    /**
     * Provide code actions for the given range
     */
    async provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range | vscode.Selection,
        context: vscode.CodeActionContext,
        token: vscode.CancellationToken
    ): Promise<(vscode.CodeAction | vscode.Command)[]> {
        const actions: vscode.CodeAction[] = [];

        // Get suggestions from the manager
        const manager = OptimizationManager.getInstance();
        
        // We'll run a targeted analysis on this file to get fresh suggestions
        const suggestions = await manager.analyze(document);

        for (const suggestion of suggestions) {
            if (!suggestion.quickFix) continue;

            const fixRange = new vscode.Range(
                suggestion.location.startLine - 1,
                suggestion.location.startColumn,
                suggestion.location.endLine - 1,
                suggestion.location.endColumn
            );

            // Check if the suggestion overlaps with the user's cursor/selection
            if (range.intersection(fixRange)) {
                const action = new vscode.CodeAction(
                    `💰 Fix: ${suggestion.title}`,
                    vscode.CodeActionKind.QuickFix
                );
                
                action.edit = new vscode.WorkspaceEdit();
                const replacementUri = vscode.Uri.file(suggestion.quickFix.targetFile);
                
                // Create the edit
                action.edit.replace(
                    replacementUri,
                    new vscode.Range(
                        suggestion.quickFix.replacementRange.startLine,
                        suggestion.quickFix.replacementRange.startColumn,
                        suggestion.quickFix.replacementRange.endLine,
                        suggestion.quickFix.replacementRange.endColumn
                    ),
                    suggestion.quickFix.replacementText
                );

                action.isPreferred = true;
                actions.push(action);
            }
        }

        return actions;
    }
}
