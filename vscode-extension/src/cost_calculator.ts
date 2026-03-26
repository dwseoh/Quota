// calculates token estimates and costs for llm calls.
// pricing is sourced from litellm at runtime via pricing_fetcher — do not hardcode model prices here.

import { pricing_table, cost_breakdown, pricing_info } from './types';
import { getPricing } from './pricing_fetcher';
import { pricing as fallbackPricing } from './data/price_table';

export { fallbackPricing as pricing };

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
// finds the best matching key in the pricing table — exact match first, then longest substring
function findMatchingKey(model: string, table: pricing_table): string | undefined {
    const input = model.toLowerCase().trim();
    if (table[input]) return input;
    const matches = Object.keys(table).filter(key => input.includes(key));
    if (matches.length > 0) {
        matches.sort((a, b) => b.length - a.length);
        return matches[0];
    }
    return undefined;
}

// returns null if model is unknown — callers should show "unknown" rather than a fake estimate
export function calculate_cost(model: string | null, tokens: number): number | null {
    if (!model) return null;
    const table = getPricing();
    const key = findMatchingKey(model, table);
    if (!key) return null;
    return (tokens / 1000) * table[key].input;
}

/**
 * get detailed cost breakdown
 * @param model - model name
 * @param input_tokens - input token count
 * @param output_tokens - output token count (optional)
 * @returns detailed cost breakdown
 */

export function get_cost_breakdown(
    model: string | null,
    input_tokens: number,
    output_tokens: number = 0
): cost_breakdown | null {
    if (!model) return null;
    const table = getPricing();
    const key = findMatchingKey(model, table);
    if (!key) return null;
    const p = table[key];
    const input_cost = (input_tokens / 1000) * p.input;
    const output_cost = (output_tokens / 1000) * p.output;
    return { input_tokens, output_tokens, input_cost, output_cost, total_cost: input_cost + output_cost };
}

export function get_model_pricing(model: string): pricing_info | undefined {
    const table = getPricing();
    const key = findMatchingKey(model, table);
    return key ? table[key] : undefined;
}

export function supported_models(): string[] {
    return Object.keys(getPricing());
}

export function calculate_total_cost(model: string | null, input_tokens: number, output_tokens: number = 0): number | null {
    const breakdown = get_cost_breakdown(model, input_tokens, output_tokens);
    return breakdown ? breakdown.total_cost : null;
}
