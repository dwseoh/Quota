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

    /**
     * Register a new detector
     */
    public registerDetector(detector: OptimizationDetector): void {
        if (this.detectors.has(detector.id)) {
            console.warn(`Detector ${detector.id} is already registered. Overwriting.`);
        }
        this.detectors.set(detector.id, detector);
        console.log(`✅ Registered optimization detector: ${detector.id}`);
    }

    /**
     * Analyze a document using all applicable detectors
     */
    public async analyze(
        document: vscode.TextDocument, 
        codeUnits?: CodeUnit[]
    ): Promise<OptimizationSuggestion[]> {
        const fileContext: FileContext = {
            uri: document.uri,
            content: document.getText(),
            languageId: document.languageId
        };

        const applicableDetectors = this.getDetectorsForFile(document.languageId, document.fileName);
        const allSuggestions: OptimizationSuggestion[] = [];

        if (applicableDetectors.length === 0) {
            return [];
        }

        console.log(`🔍 Running ${applicableDetectors.length} detectors on ${document.fileName}...`);

        // Run detectors in parallel
        const promises = applicableDetectors.map(detector => 
            detector.analyze(fileContext, codeUnits)
                .catch(err => {
                    console.error(`❌ Error in detector ${detector.id}:`, err);
                    return [] as OptimizationSuggestion[];
                })
        );

        const results = await Promise.all(promises);
        
        // Flatten results
        results.forEach(suggestions => allSuggestions.push(...suggestions));

        return allSuggestions;
    }

    /**
     * Get relevant detectors for a specific file
     */
    private getDetectorsForFile(languageId: string, fileName: string): OptimizationDetector[] {
        const ext = fileName.split('.').pop() || '';
        
        return Array.from(this.detectors.values()).filter(detector => {
            return detector.targetFileTypes.some(type => 
                type === languageId || 
                type === `.${ext}` || 
                type === '*'
            );
        });
    }
}
