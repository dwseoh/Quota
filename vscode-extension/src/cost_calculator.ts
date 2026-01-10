/**
 * cost_calculator.ts - person 1's work area
 * calculates token estimates and costs for llm calls
 */

import { llm_call, pricing_table, cost_breakdown, pricing_info } from './types';

/**
 * hardcoded pricing table (accurate as of jan 2025)
 */
export const pricing: pricing_table = {
  // OpenAI
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-4-32k': { input: 0.045, output: 0.09 },
  'gpt-4o': { input: 0.02, output: 0.04 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },

  // Anthropic
  'claude-sonnet-4': { input: 0.003, output: 0.015 },
  'claude-sonnet-4-20250514': { input: 0.003, output: 0.015 }, // Versioned alias
  'claude-haiku': { input: 0.00025, output: 0.00125 },
  'claude-haiku-20240307': { input: 0.00025, output: 0.00125 }, // Versioned alias

  // Gemini / Google (approximate — verify with provider)
  'gemini-1.0': { input: 0.002, output: 0.01 },
  'gemini-2': { input: 0.006, output: 0.012 },
  'gemini-3': { input: 0.012, output: 0.024 },
  'gemini-3-pro': { input: 0.015, output: 0.03 }
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
  // Normalize model name to handle versioned models (e.g., claude-sonnet-4-20250514 → claude-sonnet-4)
  let normalizedModel = model;
  
  // Check if exact match exists first
  if (!pricing[model]) {
    // Try to normalize common patterns
    if (model.includes('claude-sonnet')) {
      normalizedModel = 'claude-sonnet-4';
    } else if (model.includes('claude-haiku')) {
      normalizedModel = 'claude-haiku';
    } else if (model.includes('gpt-4')) {
      normalizedModel = 'gpt-4';
    } else if (model.includes('gpt-3.5')) {
      normalizedModel = 'gpt-3.5-turbo';
    }
  }
  
  const model_pricing = pricing[normalizedModel];
  if (!model_pricing) {
    console.warn(`Unknown model: ${model}, using default rate`);
    return (tokens / 1000) * 0.01; // Default rate if model not found
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
