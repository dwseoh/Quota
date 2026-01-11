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
        // --- Database ---
        {
            id: 'dynamodb-scan',
            regex: /\.scan\s*\(/g,
            title: 'Full Table Scan detected',
            message: 'Avoid using .scan() operations on DynamoDB as they are expensive and slow. Use .query() with an index instead.',
            severity: 'warning',
            costImpact: 'High',
            fileExtensions: ['.ts', '.js', '.py', '.java']
        },
        {
            id: 'sql-select-all',
            regex: /SELECT\s+\*\s+FROM/gi,
            title: 'Unoptimized SQL Query',
            message: 'Avoid "SELECT *". explicitly select call columns to reduce data transfer costs.',
            severity: 'info',
            costImpact: 'Low',
            fileExtensions: ['.ts', '.js', '.py', '.sql', '.go']
        },

        // --- LLM ---
        {
            id: 'legacy-gpt4',
            regex: /["']gpt-4-32k["']/g,
            title: 'Legacy Expensive Model',
            message: 'gpt-4-32k is significantly more expensive than gpt-4-turbo or gpt-4o. Consider upgrading.',
            severity: 'warning',
            costImpact: 'High',
            fileExtensions: ['.ts', '.js', '.py', '.json']
        },
        {
            id: 'legacy-davinci',
            regex: /["']text-davinci-003["']/g,
            title: 'Depreciated Model',
            message: 'Davinci models are deprecated and expensive. Switch to gpt-3.5-turbo-instruct or newer.',
            severity: 'warning',
            costImpact: 'Medium'
        },

        // --- Infrastructure (CI/CD, Cloud) ---
        {
            id: 'github-large-runner',
            regex: /runs-on:\s*.*(large|xlarge|2xlarge|gpu)/ig,
            title: 'Expensive CI Runner',
            message: 'Usage of large GitHub Actions runners detected. Verify if standard runners are sufficient.',
            severity: 'info',
            costImpact: 'Medium',
            fileExtensions: ['.yml', '.yaml']
        },
        {
            id: 'aws-gpu-instance',
            regex: /instance_type\s*=\s*["'].*p[34].*["']/g,
            title: 'Expensive GPU Instance',
            message: 'P-series GPU instances are very expensive. Ensure this is necessary for your workload.',
            severity: 'warning',
            costImpact: 'Critical',
            fileExtensions: ['.tf', '.tfvars']
        },
        {
            id: 'vercel-pro-config',
            regex: /"framework":\s*null/g, // Proxy for unoptimized usage? actually let's stick to memory
            title: 'High Function Memory',
            message: 'Check if high memory limits are needed.',
            severity: 'info',
            costImpact: 'Low',
            // Simple placeholder regex
            fileExtensions: ['.json']
        },
         {
            id: 'vercel-memory',
            regex: /"memory":\s*300[0-9]/g, // > 3000mb
            title: 'High Function Memory',
            message: 'High memory allocation detected (3GB+).',
            severity: 'warning',
            costImpact: 'Medium',
            fileExtensions: ['vercel.json']
        },

        // --- Advanced Patterns ---
        {
            id: 'anthropic-prompt-caching',
            regex: /anthropic\.messages\.create|Anthropic.*\.messages\.create/g,
            title: 'Consider Prompt Caching',
            message: 'If this call involves large repeated context (>1024 tokens), use Anthropic Prompt Caching headers to reduce costs by up to 90%.',
            severity: 'info',
            costImpact: 'Medium',
            fileExtensions: ['.ts', '.js', '.py']
        },
        {
            id: 'mongo-projection',
            regex: /\.find\(\s*(\{\s*\}|\s*)\)/g, // .find({}) or .find()
            title: 'Unoptimized Query (Projection)',
            message: 'Avoid fetching full documents if not needed. Use projection to select only necessary fields.',
            severity: 'info',
            costImpact: 'Low',
            fileExtensions: ['.ts', '.js']
        }
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
