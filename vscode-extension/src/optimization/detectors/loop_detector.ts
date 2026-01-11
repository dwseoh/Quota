import { OptimizationDetector, OptimizationSuggestion, FileContext } from '../types';
import { CodeUnit } from '../../types';
import { parse } from '@typescript-eslint/parser';
import * as path from 'path';

export class LoopDetector implements OptimizationDetector {
    id = 'loop-detector';
    targetFileTypes = ['typescript', 'javascript', 'python', 'javascriptreact', 'typescriptreact', '.ts', '.js', '.py', '.tsx', '.jsx'];

    // Known costly operations to look for
    private costPatterns = [
        // LLM APIs
        'openai', 'anthropic', 'gemini', 'cohere', 'completions.create', 'generatecontent',
        // Databases
        'find', 'findone', 'findbyid', 'scan', 'query', 'get', 'put', 'postgres', 'mysql', 'prisma',
        // Generic HTTP
        'fetch', 'axios', 'request'
    ];

    async analyze(context: FileContext, codeUnits?: CodeUnit[]): Promise<OptimizationSuggestion[]> {
        const suggestions: OptimizationSuggestion[] = [];
        const isPython = context.languageId === 'python' || context.uri.fsPath.endsWith('.py');

        if (isPython) {
            suggestions.push(...this.analyzePython(context.content, context.uri.toString()));
        } else {
            suggestions.push(...this.analyzeTypeScript(context.content, context.uri.toString()));
        }

        return suggestions;
    }

    /**
     * Analyze TypeScript/JavaScript using AST
     */
    private analyzeTypeScript(content: string, fileUri: string): OptimizationSuggestion[] {
        const suggestions: OptimizationSuggestion[] = [];
        try {
            const ast = parse(content, {
                ecmaVersion: 2020,
                sourceType: 'module',
                loc: true,
                range: true
            });

            const walk = (node: any, inLoop: boolean) => {
                if (!node || typeof node !== 'object') return;

                // Check for loops
                const isLoop = node.type === 'ForStatement' || 
                               node.type === 'ForOfStatement' || 
                               node.type === 'ForInStatement' || 
                               node.type === 'WhileStatement' || 
                               node.type === 'DoWhileStatement';

                // Check for CallExpressions (function calls)
                if (inLoop && node.type === 'CallExpression') {
                    this.checkCallExpression(node, fileUri, suggestions);
                }

                // Traverse children safely
                for (const key in node) {
                    const child = node[key];
                    if (child && typeof child === 'object') {
                        if (Array.isArray(child)) {
                            child.forEach((c: any) => {
                                if (c && typeof c === 'object' && c.type) {
                                    walk(c, inLoop || isLoop);
                                }
                            });
                        } else if (child.type) {
                            // Only walk objects that look like AST nodes (have 'type')
                            // This avoids walking 'loc', 'range', 'parent' etc.
                            walk(child, inLoop || isLoop);
                        }
                    }
                }
            };

            walk(ast, false);

        } catch (err) {
            console.warn(`LoopDetector: Failed to parse TS/JS: ${err}`);
        }
        return suggestions;
    }

    private getCallName(node: any): string {
        if (!node) return '';
        if (node.type === 'Identifier') return node.name;
        if (node.type === 'MemberExpression') {
            return `${this.getCallName(node.object)}.${node.property.name}`;
        }
        return '';
    }

    /**
     * Check if a CallExpression matches a cost pattern
     */
    private checkCallExpression(node: any, fileUri: string, suggestions: OptimizationSuggestion[]) {
        let callName = '';

        if (node.callee) {
            callName = this.getCallName(node.callee);
        }

        // Check against patterns
        if (callName) {
            const lowerName = callName.toLowerCase();
            const match = this.costPatterns.some(pattern => lowerName.includes(pattern.toLowerCase()));
            
            if (match) {
                suggestions.push({
                    id: `loop-cost-${node.loc.start.line}`,
                    title: 'Costly Operation in Loop',
                    description: `Detected potential costly operation '${callName}' inside a loop. Consider batching requests or caching results.`,
                    severity: 'warning',
                    location: {
                        fileUri: fileUri,
                        startLine: node.loc.start.line,
                        startColumn: node.loc.start.column,
                        endLine: node.loc.end.line,
                        endColumn: node.loc.end.column
                    },
                    costImpact: 'High'
                });
            }
        }
    }

    /**
     * Analyze Python using indentation/regex (Simple Heuristic for now)
     */
    private analyzePython(content: string, fileUri: string): OptimizationSuggestion[] {
        const suggestions: OptimizationSuggestion[] = [];
        const lines = content.split('\n');
        
        let loopIndentLevels: number[] = []; // Stack of active loop indentation levels

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trim = line.trim();
            if (!trim || trim.startsWith('#')) continue;

            const indent = line.search(/\S/);
            
            // Manage loop stack based on indentation
            // Pop loops that have ended (indentation went back or equal)
            // Python: strictly greater indentation means inside.
            loopIndentLevels = loopIndentLevels.filter(level => level < indent);

            // Check if this line starts a loop
            if (trim.startsWith('for ') || trim.startsWith('while ')) {
                loopIndentLevels.push(indent);
            }

            // If we are deep inside a loop
            if (loopIndentLevels.length > 0) {
                const insideIndent = loopIndentLevels[loopIndentLevels.length - 1];
                if (indent > insideIndent) {
                     // Check for costly calls
                    const match = this.costPatterns.some(pattern => trim.toLowerCase().includes(pattern.toLowerCase()));
                    
                    if (match && !trim.startsWith('for ') && !trim.startsWith('while ')) {
                         suggestions.push({
                            id: `loop-cost-py-${i + 1}`,
                            title: 'Costly Operation in Loop',
                            description: `Detected costly operation inside a loop (Python). '${trim}'`,
                            severity: 'warning',
                            location: {
                                fileUri: fileUri,
                                startLine: i + 1,
                                startColumn: indent,
                                endLine: i + 1,
                                endColumn: line.length
                            },
                            costImpact: 'High'
                        });
                    }
                }
            }
        }

        return suggestions;
    }
}
