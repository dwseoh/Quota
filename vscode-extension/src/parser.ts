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
import * as fs from 'fs';
import * as path from 'path';

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
      console.log(`\n📄 Parsing ${filePath}...`);

      // Remove old units from this file
      const fileUnits = allUnits.filter(u => u.location.fileUri !== filePath);

      // Parse and add new units
      const newUnits = await parseFile(filePath);
      console.log(`  Found ${newUnits.length} code units`);
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
      // Use quick detection by default (no Gemini API calls)
      // To enable Gemini: pass false as second parameter
      const classifications = await batchClassifyApis(bundles, true);

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

    console.log(`\n📦 Indexing complete: ${files.length} files, ${allUnits.length} units`);
    console.log(`📋 Classifications: ${Object.keys(allClassifications).length} total`);
    
    // Count LLM classifications
    const llmCount = Object.values(allClassifications).filter(
      c => c.role === 'consumer' && c.category === 'llm'
    ).length;
    console.log(`🤖 LLM API calls detected: ${llmCount}`);
    
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
        line: unit.location.startLine, // Keep 1-indexed (codelens will adjust)
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
/**
 * Main function to analyze workspace - Simple API for extension use
 * 
 * @param workspaceRoot - Root directory of workspace
 * @param options - Configuration options
 * @returns Analysis results with detected APIs
 * 
 * @example
 * ```typescript
 * const results = await analyzeWorkspace('/path/to/workspace', {
 *   useGemini: true,
 *   scope: 'src/',
 *   forceClean: false,
 *   onProgress: (message) => console.log(message)
 * });
 * 
 * console.log(`Found ${results.totalApis} paid APIs`);
 * console.log(`Categories:`, results.byCategory);
 * ```
 */
export async function analyzeWorkspace(
  workspaceRoot: string,
  options: {
    useGemini?: boolean;          // Use Gemini classification (default: true for quick detection)
    scope?: string;               // Limit to specific directory
    forceClean?: boolean;         // Remove existing index
    geminiApiKey?: string;        // Gemini API key (optional, reads from env)
    onProgress?: (message: string) => void;  // Progress callback
  } = {}
): Promise<{
  success: boolean;
  graph: CodespaceGraph;
  stats: {
    filesIndexed: number;
    codeUnits: number;
    classifications: number;
    totalApis: number;
    byCategory: Record<string, number>;
    byProvider: Record<string, number>;
  };
  sampleDetections: Array<{
    name: string;
    file: string;
    line: number;
    provider: string;
    category: string;
    confidence: number;
  }>;
  duration: number;
  error?: string;
}> {
  const startTime = Date.now();
  const progress = options.onProgress || (() => { });

  try {
    // Clean index if requested
    if (options.forceClean) {
      progress('Cleaning existing index...');
      const analyticsDir = path.join(workspaceRoot, '.delta-analytics-config');
      if (fs.existsSync(analyticsDir)) {
        fs.rmSync(analyticsDir, { recursive: true, force: true });
        progress('Removed .delta-analytics-config/');
      }
    }

    // Initialize parser
    progress('Initializing parser...');
    await initializeParser(workspaceRoot, options.geminiApiKey);
    progress('Parser initialized');

    // Index workspace
    progress('Starting workspace indexing...');
    const graph = await indexWorkspace(workspaceRoot);
    progress('Indexing complete');

    // Calculate statistics
    const stats = {
      filesIndexed: graph.files.length,
      codeUnits: graph.units.length,
      classifications: Object.keys(graph.classifications).length,
      totalApis: 0,
      byCategory: {} as Record<string, number>,
      byProvider: {} as Record<string, number>
    };

    // Analyze classifications
    for (const [unitId, classification] of Object.entries(graph.classifications)) {
      if (classification.role === 'consumer' && classification.category !== 'other') {
        stats.totalApis++;

        // Count by category
        if (!stats.byCategory[classification.category]) {
          stats.byCategory[classification.category] = 0;
        }
        stats.byCategory[classification.category]++;

        // Count by provider
        if (!stats.byProvider[classification.provider]) {
          stats.byProvider[classification.provider] = 0;
        }
        stats.byProvider[classification.provider]++;
      }
    }

    // Get sample detections
    const sampleDetections = graph.units
      .filter(u => {
        const c = graph.classifications[u.id];
        return c && c.role === 'consumer' && c.category !== 'other';
      })
      .slice(0, 10)
      .map(u => {
        const c = graph.classifications[u.id];
        return {
          name: u.name,
          file: path.basename(u.location.fileUri),
          line: u.location.startLine,
          provider: c.provider,
          category: c.category,
          confidence: c.confidence
        };
      });

    const duration = (Date.now() - startTime) / 1000;
    progress(`Analysis complete in ${duration.toFixed(2)}s`);

    return {
      success: true,
      graph,
      stats,
      sampleDetections,
      duration
    };

  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    return {
      success: false,
      graph: { version: '1.0.0', timestamp: Date.now(), files: [], units: [], classifications: {} },
      stats: {
        filesIndexed: 0,
        codeUnits: 0,
        classifications: 0,
        totalApis: 0,
        byCategory: {},
        byProvider: {}
      },
      sampleDetections: [],
      duration,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
