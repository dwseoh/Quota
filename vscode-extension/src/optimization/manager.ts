import { OptimizationDetector, OptimizationSuggestion, FileContext } from './types';
import { CodeUnit } from '../types';
import * as vscode from 'vscode';

export class OptimizationManager {
    private detectors: Map<string, OptimizationDetector> = new Map();
    private static instance: OptimizationManager;

    private constructor() {}

    public static getInstance(): OptimizationManager {
        if (!OptimizationManager.instance) {
            OptimizationManager.instance = new OptimizationManager();
        }
        return OptimizationManager.instance;
    }

    public registerDetector(detector: OptimizationDetector): void {
        this.detectors.set(detector.id, detector);
    }

    public async analyze(
        input: vscode.TextDocument | { uri: vscode.Uri, content: string, languageId: string },
        codeUnits?: CodeUnit[]
    ): Promise<OptimizationSuggestion[]> {
        const fileContext: FileContext = 'getText' in input
            ? { uri: input.uri, content: input.getText(), languageId: input.languageId }
            : input as FileContext;

        const fileName = input.uri.fsPath;
        const applicableDetectors = this.getDetectorsForFile(input.languageId, fileName);

        if (applicableDetectors.length === 0) return [];

        const results = await Promise.all(
            applicableDetectors.map(detector =>
                detector.analyze(fileContext, codeUnits).catch(() => [] as OptimizationSuggestion[])
            )
        );

        return results.flat();
    }

    private getDetectorsForFile(languageId: string, fileName: string): OptimizationDetector[] {
        const ext = fileName.split('.').pop() || '';
        return Array.from(this.detectors.values()).filter(detector =>
            detector.targetFileTypes.some(type =>
                type === languageId || type === `.${ext}` || type === '*'
            )
        );
    }
}
