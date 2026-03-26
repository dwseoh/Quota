import { OptimizationSuggestion } from '../optimization/types';
import { K8S_VCPU_MONTHLY, K8S_GB_MEM_MONTHLY } from './price_table';
import { makeSuggestion } from './helpers';
import { parseCpuVcpu, parseMemGb } from './resource_units';

export function isKubernetesFile(content: string): boolean {
  return /^apiVersion:\s*\S/m.test(content) && /^kind:\s*\S/m.test(content);
}

const K8S_WORKLOAD_KINDS = new Set(['Deployment', 'StatefulSet', 'DaemonSet', 'Job', 'CronJob']);

export function analyzeKubernetes(content: string, filePath: string): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];

  const docs = content.split(/^---[ \t]*$/m);
  let charOffset = 0;

  for (const doc of docs) {
    const kindMatch = doc.match(/^kind:\s*(\w+)/m);
    if (!kindMatch || !K8S_WORKLOAD_KINDS.has(kindMatch[1])) {
      charOffset += doc.length + 4;
      continue;
    }

    const kind = kindMatch[1];
    const nameMatch = doc.match(/^  name:\s*(.+)/m);
    const workloadName = nameMatch ? nameMatch[1].trim() : kind.toLowerCase();

    const replicasMatch = doc.match(/replicas:\s*(\d+)/);
    const replicas = replicasMatch ? parseInt(replicasMatch[1], 10) : 1;

    const kindLineInDoc = doc.substring(0, doc.indexOf(kindMatch[0])).split('\n').length;
    const linesBefore = content.substring(0, charOffset).split('\n').length;
    const kindLine = linesBefore + kindLineInDoc;

    const cpuMatch = doc.match(/requests:[^\n]*\n(?:[ \t]+[^\n]+\n)*?[ \t]+cpu:\s*([^\n#]+)/);
    const memMatch = doc.match(/requests:[^\n]*\n(?:[ \t]+[^\n]+\n)*?[ \t]+memory:\s*([^\n#]+)/);
    const cpuMatch2 = doc.match(/[ \t]+cpu:\s*([^\n#]+)/);
    const memMatch2 = doc.match(/[ \t]+memory:\s*([^\n#]+)/);

    const cpuStr = (cpuMatch?.[1] || cpuMatch2?.[1] || '').trim();
    const memStr = (memMatch?.[1] || memMatch2?.[1] || '').trim();

    if (!cpuStr && !memStr) {
      charOffset += doc.length + 4;
      continue;
    }

    const vcpuPerReplica = cpuStr ? parseCpuVcpu(cpuStr) : 0;
    const memGbPerReplica = memStr ? parseMemGb(memStr) : 0;
    const costPerReplica = vcpuPerReplica * K8S_VCPU_MONTHLY + memGbPerReplica * K8S_GB_MEM_MONTHLY;
    const totalCost = costPerReplica * replicas;

    const cpuLabel = vcpuPerReplica > 0 ? `${vcpuPerReplica} vcpu` : '';
    const memLabel = memGbPerReplica > 0 ? `${memGbPerReplica.toFixed(2).replace(/\.?0+$/, '')} gb` : '';
    const resourceLabel = [cpuLabel, memLabel].filter(Boolean).join(' / ');

    suggestions.push(makeSuggestion(
      `iac-k8s-${kind}-${workloadName}-${filePath}`, filePath, kindLine,
      `${kind.toLowerCase()} ${workloadName}: ${replicas}× (${resourceLabel}) — $${totalCost.toFixed(2)}/mo`,
      `estimated monthly compute for ${replicas} replica${replicas > 1 ? 's' : ''}. actual cost depends on node type and cloud provider.`,
      totalCost,
    ));

    charOffset += doc.length + 4;
  }

  return suggestions;
}
