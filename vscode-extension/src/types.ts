/**
 * shared types for cost tracking
 * this file is the foundation for parallel work - all team members need this
 */

export interface llm_call {
  line: number;
  provider: "openai" | "anthropic";
  model: string;
  prompt_text: string;
  estimated_tokens: number;
  estimated_cost: number;
}

export interface cost_breakdown {
  input_tokens: number;
  output_tokens: number;
  input_cost: number;
  output_cost: number;
  total_cost: number;
}

export interface pricing_info {
  input: number; // per 1k tokens
  output: number; // per 1k tokens
}

export type pricing_table = Record<string, pricing_info>;
