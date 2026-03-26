// iac cost detector — finds cloud resource declarations and estimates monthly costs.
// supports: terraform (.tf), aws cdk (typescript), pulumi (typescript).
// registered as an OptimizationDetector so results surface in the "Optimization & Infra" tree panel.

import { OptimizationDetector, OptimizationSuggestion, FileContext } from '../optimization/types';
import {
    EC2_COSTS, RDS_COSTS, ELASTICACHE_COSTS,
    NAT_GATEWAY_BASE_MONTHLY, fargateMonthly,
    CDK_CLASS_MAP, CDK_SIZE_MAP,
} from './price_table';

// ---- helpers ----------------------------------------------------------------

function severityFor(monthly: number): 'info' | 'warning' | 'critical' {
    if (monthly >= 100) return 'critical';
    if (monthly >= 30) return 'warning';
    return 'info';
}

function makeSuggestion(
    id: string,
    filePath: string,
    line: number,          // 1-indexed
    title: string,
    description: string,
    monthly: number | null,
): OptimizationSuggestion {
    const costImpact = monthly !== null ? `$${monthly.toFixed(2)}/mo` : 'variable';
    return {
        id,
        title,
        description,
        severity: monthly !== null ? severityFor(monthly) : 'info',
        costImpact,
        location: {
            fileUri: filePath,
            startLine: line,
            startColumn: 1,
            endLine: line,
            endColumn: 1,
        },
    };
}

// converts "t3.micro" → looks up in table, returns undefined if not found
function lookupEc2(instanceType: string): number | undefined {
    return EC2_COSTS[instanceType.toLowerCase()];
}

function lookupRds(instanceClass: string): number | undefined {
    return RDS_COSTS[instanceClass.toLowerCase()];
}

function lookupElasticache(nodeType: string): number | undefined {
    return ELASTICACHE_COSTS[nodeType.toLowerCase()];
}

// resolve cdk InstanceType.of(InstanceClass.T3, InstanceSize.MICRO) → "t3.micro"
function resolveCdkInstanceType(classVal: string, sizeVal: string): string | null {
    const family = CDK_CLASS_MAP[classVal.toUpperCase()];
    const size   = CDK_SIZE_MAP[sizeVal.toUpperCase()];
    if (!family || !size) return null;
    return `${family}.${size}`;
}

// resolve pulumi aws.ec2.InstanceType.T3Micro style enums → "t3.micro"
// pattern: first letter + rest of camel-case → lowercase with dot
// e.g. T3Micro → t3.micro, M5Large → m5.large, C6IXlarge → c6i.xlarge
function resolvePulumiInstanceType(enumVal: string): string | null {
    // split camelCase at boundaries between letter groups and size suffixes
    const m = enumVal.match(/^([A-Z][0-9a-z]*(?:[A-Z][0-9a-z]*)?)([A-Z][a-z]+(?:[0-9]+[a-z]*)?)$/);
    if (!m) return null;
    const family = m[1].toLowerCase();
    // size: Micro→micro, Small→small, Medium→medium, Large→large, Xlarge→xlarge,
    //       X2large→2xlarge, X4large→4xlarge
    let size = m[2].toLowerCase();
    size = size.replace(/^x(\d+)(large)$/, '$1x$2').replace(/^(\d+)xlarge$/, '$1xlarge');
    return `${family}.${size}`;
}

// ---- terraform parser -------------------------------------------------------

function analyzeTerraform(content: string, filePath: string): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    const lines = content.split('\n');

    let resourceType = '';
    let resourceName = '';
    let blockStartLine = 0;
    let braceDepth = 0;
    // per-block state
    let instanceType = '';
    let fargateVcpu = 0;
    let fargateMemMib = 0;

    const flush = (endLine: number) => {
        const id = `iac-tf-${resourceType}-${resourceName}-${filePath}`;
        switch (resourceType) {
            case 'aws_instance': {
                const cost = lookupEc2(instanceType);
                suggestions.push(makeSuggestion(
                    id, filePath, blockStartLine,
                    `ec2 ${instanceType || 'instance'}${cost !== undefined ? ` — $${cost.toFixed(2)}/mo` : ''}`,
                    `aws ec2 on-demand instance. ${cost !== undefined ? 'estimated monthly at full uptime (us-east-1).' : 'unknown instance type — check aws pricing.'}`,
                    cost ?? null,
                ));
                break;
            }
            case 'aws_db_instance': {
                const cost = lookupRds(instanceType);
                suggestions.push(makeSuggestion(
                    id, filePath, blockStartLine,
                    `rds ${instanceType || 'instance'}${cost !== undefined ? ` — $${cost.toFixed(2)}/mo` : ''}`,
                    `aws rds on-demand instance (single-az, storage not included). ${cost !== undefined ? 'estimated monthly cost (us-east-1).' : 'unknown instance class.'}`,
                    cost ?? null,
                ));
                break;
            }
            case 'aws_elasticache_cluster':
            case 'aws_elasticache_replication_group': {
                const cost = lookupElasticache(instanceType);
                suggestions.push(makeSuggestion(
                    id, filePath, blockStartLine,
                    `elasticache ${instanceType || 'node'}${cost !== undefined ? ` — $${cost.toFixed(2)}/mo` : ''}`,
                    `aws elasticache single-node. ${cost !== undefined ? 'estimated monthly (us-east-1).' : 'unknown node type.'}`,
                    cost ?? null,
                ));
                break;
            }
            case 'aws_nat_gateway': {
                suggestions.push(makeSuggestion(
                    id, filePath, blockStartLine,
                    `nat gateway — $${NAT_GATEWAY_BASE_MONTHLY.toFixed(2)}/mo base`,
                    'aws nat gateway: $0.045/hr base + $0.045/GB processed. often a hidden cost — consider nat instance for low-traffic setups.',
                    NAT_GATEWAY_BASE_MONTHLY,
                ));
                break;
            }
            case 'aws_ecs_task_definition': {
                if (fargateVcpu > 0 || fargateMemMib > 0) {
                    const vcpu = fargateVcpu / 1024;
                    const memGb = fargateMemMib / 1024;
                    const cost = fargateMonthly(vcpu, memGb);
                    suggestions.push(makeSuggestion(
                        id, filePath, blockStartLine,
                        `fargate task ${vcpu} vcpu / ${memGb.toFixed(1)} gb — $${cost.toFixed(2)}/mo`,
                        'aws fargate task definition. cost per running task — multiply by task count.',
                        cost,
                    ));
                }
                break;
            }
            case 'aws_lambda_function': {
                suggestions.push(makeSuggestion(
                    id, filePath, blockStartLine,
                    'lambda function — cost depends on invocations',
                    'aws lambda: first 1m requests/mo free, then $0.20/million + compute time. negligible at low scale.',
                    null,
                ));
                break;
            }
        }
        // reset per-block state
        instanceType = '';
        fargateVcpu = 0;
        fargateMemMib = 0;
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // resource block start
        const resourceMatch = trimmed.match(/^resource\s+"(\w+)"\s+"(\w+)"\s*\{/);
        if (resourceMatch && braceDepth === 0) {
            resourceType = resourceMatch[1];
            resourceName = resourceMatch[2];
            blockStartLine = i + 1;
            braceDepth = 1;
            continue;
        }

        if (braceDepth === 0) continue;

        // track nesting
        for (const ch of line) {
            if (ch === '{') braceDepth++;
            else if (ch === '}') braceDepth--;
        }

        if (braceDepth <= 0) {
            flush(i + 1);
            braceDepth = 0;
            resourceType = '';
            continue;
        }

        // only parse top-level properties (depth 1 means inside the resource block)
        if (braceDepth !== 1) continue;

        // extract property values
        const kvMatch = trimmed.match(/^(\w+)\s*=\s*"([^"]+)"/);
        if (!kvMatch) continue;
        const [, key, val] = kvMatch;

        switch (key) {
            case 'instance_type':  instanceType = val; break;
            case 'instance_class': instanceType = val; break;
            case 'node_type':      instanceType = val; break;
            case 'cpu':            fargateVcpu = parseInt(val) || 0; break;
            case 'memory':         fargateMemMib = parseInt(val) || 0; break;
        }
    }

    return suggestions;
}

// ---- cdk / pulumi typescript parser -----------------------------------------

// quick check: only run expensive scan on files that import cdk/pulumi
function isIacFile(content: string): boolean {
    return /from\s+['"](?:aws-cdk-lib|@aws-cdk\/|@pulumi\/aws|@pulumi\/awsx|sst['"]|sst\/constructs)/.test(content);
}

// scan up to `windowSize` lines starting at `startLine` for a regex, return first match
function scanWindow(lines: string[], startLine: number, windowSize: number, pattern: RegExp): RegExpMatchArray | null {
    const end = Math.min(startLine + windowSize, lines.length);
    for (let i = startLine; i < end; i++) {
        const m = lines[i].match(pattern);
        if (m) return m;
    }
    return null;
}

function analyzeCdkPulumi(content: string, filePath: string): OptimizationSuggestion[] {
    if (!isIacFile(content)) return [];

    const suggestions: OptimizationSuggestion[] = [];
    const lines = content.split('\n');

    // patterns for constructor calls (line-level detection)
    const constructors: Array<{
        pattern: RegExp;
        handler: (lineIdx: number, lines: string[], filePath: string) => OptimizationSuggestion | null;
    }> = [
        // ec2 instance
        {
            pattern: /new\s+(?:ec2\.)?(?:CfnInstance|Instance)\s*\(/,
            handler: (i, lines, fp) => {
                const resolved = extractEc2Type(lines, i);
                const cost = resolved ? lookupEc2(resolved) : undefined;
                if (resolved === null && cost === undefined) return null; // nothing useful to show
                const id = `iac-cdk-ec2-${fp}-${i}`;
                return makeSuggestion(
                    id, fp, i + 1,
                    `ec2 ${resolved || 'instance'}${cost !== undefined ? ` — $${cost.toFixed(2)}/mo` : ''}`,
                    cost !== undefined
                        ? 'aws ec2 instance. estimated monthly at full uptime (us-east-1).'
                        : 'aws ec2 instance. specify instanceType to estimate cost.',
                    cost ?? null,
                );
            },
        },
        // rds
        {
            pattern: /new\s+(?:rds\.)?(?:DatabaseInstance|CfnDBInstance)\s*\(/,
            handler: (i, lines, fp) => {
                const resolved = extractRdsType(lines, i);
                const cost = resolved ? lookupRds(resolved) : undefined;
                const id = `iac-cdk-rds-${fp}-${i}`;
                return makeSuggestion(
                    id, fp, i + 1,
                    `rds ${resolved || 'instance'}${cost !== undefined ? ` — $${cost.toFixed(2)}/mo` : ''}`,
                    cost !== undefined
                        ? 'aws rds instance (single-az, storage not included). estimated monthly (us-east-1).'
                        : 'aws rds instance. specify instanceType to estimate cost.',
                    cost ?? null,
                );
            },
        },
        // elasticache
        {
            pattern: /new\s+(?:elasticache\.)?CfnCacheCluster\s*\(/,
            handler: (i, lines, fp) => {
                const m = scanWindow(lines, i, 15, /cacheNodeType\s*:\s*['"`]([^'"`]+)['"`]/);
                const nodeType = m ? m[1] : null;
                const cost = nodeType ? lookupElasticache(nodeType) : undefined;
                const id = `iac-cdk-elasticache-${fp}-${i}`;
                return makeSuggestion(
                    id, fp, i + 1,
                    `elasticache ${nodeType || 'cluster'}${cost !== undefined ? ` — $${cost.toFixed(2)}/mo` : ''}`,
                    'aws elasticache single node. multiply by node count for clusters.',
                    cost ?? null,
                );
            },
        },
        // nat gateway
        {
            pattern: /new\s+(?:ec2\.)?NatGateway\s*\(/,
            handler: (i, _lines, fp) => {
                return makeSuggestion(
                    `iac-cdk-nat-${fp}-${i}`, fp, i + 1,
                    `nat gateway — $${NAT_GATEWAY_BASE_MONTHLY.toFixed(2)}/mo base`,
                    'aws nat gateway: $0.045/hr base + $0.045/GB processed. consider nat instance for low-traffic setups.',
                    NAT_GATEWAY_BASE_MONTHLY,
                );
            },
        },
        // fargate task definition
        {
            pattern: /new\s+(?:ecs\.)?FargateTaskDefinition\s*\(/,
            handler: (i, lines, fp) => {
                const cpuMatch = scanWindow(lines, i, 10, /cpu\s*:\s*(\d+)/);
                const memMatch = scanWindow(lines, i, 10, /memoryLimitMiB\s*:\s*(\d+)/);
                const vcpu = cpuMatch ? parseInt(cpuMatch[1]) / 1024 : 0.25;
                const memGb = memMatch ? parseInt(memMatch[1]) / 1024 : 0.5;
                const cost = fargateMonthly(vcpu, memGb);
                return makeSuggestion(
                    `iac-cdk-fargate-${fp}-${i}`, fp, i + 1,
                    `fargate task ${vcpu} vcpu / ${memGb.toFixed(1)} gb — $${cost.toFixed(2)}/mo`,
                    'aws fargate task definition. cost per running task — multiply by task count.',
                    cost,
                );
            },
        },
        // lambda
        {
            pattern: /new\s+(?:lambda\.)?(?:Function|NodejsFunction|PythonFunction|GoFunction)\s*\(/,
            handler: (i, _lines, fp) => {
                return makeSuggestion(
                    `iac-cdk-lambda-${fp}-${i}`, fp, i + 1,
                    'lambda function — cost depends on invocations',
                    'aws lambda: first 1m requests/mo free, then $0.20/million + compute time. negligible at low scale.',
                    null,
                );
            },
        },
        // pulumi ec2
        {
            pattern: /new\s+aws\.ec2\.Instance\s*\(/,
            handler: (i, lines, fp) => {
                const resolved = extractPulumiEc2Type(lines, i);
                const cost = resolved ? lookupEc2(resolved) : undefined;
                const id = `iac-pulumi-ec2-${fp}-${i}`;
                return makeSuggestion(
                    id, fp, i + 1,
                    `ec2 ${resolved || 'instance'}${cost !== undefined ? ` — $${cost.toFixed(2)}/mo` : ''}`,
                    cost !== undefined ? 'aws ec2 instance. estimated monthly at full uptime (us-east-1).' : 'aws ec2 instance. specify instanceType to estimate cost.',
                    cost ?? null,
                );
            },
        },
        // pulumi rds
        {
            pattern: /new\s+aws\.rds\.Instance\s*\(/,
            handler: (i, lines, fp) => {
                const m = scanWindow(lines, i, 15, /instanceClass\s*:\s*(?:aws\.rds\.InstanceType\.)?\s*['"`]?([db.\w]+)['"`]?/);
                const instanceClass = m ? m[1].toLowerCase() : null;
                const cost = instanceClass ? lookupRds(instanceClass) : undefined;
                const id = `iac-pulumi-rds-${fp}-${i}`;
                return makeSuggestion(
                    id, fp, i + 1,
                    `rds ${instanceClass || 'instance'}${cost !== undefined ? ` — $${cost.toFixed(2)}/mo` : ''}`,
                    cost !== undefined ? 'aws rds instance. estimated monthly (single-az, us-east-1).' : 'aws rds instance.',
                    cost ?? null,
                );
            },
        },
        // sst function (ion)
        {
            pattern: /new\s+sst\.aws\.Function\s*\(/,
            handler: (i, _lines, fp) => {
                return makeSuggestion(
                    `iac-sst-fn-${fp}-${i}`, fp, i + 1,
                    'sst function — cost depends on invocations',
                    'sst aws function (backed by lambda). negligible at low scale.',
                    null,
                );
            },
        },
    ];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const { pattern, handler } of constructors) {
            if (pattern.test(line)) {
                const suggestion = handler(i, lines, filePath);
                if (suggestion) suggestions.push(suggestion);
                break; // one match per line
            }
        }
    }

    return suggestions;
}

// extract ec2 instance type from cdk constructor context
function extractEc2Type(lines: string[], startIdx: number): string | null {
    // cdk: InstanceType.of(InstanceClass.T3, InstanceSize.MICRO)
    const cdkEnumPattern = /InstanceType\.of\s*\(\s*(?:\w+\.)?InstanceClass\.(\w+)\s*,\s*(?:\w+\.)?InstanceSize\.(\w+)\s*\)/;
    const m1 = scanWindow(lines, startIdx, 20, cdkEnumPattern);
    if (m1) return resolveCdkInstanceType(m1[1], m1[2]);

    // string literal: instanceType: 't3.micro' or new InstanceType('t3.micro')
    const stringPattern = /(?:instanceType|instance_type)\s*[=:]\s*(?:new\s+(?:\w+\.)?InstanceType\s*\(\s*)?['"`]([^'"`]+)['"`]/;
    const m2 = scanWindow(lines, startIdx, 20, stringPattern);
    if (m2) return m2[1].toLowerCase();

    return null;
}

// extract rds instance class from cdk constructor context
function extractRdsType(lines: string[], startIdx: number): string | null {
    // cdk: instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM)
    const cdkEnumPattern = /InstanceType\.of\s*\(\s*(?:\w+\.)?InstanceClass\.(\w+)\s*,\s*(?:\w+\.)?InstanceSize\.(\w+)\s*\)/;
    const m1 = scanWindow(lines, startIdx, 20, cdkEnumPattern);
    if (m1) {
        const resolved = resolveCdkInstanceType(m1[1], m1[2]);
        if (resolved) return `db.${resolved}`;
    }

    // cdk: instanceType: ec2.InstanceType.of(...)  — covered above
    // string: instanceClass: 'db.t3.medium'
    const stringPattern = /instanceClass\s*:\s*['"`](db\.[^'"`]+)['"`]/;
    const m2 = scanWindow(lines, startIdx, 20, stringPattern);
    if (m2) return m2[1].toLowerCase();

    return null;
}

function extractPulumiEc2Type(lines: string[], startIdx: number): string | null {
    // string literal: instanceType: "t3.micro"
    const stringPattern = /instanceType\s*:\s*['"`]([^'"`]+)['"`]/;
    const m1 = scanWindow(lines, startIdx, 15, stringPattern);
    if (m1) return m1[1].toLowerCase();

    // pulumi enum: instanceType: aws.ec2.InstanceType.T3Micro
    const enumPattern = /instanceType\s*:\s*aws\.ec2\.InstanceType\.(\w+)/;
    const m2 = scanWindow(lines, startIdx, 15, enumPattern);
    if (m2) return resolvePulumiInstanceType(m2[1]);

    return null;
}

// ---- detector class ---------------------------------------------------------

export class IacDetector implements OptimizationDetector {
    id = 'iac-cost-detector';

    // 'tf' matches .tf files (extension.ts maps languageId as ext for unknown types)
    targetFileTypes = ['typescript', 'javascript', 'tf'];

    async analyze(context: FileContext): Promise<OptimizationSuggestion[]> {
        const ext = context.uri.fsPath.split('.').pop() || '';

        if (ext === 'tf') {
            return analyzeTerraform(context.content, context.uri.fsPath);
        }

        if (ext === 'ts' || ext === 'tsx' || ext === 'js' || ext === 'jsx') {
            return analyzeCdkPulumi(context.content, context.uri.fsPath);
        }

        return [];
    }
}
