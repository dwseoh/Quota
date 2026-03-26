import { OptimizationSuggestion } from '../optimization/types';
import {
  NAT_GATEWAY_BASE_MONTHLY,
  fargateMonthly,
  GCP_COMPUTE_COSTS,
  GCP_SQL_COSTS,
  GKE_CLUSTER_MONTHLY,
} from './price_table';
import { makeSuggestion, lookupEc2, lookupRds, lookupElasticache } from './helpers';

export function analyzeTerraform(content: string, filePath: string): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];
  const lines = content.split('\n');

  let resourceType = '';
  let resourceName = '';
  let blockStartLine = 0;
  let braceDepth = 0;
  let instanceType = '';
  let fargateVcpu = 0;
  let fargateMemMib = 0;

  const flush = () => {
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
      case 'google_compute_instance': {
        const cost = GCP_COMPUTE_COSTS[instanceType.toLowerCase()];
        suggestions.push(makeSuggestion(
          id, filePath, blockStartLine,
          `gce ${instanceType || 'instance'}${cost !== undefined ? ` — $${cost.toFixed(2)}/mo` : ''}`,
          `gcp compute engine on-demand instance. ${cost !== undefined ? 'estimated monthly at full uptime (us-central1).' : 'unknown machine type — check gcp pricing.'}`,
          cost ?? null,
        ));
        break;
      }
      case 'google_sql_database_instance': {
        const cost = GCP_SQL_COSTS[instanceType.toLowerCase()];
        suggestions.push(makeSuggestion(
          id, filePath, blockStartLine,
          `cloud sql ${instanceType || 'instance'}${cost !== undefined ? ` — $${cost.toFixed(2)}/mo` : ''}`,
          `gcp cloud sql on-demand instance (no ha, storage not included). ${cost !== undefined ? 'estimated monthly (us-central1).' : 'unknown tier.'}`,
          cost ?? null,
        ));
        break;
      }
      case 'google_container_cluster': {
        suggestions.push(makeSuggestion(
          id, filePath, blockStartLine,
          `gke cluster — $${GKE_CLUSTER_MONTHLY.toFixed(2)}/mo management fee`,
          'gcp gke: $0.10/hr cluster management fee (waived for first zonal autopilot cluster). node vm costs are additional.',
          GKE_CLUSTER_MONTHLY,
        ));
        break;
      }
      case 'google_container_node_pool': {
        const cost = GCP_COMPUTE_COSTS[instanceType.toLowerCase()];
        suggestions.push(makeSuggestion(
          id, filePath, blockStartLine,
          `gke node pool ${instanceType || ''}${cost !== undefined ? ` — $${cost.toFixed(2)}/node/mo` : ''}`,
          `gcp gke node pool. cost per node — multiply by node count. ${cost !== undefined ? 'estimated (us-central1).' : 'unknown machine type.'}`,
          cost ?? null,
        ));
        break;
      }
      case 'google_cloud_run_service':
      case 'google_cloud_run_v2_service': {
        suggestions.push(makeSuggestion(
          id, filePath, blockStartLine,
          'cloud run service — cost depends on requests',
          'gcp cloud run: billed per request + cpu/memory while handling traffic. generous free tier (2m requests/mo).',
          null,
        ));
        break;
      }
      case 'google_cloudfunctions_function':
      case 'google_cloudfunctions2_function': {
        suggestions.push(makeSuggestion(
          id, filePath, blockStartLine,
          'cloud function — cost depends on invocations',
          'gcp cloud functions: first 2m invocations/mo free, then $0.40/million. negligible at low scale.',
          null,
        ));
        break;
      }
    }
    instanceType = '';
    fargateVcpu = 0;
    fargateMemMib = 0;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    const resourceMatch = trimmed.match(/^resource\s+"(\w+)"\s+"(\w+)"\s*\{/);
    if (resourceMatch && braceDepth === 0) {
      resourceType = resourceMatch[1];
      resourceName = resourceMatch[2];
      blockStartLine = i + 1;
      braceDepth = 1;
      continue;
    }

    if (braceDepth === 0) {
      continue;
    }

    for (const ch of line) {
      if (ch === '{') {
        braceDepth++;
      } else if (ch === '}') {
        braceDepth--;
      }
    }

    if (braceDepth <= 0) {
      flush();
      braceDepth = 0;
      resourceType = '';
      continue;
    }

    if (braceDepth !== 1) {
      continue;
    }

    const kvMatch = trimmed.match(/^(\w+)\s*=\s*"([^"]+)"/);
    if (!kvMatch) {
      continue;
    }
    const [, key, val] = kvMatch;

    switch (key) {
      case 'instance_type':
      case 'instance_class':
      case 'node_type':
      case 'machine_type':
      case 'tier':
        instanceType = val;
        break;
      case 'cpu':
        fargateVcpu = parseInt(val, 10) || 0;
        break;
      case 'memory':
        fargateMemMib = parseInt(val, 10) || 0;
        break;
    }
  }

  return suggestions;
}
