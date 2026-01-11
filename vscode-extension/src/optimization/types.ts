import { ContextBundle, CodeUnit } from '../types';
import * as vscode from 'vscode';

export interface OptimizationSuggestion {
    id: string;
    title: string;
    description: string;
    severity: 'info' | 'warning' | 'critical';
    location: {
        fileUri: string;
        startLine: number;
        startColumn: number;
        endLine: number;
        endColumn: number;
    };
    action?: {
        title: string;
        command: string;
        arguments?: any[];
    };
    costImpact?: string; // e.g. "High", "Medium", "Low" or "$50/mo"
    quickFix?: {
        targetFile: string;
        replacementRange: { startLine: number, startColumn: number, endLine: number, endColumn: number }; // 0-indexed for VS Code API
        replacementText: string;
    };
}

export interface FileContext {
    uri: vscode.Uri;
    content: string;
    languageId: string;
}

export interface OptimizationDetector {
    id: string;
    targetFileTypes: string[]; // e.g. ['typescript', 'python', 'yaml']
    
    /**
     * Analyze a file or code bundle for optimization opportunities
     */
    analyze(context: FileContext, codeUnits?: CodeUnit[]): Promise<OptimizationSuggestion[]>;
}

export interface DetectorRegistry {
    register(detector: OptimizationDetector): void;
    getDetectors(languageId: string): OptimizationDetector[];
    getAll(): OptimizationDetector[];
}
