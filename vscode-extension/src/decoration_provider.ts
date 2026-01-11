import * as vscode from 'vscode';
import { llm_call } from './types';

export class CostDecorationProvider {
    // Decoration types for different cost tiers
    private lowCostDecoration: vscode.TextEditorDecorationType;
    private mediumCostDecoration: vscode.TextEditorDecorationType;
    private highCostDecoration: vscode.TextEditorDecorationType;

    constructor() {
        // Initialize decoration types with subtle background colors
        // We use rgba to ensure transparency and good contrast in both themes
        
        // Low Cost: Very faint green
        this.lowCostDecoration = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(0, 255, 0, 0.05)',
            isWholeLine: true,
            overviewRulerColor: 'rgba(0, 255, 0, 0.4)',
            overviewRulerLane: vscode.OverviewRulerLane.Right
        });

        // Medium Cost: Faint yellow
        this.mediumCostDecoration = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(255, 255, 0, 0.1)',
            isWholeLine: true,
            overviewRulerColor: 'rgba(255, 255, 0, 0.4)',
            overviewRulerLane: vscode.OverviewRulerLane.Right
        });

        // High Cost: Faint red
        this.highCostDecoration = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(255, 0, 0, 0.15)',
            isWholeLine: true,
            overviewRulerColor: 'rgba(255, 0, 0, 0.6)',
            overviewRulerLane: vscode.OverviewRulerLane.Right
        });
    }

    /**
     * Update decorations for the active editor
     */
    public updateDecorations(editor: vscode.TextEditor, calls: llm_call[]) {
        if (!editor || !calls) return;

        const lowCostRanges: vscode.Range[] = [];
        const mediumCostRanges: vscode.Range[] = [];
        const highCostRanges: vscode.Range[] = [];

        const editorPath = editor.document.uri.fsPath;

        // Filter calls for this file
        const fileCalls = calls.filter(call => call.file_path === editorPath);

        for (const call of fileCalls) {
            // VS Code ranges are 0-indexed
            const range = new vscode.Range(
                call.line - 1, 
                0, 
                call.line - 1, 
                editor.document.lineAt(Math.max(0, call.line - 1)).text.length
            );

            if (call.estimated_cost < 0.001) {
                lowCostRanges.push(range);
            } else if (call.estimated_cost < 0.01) {
                mediumCostRanges.push(range);
            } else {
                highCostRanges.push(range);
            }
        }

        // Apply decorations
        editor.setDecorations(this.lowCostDecoration, lowCostRanges);
        editor.setDecorations(this.mediumCostDecoration, mediumCostRanges);
        editor.setDecorations(this.highCostDecoration, highCostRanges);
    }
    
    public dispose() {
        this.lowCostDecoration.dispose();
        this.mediumCostDecoration.dispose();
        this.highCostDecoration.dispose();
    }
}
