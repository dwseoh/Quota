/**
 * cost_calculator.ts - person 1's work area
 * calculates token estimates and costs for llm calls
 */

import { llm_call, pricing_table, cost_breakdown, pricing_info } from './types';
import { pricing } from './data/price_table';

/**
 * pricing table imported from data source
 */
export { pricing };

/**
 * estimate tokens from text using simple heuristic
 * @param text - input text
 * @returns estimated token count
 */
export function estimate_tokens(text: string): number {
  // rough approximation: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

/**
 * calculate cost for a given model and token count
 * @param model - model name
 * @param tokens - token count
 * @returns cost in dollars
 */
/**
 * Find the best matching key in the pricing table
 */
function findMatchingKey(model: string): string | undefined {
    const inputModel = model.toLowerCase().trim();
    
    // 1. Exact match
    if (pricing[inputModel]) return inputModel;
    
    // 2. Substring match (longest wins)
    const potentialMatches = Object.keys(pricing).filter(key => inputModel.includes(key));
    if (potentialMatches.length > 0) {
        potentialMatches.sort((a, b) => b.length - a.length);
        return potentialMatches[0];
    }
    
    return undefined;
}

export function calculate_cost(model: string, tokens: number): number {
  const matchedKey = findMatchingKey(model);
  
  if (!matchedKey) {
    console.warn(`Unknown model/api: ${model}, using default rate`);
    return (tokens / 1000) * 0.01; // Default fallback
  }
  
  const model_pricing = pricing[matchedKey];
  return (tokens / 1000) * model_pricing.input;
}

/**
 * get detailed cost breakdown
 * @param model - model name
 * @param input_tokens - input token count
 * @param output_tokens - output token count (optional)
 * @returns detailed cost breakdown
 */

export function get_cost_breakdown(
  model: string,
  input_tokens: number,
  output_tokens: number = 0
): cost_breakdown {
  const matchedKey = findMatchingKey(model);
  const model_pricing = matchedKey ? pricing[matchedKey] : undefined;

  if (!model_pricing) {
    return {
      input_tokens: 0,
      output_tokens: 0,
      input_cost: 0,
      output_cost: 0,
      total_cost: 0
    };
  }
  
  const input_cost = (input_tokens / 1000) * model_pricing.input;
  const output_cost = (output_tokens / 1000) * model_pricing.output;
  
  return {
    input_tokens,
    output_tokens,
    input_cost,
    output_cost,
    total_cost: input_cost + output_cost
  };
}

/**
 * Get the pricing info for a model (returns undefined if not supported)
 */
export function get_model_pricing(model: string): pricing_info | undefined {
  return pricing[model];
}

/**
 * List supported model names
 */
export function supported_models(): string[] {
  return Object.keys(pricing);
}

/**
 * Calculate the total cost (input + output) for a model given token counts
 */
export function calculate_total_cost(model: string, input_tokens: number, output_tokens: number = 0): number {
  const breakdown = get_cost_breakdown(model, input_tokens, output_tokens);
  return breakdown.total_cost;
}
