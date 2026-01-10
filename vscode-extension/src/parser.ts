/**
 * parser.ts - Main Parser Orchestration
 * Coordinates workspace indexing, AST parsing, and LLM classification
 */

import * as vscode from 'vscode';
import { llm_call, CodespaceGraph, FileNode, CodeUnit, ApiClassification, ContextBundle } from './types';
import { scanWorkspace, createHashMap, getModifiedFiles } from './scanner';
import { parseFile, bundleContext } from './ast_parser';
import { classifyApiUsage, initializeGemini, detectProvidersQuick } from './intelligence';
import { initializeStore, saveIndex, loadIndex, saveFileHashes, loadFileHashes } from './store';
import { estimate_tokens, calculate_cost } from './cost_calculator';

// Global cache
let cachedGraph: CodespaceGraph | null = null;

/**
 * Initialize the parser system
 * @param workspaceRoot - workspace root path
 * @param apiKey - optional Gemini API key
 */
export async function initializeParser(workspaceRoot: string, apiKey?: string): Promise<void> {
  await initializeStore(workspaceRoot);
  initializeGemini(apiKey);
  console.log('Parser system initialized');
}

/**
 * Index entire workspace
 * @param rootPath - workspace root directory
 * @returns complete codespace graph
 */
export async function indexWorkspace(rootPath: string): Promise<CodespaceGraph> {
  console.log('Starting workspace indexing...');

  try {
    // Load previous state
    const previousGraph = await loadIndex(rootPath);
    const previousHashes = await loadFileHashes(rootPath);

    // Scan workspace
    const files = await scanWorkspace(rootPath);
    const currentHashes = createHashMap(files);

    // Determine which files need processing
    const modifiedFilePaths = getModifiedFiles(currentHashes, previousHashes);
    console.log(`Found ${modifiedFilePaths.length} modified files out of ${files.length} total`);

    // Parse modified files
    const allUnits: CodeUnit[] = previousGraph?.units || [];
    const allClassifications: Record<string, ApiClassification> = previousGraph?.classifications || {};

    // Collect all new units first
    const newUnitsToClassify: { unit: CodeUnit; bundle: ContextBundle }[] = [];

    for (const filePath of modifiedFilePaths) {
      console.log(`Parsing ${filePath}...`);

      // Remove old units from this file
      const fileUnits = allUnits.filter(u => u.location.fileUri !== filePath);

      // Parse and add new units
      const newUnits = await parseFile(filePath);
      allUnits.push(...newUnits);

      // Prepare units for batch classification
      for (const unit of newUnits) {
        const bundle = bundleContext(unit);
        newUnitsToClassify.push({ unit, bundle });
      }
    }

    // Batch classify all new units (1-2 API calls instead of 50+)
    if (newUnitsToClassify.length > 0) {
      console.log(`\nBatch classifying ${newUnitsToClassify.length} code units...`);

      const bundles = newUnitsToClassify.map(item => item.bundle);
      const { batchClassifyApis } = await import('./intelligence.js');
      const classifications = await batchClassifyApis(bundles);

      // Map classifications back to units
      for (let i = 0; i < newUnitsToClassify.length; i++) {
        allClassifications[newUnitsToClassify[i].unit.id] = classifications[i];
      }

      console.log('Batch classification complete!\n');
    }

    // Build file nodes
    const fileNodes: FileNode[] = files.map(file => ({
      path: file.path,
      hash: file.hash,
      lastModified: file.lastModified,
      units: allUnits.filter(u => u.location.fileUri === file.path).map(u => u.id)
    }));

    // Create graph
    const graph: CodespaceGraph = {
      version: '1.0.0',
      timestamp: Date.now(),
      files: fileNodes,
      units: allUnits,
      classifications: allClassifications
    };

    // Save state
    await saveIndex(rootPath, graph);
    await saveFileHashes(rootPath, currentHashes);

    // Cache for quick access
    cachedGraph = graph;

    console.log(`Indexing complete: ${files.length} files, ${allUnits.length} units`);
    return graph;
  } catch (error) {
    console.error('Error indexing workspace:', error);
    throw error;
  }
}

/**
 * Parse LLM calls from a document (backward compatible)
 * @param document - vscode text document to parse
 * @returns array of detected llm calls
 */
export function parse_llm_calls(document: vscode.TextDocument): llm_call[] {
  const calls: llm_call[] = [];

  if (!cachedGraph) {
    console.warn('Workspace not indexed yet, returning empty results');
    return calls;
  }

  // Find units in this document
  const documentUri = document.uri.fsPath;
  const documentUnits = cachedGraph.units.filter(
    u => u.location.fileUri === documentUri
  );

  // Convert classified units to llm_call format
  for (const unit of documentUnits) {
    const classification = cachedGraph.classifications[unit.id];

    if (classification && classification.role === 'consumer' && classification.category === 'llm') {
      // Extract model and estimate cost
      const model = extractModelFromCode(unit.body, classification.provider);
      const promptText = extractPromptFromCode(unit.body);
      const tokens = estimate_tokens(promptText);
      const cost = calculate_cost(model, tokens);

      calls.push({
        line: unit.location.startLine - 1, // VSCode uses 0-indexed lines
        provider: classification.provider === 'openai' ? 'openai' : 'anthropic',
        model: model,
        prompt_text: promptText,
        estimated_tokens: tokens,
        estimated_cost: cost
      });
    }
  }

  return calls;
}

/**
 * Extract model name from code
 * @param code - code body
 * @param provider - provider name
 * @returns model name
 */
function extractModelFromCode(code: string, provider: string): string {
  // Look for model parameter
  const modelMatch = code.match(/model\s*[:=]\s*["']([^"']+)["']/);
  if (modelMatch) {
    return modelMatch[1];
  }

  // Default models by provider
  if (provider === 'openai') return 'gpt-4';
  if (provider === 'anthropic') return 'claude-sonnet-4';
  return 'unknown';
}

/**
 * Extract prompt text from code
 * @param code - code body
 * @returns prompt text
 */
function extractPromptFromCode(code: string): string {
  // Look for content or messages
  const contentMatch = code.match(/content\s*[:=]\s*["']([^"']+)["']/);
  if (contentMatch) {
    return contentMatch[1];
  }

  const messagesMatch = code.match(/messages\s*[:=]\s*\[(.*?)\]/s);
  if (messagesMatch) {
    return messagesMatch[1].substring(0, 200); // Truncate for estimation
  }

  return code.substring(0, 200); // Fallback: use first 200 chars
}

/**
 * Get cached graph
 * @returns cached codespace graph or null
 */
export function getCachedGraph(): CodespaceGraph | null {
  return cachedGraph;
}

/**
 * Clear cache
 */
export function clearCache(): void {
  cachedGraph = null;
}
