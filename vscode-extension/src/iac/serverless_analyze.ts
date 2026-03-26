import { OptimizationSuggestion } from '../optimization/types';
import { DYNAMODB_WCU_MONTHLY, DYNAMODB_RCU_MONTHLY } from './price_table';
import { makeSuggestion } from './helpers';

export function isServerlessFile(filePath: string, content: string): boolean {
  const base = filePath.split('/').pop() || '';
  if (/^serverless\.(yml|yaml)$/.test(base)) {
    return true;
  }
  return /^service:\s*\S/m.test(content) && /^functions:/m.test(content);
}

export function analyzeServerless(content: string, filePath: string): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];
  const lines = content.split('\n');

  let inFunctions = false;
  let inResources = false;
  let functionCount = 0;
  let functionSectionLine = 0;

  interface DynamoTable { line: number; billingMode: string; rcu: number; wcu: number; }
  let currentTable: DynamoTable | null = null;

  const flushTable = () => {
    if (!currentTable) {
      return;
    }
    const t = currentTable;
    currentTable = null;
    if (t.billingMode === 'PAY_PER_REQUEST' || t.billingMode === 'ON_DEMAND') {
      suggestions.push(makeSuggestion(
        `iac-sls-dynamo-ondemand-${filePath}-${t.line}`, filePath, t.line,
        'dynamodb on-demand table',
        'pay-per-request billing — cost depends on read/write volume. negligible at low scale, can spike unexpectedly.',
        null,
      ));
    } else {
      const cost = t.rcu * DYNAMODB_RCU_MONTHLY + t.wcu * DYNAMODB_WCU_MONTHLY;
      suggestions.push(makeSuggestion(
        `iac-sls-dynamo-provisioned-${filePath}-${t.line}`, filePath, t.line,
        `dynamodb provisioned: ${t.rcu} rcu / ${t.wcu} wcu — $${cost.toFixed(2)}/mo`,
        'provisioned throughput billed 24/7 regardless of traffic. consider on-demand if traffic is unpredictable.',
        cost,
      ));
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const indent = line.search(/\S/);
    if (indent < 0) {
      continue;
    }

    if (indent === 0 && trimmed.endsWith(':')) {
      flushTable();
      inFunctions = trimmed === 'functions:';
      inResources = trimmed === 'resources:';
      if (inFunctions) {
        functionSectionLine = i + 1;
      }
      continue;
    }

    if (inFunctions && indent === 2 && /^\w[\w-]*:\s*$/.test(trimmed)) {
      functionCount++;
    }

    if (inResources && /Type:\s*AWS::DynamoDB::Table/.test(trimmed)) {
      flushTable();
      currentTable = { line: i + 1, billingMode: 'PROVISIONED', rcu: 5, wcu: 5 };
      continue;
    }

    if (currentTable) {
      const billingM = trimmed.match(/BillingMode:\s*(\w+)/);
      if (billingM) {
        currentTable.billingMode = billingM[1].toUpperCase();
      }
      const rcuM = trimmed.match(/ReadCapacityUnits:\s*(\d+)/);
      if (rcuM) {
        currentTable.rcu = parseInt(rcuM[1], 10);
      }
      const wcuM = trimmed.match(/WriteCapacityUnits:\s*(\d+)/);
      if (wcuM) {
        currentTable.wcu = parseInt(wcuM[1], 10);
      }
    }
  }

  flushTable();

  if (functionCount > 0) {
    suggestions.push(makeSuggestion(
      `iac-sls-functions-${filePath}`, filePath, functionSectionLine,
      `serverless: ${functionCount} lambda function${functionCount > 1 ? 's' : ''}`,
      'aws lambda: first 1m requests/mo free, then $0.20/million + compute time. negligible at low scale.',
      null,
    ));
  }

  return suggestions;
}
