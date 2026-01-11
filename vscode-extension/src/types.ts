/**
 * shared types for cost tracking
 * this file is the foundation for parallel work - all team members need this
 */

export interface llm_call {
  line: number;
  file_path?: string; // optional for backwards compatibility
  provider: string; // e.g. "openai", "stripe", "mapbox"
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

// --- Advanced Parser Types ---

export interface LocationMetadata {
  fileUri: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export interface CodeUnit {
  id: string;              // unique identifier (file:line:name)
  type: 'function' | 'class' | 'method';
  name: string;
  body: string;            // source code
  dependencies: string[];  // import statements
  location: LocationMetadata;
}

export interface ContextBundle {
  code: string;            // function body
  imports: string;         // relevant dependencies
  location: LocationMetadata;
}

export interface ApiClassification {
  role: 'consumer' | 'provider' | 'none';
  category: 'llm' | 'payment' | 'weather' | 'database' | 'other';
  provider: string;        // e.g., "openai", "stripe", "aws"
  confidence: number;      // 0-1
}

export interface FileEntry {
  path: string;
  hash: string;
  lastModified: number;
}

export interface FileEntry {
  path: string;
  hash: string;
  lastModified: number;
}

export interface FileNode {
  path: string;
  hash: string;
  lastModified: number;
  units: string[];         // IDs of CodeUnits in this file
}

export interface CodespaceGraph {
  version: string;         // schema version
  timestamp: number;       // last update time
  files: FileNode[];
  units: CodeUnit[];
  classifications: Record<string, ApiClassification>;
}
