/**
 * cost_calculator.ts - person 1's work area
 * calculates token estimates and costs for llm calls
 */

import { llm_call, pricing_table, cost_breakdown } from './types';

/**
 * hardcoded pricing table (accurate as of jan 2025)
 */
export const pricing: pricing_table = {
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  'claude-sonnet-4': { input: 0.003, output: 0.015 },
  'claude-haiku': { input: 0.00025, output: 0.00125 }
};

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
export function calculate_cost(model: string, tokens: number): number {
  const model_pricing = pricing[model];
  if (!model_pricing) {
    return 0;
  }
  
  // for mvp, assume input tokens only (conservative estimate)
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
  const model_pricing = pricing[model];
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
