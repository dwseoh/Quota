import { OptimizationDetector, OptimizationSuggestion, FileContext } from '../types';
import { CodeUnit } from '../../types';
import { parse } from '@typescript-eslint/parser';
import * as path from 'path';
import { execFile } from 'child_process';
import { findPythonBin } from '../../ast_parser';
import { findGoBin } from '../../ast_parser/go_parse';

const PYTHON_LOOP_SCRIPT = path.join(__dirname, '../../../scripts/loop_detector_ast.py');
const GO_LOOP_SCRIPT = path.join(__dirname, '../../../scripts/loop_detector_ast.go');

export class LoopDetector implements OptimizationDetector {
    id = 'loop-detector';
    targetFileTypes = ['typescript', 'javascript', 'python', 'go', 'javascriptreact', 'typescriptreact', '.ts', '.js', '.py', '.go', '.tsx', '.jsx'];

    // costly operations that are unambiguously expensive inside a loop.
    // deliberately narrow — avoid generic names like 'get', 'put', 'find' that
    // match almost everything and produce noisy false positives.
    private costPatterns = [
        // llm sdks (ts/js and python)
        'completions.create', 'messages.create', 'generatecontent', 'generatetext', 'streamtext',
        'ChatCompletion.create', 'Completion.create',   // python old openai sdk
        // http clients — ts/js
        'axios.get', 'axios.post', 'axios.put', 'axios.delete',
        // match call name `fetch` (not `fetch(` — getCallName has no parens)
        'fetch',
        // mongoose-style chain
        'users.find',
        // http clients — python
        'requests.get', 'requests.post', 'requests.put', 'requests.delete',
        'httpx.get', 'httpx.post', 'httpx.put', 'httpx.delete',
        // db — specific enough to not false-positive
        'prisma.', '.findunique', '.findmany', '.findbyid', '.findone',
        'dynamodb', 'docClient',
        'table.scan', 'client.scan',   // python boto3
    ];

    private cachePatterns = ['cache', 'redis', 'memcached', 'memoize', 'store', 'kv'];

    async analyze(context: FileContext, codeUnits?: CodeUnit[]): Promise<OptimizationSuggestion[]> {
        const isPython = context.languageId === 'python' || context.uri.fsPath.endsWith('.py');
        const isGo = context.languageId === 'go' || context.uri.fsPath.endsWith('.go');

        if (isPython) {
            return this.analyzePython(context.uri.fsPath, context.content, context.uri.toString());
        }
        if (isGo) {
            return this.analyzeGo(context.uri.fsPath, context.content, context.uri.toString());
        }
        return this.analyzeTypeScript(context.content, context.uri.toString());
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
                if (!node || typeof node !== 'object') {return;}

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

        } catch (_err) {
            // silently skip unparseable files (syntax errors, unsupported syntax)
        }
        return suggestions;
    }

    private getCallName(node: any): string {
        if (!node) {return '';}
        if (node.type === 'Identifier') {return node.name;}
        if (node.type === 'MemberExpression' && node.property.type === 'Identifier') {
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
            const match = this.costPatterns.some(pattern => {
                const p = pattern.toLowerCase();
                if (p === 'fetch') {
                    return lowerName === 'fetch' || lowerName.endsWith('.fetch');
                }
                return lowerName.includes(p);
            });
            
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
     * analyze go using go/ast subprocess, no fallback (indentation is unreliable for go).
     */
    private async analyzeGo(filePath: string, content: string, fileUri: string): Promise<OptimizationSuggestion[]> {
        const bin = await findGoBin();
        if (!bin) { return []; }

        try {
            const stdout = await new Promise<string>((resolve, reject) => {
                execFile(
                    bin,
                    ['run', GO_LOOP_SCRIPT, filePath],
                    {
                        timeout: 15000,
                        maxBuffer: 2 * 1024 * 1024,
                        cwd: path.dirname(GO_LOOP_SCRIPT),
                    },
                    (err, out) => {
                        if (err) { reject(err); }
                        else { resolve(out); }
                    },
                );
            });

            const hits: Array<{ line: number; col: number; callName: string; loopStartLine: number }> = JSON.parse(stdout);
            return hits.map(hit => {
                const loopText = content.split('\n').slice(hit.loopStartLine - 1).join('\n');
                const hasCache = this.cachePatterns.some(p => loopText.toLowerCase().includes(p));
                return {
                    id: `loop-cost-go-${hit.line}`,
                    title: hasCache ? 'Verify Cache Effectiveness' : 'Costly Operation in Loop',
                    description: `Detected potential costly operation '${hit.callName}' inside a loop. ` +
                        (hasCache
                            ? `It looks like you have some caching logic, but verify it effectively reduces calls.`
                            : `Consider implementing a Read-Through Cache (Redis/Memcached) or Batching requests to reduce costs.`),
                    severity: (hasCache ? 'info' : 'warning') as 'info' | 'warning',
                    location: {
                        fileUri,
                        startLine: hit.line,
                        startColumn: hit.col,
                        endLine: hit.line,
                        endColumn: hit.col + hit.callName.length,
                    },
                    costImpact: hasCache ? 'Low' : 'High',
                };
            });
        } catch {
            return [];
        }
    }

    /**
     * analyze python using ast subprocess (python 3.8+), falling back to indentation heuristic.
     */
    private async analyzePython(filePath: string, content: string, fileUri: string): Promise<OptimizationSuggestion[]> {
        const bin = await findPythonBin();
        if (bin) {
            try {
                const stdout = await new Promise<string>((resolve, reject) => {
                    execFile(bin, [PYTHON_LOOP_SCRIPT, filePath], {
                        timeout: 10000,
                        maxBuffer: 2 * 1024 * 1024,
                    }, (err, out) => {
                        if (err) {reject(err);}
                        else {resolve(out);}
                    });
                });

                const hits: Array<{ line: number; col: number; callName: string; loopStartLine: number }> = JSON.parse(stdout);
                return hits.map(hit => {
                    const loopText = content.split('\n').slice(hit.loopStartLine - 1).join('\n');
                    const hasCache = this.cachePatterns.some(p => loopText.toLowerCase().includes(p));
                    let title = 'Costly Operation in Loop';
                    let description = `Detected potential costly operation '${hit.callName}' inside a loop. `;
                    if (hasCache) {
                        title = 'Verify Cache Effectiveness';
                        description += `It looks like you have some caching logic, but verify it effectively reduces calls.`;
                    } else {
                        description += `Consider implementing a Read-Through Cache (Redis/Memcached) or Batching requests to reduce costs.`;
                    }
                    return {
                        id: `loop-cost-py-${hit.line}`,
                        title,
                        description,
                        severity: (hasCache ? 'info' : 'warning') as 'info' | 'warning',
                        location: {
                            fileUri,
                            startLine: hit.line,
                            startColumn: hit.col,
                            endLine: hit.line,
                            endColumn: hit.col + hit.callName.length
                        },
                        costImpact: hasCache ? 'Low' : 'High'
                    };
                });
            } catch {
                // fall through to indentation heuristic
            }
        }

        return this.analyzePythonFallback(content, fileUri);
    }

    /**
     * indentation-based fallback for when python3 is not available.
     */
    private analyzePythonFallback(content: string, fileUri: string): OptimizationSuggestion[] {
        const suggestions: OptimizationSuggestion[] = [];
        const lines = content.split('\n');
        let loopIndentLevels: { indent: number; startLine: number }[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trim = line.trim();
            if (!trim || trim.startsWith('#')) {continue;}

            const indent = line.search(/\S/);
            loopIndentLevels = loopIndentLevels.filter(l => l.indent < indent);

            if (trim.startsWith('for ') || trim.startsWith('while ')) {
                loopIndentLevels.push({ indent, startLine: i });
            }

            if (loopIndentLevels.length > 0) {
                const currentLoop = loopIndentLevels[loopIndentLevels.length - 1];
                if (indent > currentLoop.indent) {
                    const match = this.costPatterns.some(p => trim.toLowerCase().includes(p.toLowerCase()));
                    if (match && !trim.startsWith('for ') && !trim.startsWith('while ')) {
                        const hasCache = this.cachePatterns.some(p => trim.toLowerCase().includes(p));
                        suggestions.push({
                            id: `loop-cost-py-${i + 1}`,
                            title: hasCache ? 'Verify Cache Effectiveness' : 'Costly Operation in Loop',
                            description: `Detected costly operation inside a loop (Python). '${trim}'` +
                                (hasCache ? ` Verify caching logic.` : ` Consider Redis/Memcached or Batching.`),
                            severity: hasCache ? 'info' : 'warning',
                            location: { fileUri, startLine: i + 1, startColumn: indent, endLine: i + 1, endColumn: line.length },
                            costImpact: hasCache ? 'Low' : 'High'
                        });
                    }
                }
            }
        }

        return suggestions;
    }
}
