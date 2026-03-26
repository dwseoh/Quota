import { OptimizationSuggestion } from '../optimization/types';
import {
  EC2_COSTS,
  RDS_COSTS,
  ELASTICACHE_COSTS,
  CDK_CLASS_MAP,
  CDK_SIZE_MAP,
} from './price_table';

export function severityFor(monthly: number): 'info' | 'warning' | 'critical' {
  if (monthly >= 100) {
    return 'critical';
  }
  if (monthly >= 30) {
    return 'warning';
  }
  return 'info';
}

export function makeSuggestion(
  id: string,
  filePath: string,
  line: number,
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

export function lookupEc2(instanceType: string): number | undefined {
  return EC2_COSTS[instanceType.toLowerCase()];
}

export function lookupRds(instanceClass: string): number | undefined {
  return RDS_COSTS[instanceClass.toLowerCase()];
}

export function lookupElasticache(nodeType: string): number | undefined {
  return ELASTICACHE_COSTS[nodeType.toLowerCase()];
}

export function resolveCdkInstanceType(classVal: string, sizeVal: string): string | null {
  const family = CDK_CLASS_MAP[classVal.toUpperCase()];
  const size = CDK_SIZE_MAP[sizeVal.toUpperCase()];
  if (!family || !size) {
    return null;
  }
  return `${family}.${size}`;
}

export function resolvePulumiInstanceType(enumVal: string): string | null {
  const m = enumVal.match(/^([A-Z][0-9a-z]*(?:[A-Z][0-9a-z]*)?)([A-Z][a-z]+(?:[0-9]+[a-z]*)?)$/);
  if (!m) {
    return null;
  }
  const family = m[1].toLowerCase();
  let size = m[2].toLowerCase();
  size = size.replace(/^x(\d+)(large)$/, '$1x$2').replace(/^(\d+)xlarge$/, '$1xlarge');
  return `${family}.${size}`;
}
