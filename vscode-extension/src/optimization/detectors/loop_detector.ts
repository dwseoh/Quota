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
        'fetch', 'axios', 'request',
        // Common expensive business logic
        'categorize', 'classify', 'analyze', 'predict'
    ];

    private cachePatterns = ['cache', 'redis', 'memcached', 'memoize', 'store', 'kv'];

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

            // Keep track of the current loop node we are inside
            const walk = (node: any, currentLoop: any | null) => {
                if (!node || typeof node !== 'object') return;

                // Check for loops
                const isLoop = node.type === 'ForStatement' || 
                               node.type === 'ForOfStatement' || 
                               node.type === 'ForInStatement' || 
                               node.type === 'WhileStatement' || 
                               node.type === 'DoWhileStatement';
                
                const activeLoop = isLoop ? node : currentLoop;

                // Check for CallExpressions (function calls)
                if (activeLoop && node.type === 'CallExpression') {
                    this.checkCallExpression(node, activeLoop, content, fileUri, suggestions);
                }

                // Traverse children safely
                for (const key in node) {
                    const child = node[key];
                    if (child && typeof child === 'object') {
                        if (Array.isArray(child)) {
                            child.forEach((c: any) => {
                                if (c && typeof c === 'object' && c.type) {
                                    walk(c, activeLoop);
                                }
                            });
                        } else if (child.type) {
                            walk(child, activeLoop);
                        }
                    }
                }
            };

            walk(ast, null);

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
    private checkCallExpression(node: any, loopNode: any, content: string, fileUri: string, suggestions: OptimizationSuggestion[]) {
        let callName = '';

        if (node.callee) {
            callName = this.getCallName(node.callee);
        }

        // Check against patterns
        if (callName) {
            const lowerName = callName.toLowerCase();
            const match = this.costPatterns.some(pattern => lowerName.includes(pattern.toLowerCase()));
            
            if (match) {
                // Check if the loop body contains cache logic
                // We extract the text of the loop
                const loopText = content.substring(loopNode.range[0], loopNode.range[1]);
                const hasCache = this.cachePatterns.some(pattern => loopText.toLowerCase().includes(pattern));

                let description = `Detected potential costly operation '${callName}' inside a loop. `;
                let title = 'Costly Operation in Loop';

                if (hasCache) {
                    // Logic exists, but still warn gently or maybe skip? 
                    // Let's warn but acknowledge the cache
                    description += `It looks like you have some caching logic, but verify it effectively reduces calls.`;
                    title = 'Verify Cache Effectiveness';
                } else {
                    if (lowerName.includes('categorize') || lowerName.includes('classify')) {
                         description += `Classification tasks often have repeating inputs. Implement a local cache (Map) or Redis to skip redundant calls.`;
                    } else {
                         description += `Consider implementing a Read-Through Cache (Redis/Memcached) or Batching requests to reduce costs.`;
                    }
                }

                suggestions.push({
                    id: `loop-cost-${node.loc.start.line}`,
                    title: title,
                    description: description,
                    severity: hasCache ? 'info' : 'warning',
                    location: {
                        fileUri: fileUri,
                        startLine: node.loc.start.line,
                        startColumn: node.loc.start.column,
                        endLine: node.loc.end.line,
                        endColumn: node.loc.end.column
                    },
                    costImpact: hasCache ? 'Low' : 'High'
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
        
        let loopIndentLevels: { indent: number, startLine: number }[] = []; 

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trim = line.trim();
            if (!trim || trim.startsWith('#')) continue;

            const indent = line.search(/\S/);
            
            // Manage loop stack
            loopIndentLevels = loopIndentLevels.filter(level => level.indent < indent);

            // Check if this line starts a loop
            if (trim.startsWith('for ') || trim.startsWith('while ')) {
                loopIndentLevels.push({ indent, startLine: i });
            }

            // If we are deep inside a loop
            if (loopIndentLevels.length > 0) {
                const currentLoop = loopIndentLevels[loopIndentLevels.length - 1];
                if (indent > currentLoop.indent) {
                     // Check for costly calls
                    const match = this.costPatterns.some(pattern => trim.toLowerCase().includes(pattern.toLowerCase()));
                    
                    if (match && !trim.startsWith('for ') && !trim.startsWith('while ')) {
                         // Naive check for cache in the "surrounding lines" (heuristic: look back a few lines or check if file has redis)
                         // Since we stream read lines, checking "loop body" is hard without full AST. 
                         // Check for cache keywords in THIS line or variable names
                         const hasCache = this.cachePatterns.some(pattern => trim.toLowerCase().includes(pattern));

                         let description = `Detected costly operation inside a loop (Python). '${trim}'`;
                         let title = 'Costly Operation in Loop';

                         if (hasCache) {
                             description += ` Verify caching logic.`;
                             title = 'Verify Cache Effectiveness';
                         } else {
                             description += ` Consider Redis/Memcached or Batching.`;
                         }

                         suggestions.push({
                            id: `loop-cost-py-${i + 1}`,
                            title: title,
                            description: description,
                            severity: hasCache ? 'info' : 'warning',
                            location: {
                                fileUri: fileUri,
                                startLine: i + 1,
                                startColumn: indent,
                                endLine: i + 1,
                                endColumn: line.length
                            },
                            costImpact: hasCache ? 'Low' : 'High'
                        });
                    }
                }
            }
        }

        return suggestions;
    }
}
