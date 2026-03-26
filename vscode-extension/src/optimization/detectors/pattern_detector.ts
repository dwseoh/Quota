import { OptimizationDetector, OptimizationSuggestion, FileContext } from '../types';
import { CodeUnit } from '../../types';
import * as path from 'path';

interface PatternRule {
    id: string;
    regex: RegExp;
    title: string;
    message: string;
    severity: 'info' | 'warning' | 'critical';
    fileExtensions?: string[]; // If undefined, applies to all target files
    costImpact?: string;
}

export class PatternDetector implements OptimizationDetector {
    id = 'pattern-detector';
    // Broad list of target files
    targetFileTypes = ['*', '.ts', '.js', '.py', '.yml', '.yaml', '.json', '.tf', '.tfvars'];

    private rules: PatternRule[] = [
        // --- database ---
        {
            // matches dynamodb client scan calls: docClient.scan(, ddb.scan(, dynamodb.scan(
            id: 'dynamodb-scan',
            regex: /(?:docClient|ddb|dynamodb|DynamoDB|DocumentClient)\s*(?:\.\s*\w+\s*)?\.\s*scan\s*\(/g,
            title: 'dynamodb full table scan',
            message: 'avoid .scan() on dynamodb — reads every item in the table, costs scale with table size. use .query() with an index instead.',
            severity: 'warning',
            costImpact: 'High',
            fileExtensions: ['.ts', '.js']
        },
        {
            id: 'sql-select-all',
            regex: /SELECT\s+\*\s+FROM/gi,
            title: 'sql select *',
            message: 'select * fetches all columns including large blobs. specify only the columns you need to reduce data transfer and rds read costs.',
            severity: 'info',
            costImpact: 'Low',
            fileExtensions: ['.ts', '.js', '.sql']
        },
        {
            // .find({}) or .find() — mongo fetch without projection
            id: 'mongo-no-projection',
            regex: /\.find\(\s*(?:\{\s*\})?\s*\)(?!\s*\.(?:project|select)\s*\()/g,
            title: 'mongodb query without projection',
            message: 'fetching full documents is wasteful when you only need a few fields. pass a projection (second arg) to limit returned data.',
            severity: 'info',
            costImpact: 'Low',
            fileExtensions: ['.ts', '.js']
        },

        // --- llm ---
        {
            id: 'legacy-gpt4-32k',
            regex: /["']gpt-4-32k["']/g,
            title: 'legacy model: gpt-4-32k',
            message: 'gpt-4-32k is deprecated and far more expensive than gpt-4o. switch to gpt-4o or gpt-4o-mini.',
            severity: 'warning',
            costImpact: 'High',
            fileExtensions: ['.ts', '.js', '.json']
        },
        {
            id: 'legacy-davinci',
            regex: /["']text-davinci-00[23]["']/g,
            title: 'legacy model: text-davinci',
            message: 'davinci models are deprecated. switch to gpt-4o-mini for most tasks.',
            severity: 'warning',
            costImpact: 'Medium',
            fileExtensions: ['.ts', '.js', '.json']
        },
        {
            id: 'anthropic-prompt-caching',
            regex: /\.messages\.create\s*\(/g,
            title: 'consider anthropic prompt caching',
            message: 'if this call repeats large context (system prompt, docs), add cache_control headers to cut costs up to 90% on repeated tokens.',
            severity: 'info',
            costImpact: 'Medium',
            fileExtensions: ['.ts', '.js']
        },

        // --- ci/cd ---
        {
            id: 'github-large-runner',
            regex: /runs-on:\s*.*(?:large|xlarge|2xlarge|gpu)/ig,
            title: 'expensive github actions runner',
            message: 'large/xlarge runners cost 2-8x more than standard. verify the workload actually needs the extra cpu/memory.',
            severity: 'info',
            costImpact: 'Medium',
            fileExtensions: ['.yml', '.yaml']
        },

        // --- terraform ---
        {
            id: 'tf-gpu-instance',
            regex: /instance_type\s*=\s*["'](?:p3|p4|g4|g5)\.[^"']+["']/g,
            title: 'gpu ec2 instance',
            message: 'p/g-series gpu instances cost $500–$30,000+/mo. confirm this is intentional.',
            severity: 'critical',
            costImpact: 'Critical',
            fileExtensions: ['.tf']
        },
    ];

    async analyze(context: FileContext, codeUnits?: CodeUnit[]): Promise<OptimizationSuggestion[]> {
        const suggestions: OptimizationSuggestion[] = [];
        const ext = path.extname(context.uri.fsPath);
        const fileName = path.basename(context.uri.fsPath);

        for (const rule of this.rules) {
            // Check file extension match
            if (rule.fileExtensions && !rule.fileExtensions.includes(ext) && !rule.fileExtensions.includes(fileName)) {
                continue;
            }

            // Reset regex state
            rule.regex.lastIndex = 0;
            
            let match;
            while ((match = rule.regex.exec(context.content)) !== null) {
                const startIdx = match.index;
                const endIdx = match.index + match[0].length;
                
                const startPos = this.getLineCol(context.content, startIdx);
                const endPos = this.getLineCol(context.content, endIdx);

                let quickFix = undefined;
                if (rule.id === 'legacy-gpt4') {
                     quickFix = {
                         targetFile: context.uri.fsPath,
                         replacementRange: { startLine: startPos.line - 1, startColumn: startPos.col, endLine: endPos.line - 1, endColumn: endPos.col },
                         replacementText: '"gpt-4o"'
                     };
                } else if (rule.id === 'legacy-davinci') {
                     quickFix = {
                         targetFile: context.uri.fsPath,
                         replacementRange: { startLine: startPos.line - 1, startColumn: startPos.col, endLine: endPos.line - 1, endColumn: endPos.col },
                         replacementText: '"gpt-3.5-turbo-instruct"'
                     };
                }

                suggestions.push({
                    id: rule.id,
                    title: rule.title,
                    description: rule.message,
                    severity: rule.severity,
                    costImpact: rule.costImpact,
                    location: {
                        fileUri: context.uri.toString(),
                        startLine: startPos.line,
                        startColumn: startPos.col,
                        endLine: endPos.line,
                        endColumn: endPos.col
                    },
                    quickFix
                });
            }
        }

        return suggestions;
    }

    private getLineCol(content: string, index: number): { line: number, col: number } {
        const prefix = content.substring(0, index);
        const line = (prefix.match(/\n/g) || []).length + 1;
        const lastNewLine = prefix.lastIndexOf('\n');
        const col = index - (lastNewLine === -1 ? 0 : lastNewLine + 1);
        return { line, col };
    }
}
