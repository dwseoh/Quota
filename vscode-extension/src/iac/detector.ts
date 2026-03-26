// iac cost detector — terraform, cdk/pulumi ts, serverless yaml, kubernetes yaml.

import { OptimizationDetector, FileContext } from '../optimization/types';
import { analyzeTerraform } from './terraform_analyze';
import { analyzeCdkPulumi } from './cdk_pulumi_analyze';
import { analyzeServerless, isServerlessFile } from './serverless_analyze';
import { analyzeKubernetes, isKubernetesFile } from './kubernetes_analyze';

export class IacDetector implements OptimizationDetector {
  id = 'iac-cost-detector';

  targetFileTypes = ['typescript', 'javascript', 'tf', 'yml', 'yaml'];

  async analyze(context: FileContext) {
    const filePath = context.uri.fsPath;
    const ext = filePath.split('.').pop() || '';

    if (ext === 'tf') {
      return analyzeTerraform(context.content, filePath);
    }

    if (ext === 'ts' || ext === 'tsx' || ext === 'js' || ext === 'jsx') {
      return analyzeCdkPulumi(context.content, filePath);
    }

    if (ext === 'yml' || ext === 'yaml') {
      if (isServerlessFile(filePath, context.content)) {
        return analyzeServerless(context.content, filePath);
      }
      if (isKubernetesFile(context.content)) {
        return analyzeKubernetes(context.content, filePath);
      }
    }

    return [];
  }
}
