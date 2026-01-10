/**
 * parser.ts - person 1's work area
 * detects llm api calls in code using regex patterns
 */

import * as vscode from 'vscode';
import { llm_call } from './types';

/**
 * parse a document for llm api calls
 * @param document - vscode text document to parse
 * @returns array of detected llm calls
 */
export function parse_llm_calls(document: vscode.TextDocument): llm_call[] {
  // TODO: implement regex-based detection
  // patterns to detect:
  // - openai.chat.completions.create(...)
  // - client.chat.completions.create(...)
  // - anthropic.messages.create(...)
  // - client.messages.create(...)
  
  return [];
}
