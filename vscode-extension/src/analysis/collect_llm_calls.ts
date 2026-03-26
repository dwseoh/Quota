/**
 * builds llm_call rows from the indexed codespace graph (same rules as the sidebar/codelens).
 */

import { CodespaceGraph, llm_call } from '../types';
import { hasLlmCallSite } from '../data/provider_registry';
import { calculate_cost, estimate_tokens } from '../cost_calculator';
import { extractModelFromCode, extractPromptFromCode } from '../parser';

export function collectLlmCallsFromGraph(graph: CodespaceGraph): llm_call[] {
  const allCalls: llm_call[] = [];

  for (const unit of graph.units) {
    const classification = graph.classifications[unit.id];

    if (classification && classification.role === 'consumer') {
      const isLlm = classification.category === 'llm';

      if (isLlm && !hasLlmCallSite(unit.body, classification.provider)) {
        continue;
      }

      const model = isLlm ? extractModelFromCode(unit.body) : null;
      const promptText = isLlm ? extractPromptFromCode(unit.body) : '';
      const tokens = isLlm ? estimate_tokens(promptText) : 0;
      const cost = isLlm ? calculate_cost(model, tokens) : null;

      allCalls.push({
        line: unit.location.startLine,
        file_path: unit.location.fileUri,
        provider: classification.provider,
        model,
        prompt_text: promptText,
        estimated_tokens: tokens,
        estimated_cost: cost
      });
    }
  }

  return allCalls;
}
