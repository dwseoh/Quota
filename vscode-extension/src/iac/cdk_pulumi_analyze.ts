import { OptimizationSuggestion } from '../optimization/types';
import {
  NAT_GATEWAY_BASE_MONTHLY,
  fargateMonthly,
  GCP_COMPUTE_COSTS,
  GCP_SQL_COSTS,
  GKE_CLUSTER_MONTHLY,
} from './price_table';
import {
  makeSuggestion,
  lookupEc2,
  lookupRds,
  lookupElasticache,
  resolveCdkInstanceType,
  resolvePulumiInstanceType,
} from './helpers';

function isIacFile(content: string): boolean {
  return /from\s+['"](?:aws-cdk-lib|@aws-cdk\/|@pulumi\/aws|@pulumi\/awsx|sst['"]|sst\/constructs)/.test(content);
}

function scanWindow(lines: string[], startLine: number, windowSize: number, pattern: RegExp): RegExpMatchArray | null {
  const end = Math.min(startLine + windowSize, lines.length);
  for (let i = startLine; i < end; i++) {
    const m = lines[i].match(pattern);
    if (m) {
      return m;
    }
  }
  return null;
}

function extractEc2Type(lines: string[], startIdx: number): string | null {
  const cdkEnumPattern = /InstanceType\.of\s*\(\s*(?:\w+\.)?InstanceClass\.(\w+)\s*,\s*(?:\w+\.)?InstanceSize\.(\w+)\s*\)/;
  const m1 = scanWindow(lines, startIdx, 20, cdkEnumPattern);
  if (m1) {
    return resolveCdkInstanceType(m1[1], m1[2]);
  }

  const stringPattern = /(?:instanceType|instance_type)\s*[=:]\s*(?:new\s+(?:\w+\.)?InstanceType\s*\(\s*)?['"`]([^'"`]+)['"`]/;
  const m2 = scanWindow(lines, startIdx, 20, stringPattern);
  if (m2) {
    return m2[1].toLowerCase();
  }

  return null;
}

function extractRdsType(lines: string[], startIdx: number): string | null {
  const cdkEnumPattern = /InstanceType\.of\s*\(\s*(?:\w+\.)?InstanceClass\.(\w+)\s*,\s*(?:\w+\.)?InstanceSize\.(\w+)\s*\)/;
  const m1 = scanWindow(lines, startIdx, 20, cdkEnumPattern);
  if (m1) {
    const resolved = resolveCdkInstanceType(m1[1], m1[2]);
    if (resolved) {
      return `db.${resolved}`;
    }
  }

  const stringPattern = /instanceClass\s*:\s*['"`](db\.[^'"`]+)['"`]/;
  const m2 = scanWindow(lines, startIdx, 20, stringPattern);
  if (m2) {
    return m2[1].toLowerCase();
  }

  return null;
}

function extractPulumiEc2Type(lines: string[], startIdx: number): string | null {
  const stringPattern = /instanceType\s*:\s*['"`]([^'"`]+)['"`]/;
  const m1 = scanWindow(lines, startIdx, 15, stringPattern);
  if (m1) {
    return m1[1].toLowerCase();
  }

  const enumPattern = /instanceType\s*:\s*aws\.ec2\.InstanceType\.(\w+)/;
  const m2 = scanWindow(lines, startIdx, 15, enumPattern);
  if (m2) {
    return resolvePulumiInstanceType(m2[1]);
  }

  return null;
}

export function analyzeCdkPulumi(content: string, filePath: string): OptimizationSuggestion[] {
  if (!isIacFile(content)) {
    return [];
  }

  const suggestions: OptimizationSuggestion[] = [];
  const lines = content.split('\n');

  const constructors: Array<{
    pattern: RegExp;
    handler: (lineIdx: number, lines: string[], filePath: string) => OptimizationSuggestion | null;
  }> = [
    {
      pattern: /new\s+(?:ec2\.)?(?:CfnInstance|Instance)\s*\(/,
      handler: (i, lines, fp) => {
        const resolved = extractEc2Type(lines, i);
        const cost = resolved ? lookupEc2(resolved) : undefined;
        if (resolved === null && cost === undefined) {
          return null;
        }
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
    {
      pattern: /new\s+(?:ecs\.)?FargateTaskDefinition\s*\(/,
      handler: (i, lines, fp) => {
        const cpuMatch = scanWindow(lines, i, 10, /cpu\s*:\s*(\d+)/);
        const memMatch = scanWindow(lines, i, 10, /memoryLimitMiB\s*:\s*(\d+)/);
        const vcpu = cpuMatch ? parseInt(cpuMatch[1], 10) / 1024 : 0.25;
        const memGb = memMatch ? parseInt(memMatch[1], 10) / 1024 : 0.5;
        const cost = fargateMonthly(vcpu, memGb);
        return makeSuggestion(
          `iac-cdk-fargate-${fp}-${i}`, fp, i + 1,
          `fargate task ${vcpu} vcpu / ${memGb.toFixed(1)} gb — $${cost.toFixed(2)}/mo`,
          'aws fargate task definition. cost per running task — multiply by task count.',
          cost,
        );
      },
    },
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
    {
      pattern: /new\s+gcp\.compute\.Instance\s*\(/,
      handler: (i, lines, fp) => {
        const m = scanWindow(lines, i, 15, /machineType\s*:\s*['"`]([^'"`]+)['"`]/);
        const machineType = m ? m[1].toLowerCase() : null;
        const cost = machineType ? GCP_COMPUTE_COSTS[machineType] : undefined;
        return makeSuggestion(
          `iac-pulumi-gce-${fp}-${i}`, fp, i + 1,
          `gce ${machineType || 'instance'}${cost !== undefined ? ` — $${cost.toFixed(2)}/mo` : ''}`,
          cost !== undefined ? 'gcp compute engine instance. estimated monthly at full uptime (us-central1).' : 'gcp compute engine instance. specify machineType to estimate cost.',
          cost ?? null,
        );
      },
    },
    {
      pattern: /new\s+gcp\.sql\.DatabaseInstance\s*\(/,
      handler: (i, lines, fp) => {
        const m = scanWindow(lines, i, 20, /tier\s*:\s*['"`](db-[^'"`]+)['"`]/);
        const tier = m ? m[1].toLowerCase() : null;
        const cost = tier ? GCP_SQL_COSTS[tier] : undefined;
        return makeSuggestion(
          `iac-pulumi-cloudsql-${fp}-${i}`, fp, i + 1,
          `cloud sql ${tier || 'instance'}${cost !== undefined ? ` — $${cost.toFixed(2)}/mo` : ''}`,
          cost !== undefined ? 'gcp cloud sql (no ha, storage not included). estimated monthly (us-central1).' : 'gcp cloud sql instance.',
          cost ?? null,
        );
      },
    },
    {
      pattern: /new\s+gcp\.cloudrun(?:v2)?\.Service\s*\(/,
      handler: (i, _lines, fp) => {
        return makeSuggestion(
          `iac-pulumi-cloudrun-${fp}-${i}`, fp, i + 1,
          'cloud run service — cost depends on requests',
          'gcp cloud run: billed per request + cpu/memory while handling traffic. generous free tier (2m requests/mo).',
          null,
        );
      },
    },
    {
      pattern: /new\s+gcp\.container\.Cluster\s*\(/,
      handler: (i, _lines, fp) => {
        return makeSuggestion(
          `iac-pulumi-gke-${fp}-${i}`, fp, i + 1,
          `gke cluster — $${GKE_CLUSTER_MONTHLY.toFixed(2)}/mo management fee`,
          'gcp gke: $0.10/hr cluster management fee. node vm costs are additional.',
          GKE_CLUSTER_MONTHLY,
        );
      },
    },
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const { pattern, handler } of constructors) {
      if (pattern.test(line)) {
        const suggestion = handler(i, lines, filePath);
        if (suggestion) {
          suggestions.push(suggestion);
        }
        break;
      }
    }
  }

  return suggestions;
}
