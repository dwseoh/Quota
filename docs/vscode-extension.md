# VSCode Extension - Quota

VSCode extension that tracks and optimizes costs in your codebase by analyzing paid API usage.

## Overview

Quota analyzes your codebase to detect paid API calls (OpenAI, Anthropic, Stripe, etc.) and provides inline cost estimates, workspace-wide analysis, and cost projections. Uses AST parsing and Google Gemini AI for intelligent API classification.

## Features

- **Workspace Indexing**: Scans all Python, TypeScript, and JavaScript files
- **AI-Powered Classification**: Uses Gemini to identify paid APIs with batch processing (99% faster than sequential)
- **Inline Cost Estimates**: CodeLens annotations showing cost per call
- **Sidebar Panel**: TreeView with total costs and scale simulator
- **Incremental Updates**: Only re-analyzes changed files

## Setup

### Prerequisites

- VSCode 1.95.0 or higher
- Node.js 22.x or higher
- Google Gemini API key (get one at https://makersuite.google.com/app/apikey)

### Installation

1. Navigate to the extension directory:
   ```bash
   cd vscode-extension
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

4. Compile TypeScript:
   ```bash
   npm run compile
   ```

5. Launch the extension:
   - Press `F5` in VSCode to open the Extension Development Host
   - Open a workspace containing Python, TypeScript, or JavaScript files

## Core Functionality

### Workspace Indexing

The extension automatically indexes your workspace on activation:

1. Scans all `.py`, `.ts`, `.js` files
2. Extracts functions, classes, and methods using AST parsing
3. Extracts API patterns (imports, function calls, keywords)
4. Batches all units and sends to Gemini in 1-2 requests
5. Identifies paid APIs and categorizes them
6. Stores results in `.delta-analytics-config/`

**Performance:**
- Initial indexing: 40-60 seconds for 50-100 code units
- 1-2 Gemini API calls total (vs 50-100 sequential calls)
- 99% faster than sequential classification

### API Classification

Gemini analyzes each code unit and identifies:

- **Role**: `consumer` (calls APIs), `provider` (defines endpoints), or `none`
- **Category**: `llm`, `payment`, `database`, `cloud`, `analytics`, `email`, `storage`, `other`
- **Provider**: Specific provider name (e.g., "openai", "stripe", "aws")
- **Is Paid**: `true` for paid services, `false` for free/open source
- **Confidence**: Score from 0 to 1

### CodeLens Integration

Inline cost annotations appear above detected API calls:

```typescript
💰 ~$0.0030 per call
async function generateResponse(prompt: string) {
  const response = await client.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }]
  });
}
```

Click the CodeLens to see detailed breakdown.

### TreeView Panel

Located in the VSCode sidebar under the Quota icon:

- Total cost across all detected calls
- Individual calls with model and cost
- Scale simulator (project monthly costs based on user count)

### Incremental Updates

The system intelligently handles re-indexing:
- Only processes files that have changed
- Uses MD5 hashing to detect modifications
- Preserves classifications for unchanged files

## Commands

### Refresh Cost Analysis

**Command Palette**: `Cost Tracker: Refresh Cost Analysis`

Re-indexes entire workspace and re-classifies all code units with Gemini.

### Update User Count

**Command Palette**: `Cost Tracker: Update User Count for Simulation`

Prompts for daily user count and updates monthly cost projection in TreeView.

### Usage

```bash
node run-parser.js [options]
```

### Options

- `--gemini`: Use Gemini batch classification (default: quick detection)
- `--scope <path>`: Limit to specific directory (default: full workspace)
- `--clean`: Remove `.delta-analytics-config` before running (default: keep existing)
- `--help`: Show help message

### Examples

Quick detection (fast, no API calls):
```bash
node run-parser.js
```

Gemini classification (accurate, uses API):
```bash
node run-parser.js --gemini
```

Scope to specific directory:
```bash
node run-parser.js --scope src/
```

Clean index + Gemini:
```bash
node run-parser.js --clean --gemini
```

### Performance

| Mode | Time | API Calls | Accuracy |
|------|------|-----------|----------|
| Quick Detection | 1-2s | 0 | Good |
| Gemini Batch | 40-60s | 1-2 | Excellent |

## API Reference

### analyzeWorkspace()

Main function for workspace analysis.

```typescript
import { analyzeWorkspace } from './parser';

const results = await analyzeWorkspace(workspaceRoot, {
  useGemini?: boolean;           // Use Gemini (default: quick detection)
  scope?: string;                // Limit to directory
  forceClean?: boolean;          // Remove existing index
  geminiApiKey?: string;         // API key (optional)
  onProgress?: (msg: string) => void;  // Progress callback
});
```

**Return Value:**

```typescript
{
  success: boolean;              // Whether analysis succeeded
  graph: CodespaceGraph;         // Complete graph (for advanced use)
  stats: {
    filesIndexed: number;        // Number of files
    codeUnits: number;           // Number of functions/classes
    classifications: number;     // Number of classifications
    totalApis: number;           // Paid APIs detected
    byCategory: {                // Count by category
      llm: 5,
      payment: 2,
      ...
    },
    byProvider: {                // Count by provider
      openai: 3,
      stripe: 2,
      ...
    }
  },
  sampleDetections: [            // Up to 10 sample detections
    {
      name: "generateResponse",
      file: "api.ts",
      line: 42,
      provider: "openai",
      category: "llm",
      confidence: 0.98
    },
    ...
  ],
  duration: 43.5,                // Time in seconds
  error?: string                 // Error message if failed
}
```

### Example Usage

```typescript
import * as vscode from 'vscode';
import { analyzeWorkspace } from './parser';

export function activate(context: vscode.ExtensionContext) {
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
  
  if (workspaceRoot) {
    vscode.window.withProgress({
      location: vscode.ProgressLocation.Window,
      title: 'Cost Tracker'
    }, async (progress) => {
      
      const results = await analyzeWorkspace(workspaceRoot, {
        useGemini: true,
        onProgress: (msg) => progress.report({ message: msg })
      });

      if (results.success) {
        const message = `Found ${results.stats.totalApis} paid APIs ` +
                       `(${Object.keys(results.stats.byProvider).join(', ')})`;
        vscode.window.showInformationMessage(message);
      }
    });
  }
}
```

## CodespaceGraph Structure

The parser generates a `CodespaceGraph` JSON structure stored in `.delta-analytics-config/index.json`.

### Structure

```json
{
  "version": "1.0.0",
  "timestamp": 1704920400000,
  "files": [
    {
      "path": "/workspace/src/api/openai_client.ts",
      "hash": "a1b2c3d4e5f6",
      "lastModified": 1704920350000,
      "units": [
        "/workspace/src/api/openai_client.ts:5:generateResponse"
      ]
    }
  ],
  "units": [
    {
      "id": "/workspace/src/api/openai_client.ts:5:generateResponse",
      "type": "function",
      "name": "generateResponse",
      "body": "async function generateResponse(prompt: string) {...}",
      "dependencies": [
        "import { OpenAI } from 'openai';"
      ],
      "location": {
        "fileUri": "/workspace/src/api/openai_client.ts",
        "startLine": 5,
        "startColumn": 0,
        "endLine": 12,
        "endColumn": 1
      }
    }
  ],
  "classifications": {
    "/workspace/src/api/openai_client.ts:5:generateResponse": {
      "role": "consumer",
      "category": "llm",
      "provider": "openai",
      "confidence": 0.98
    }
  }
}
```

### Components

- **version**: Schema version for compatibility tracking
- **timestamp**: Unix timestamp of last indexing
- **files**: Array of file nodes with metadata
- **units**: Array of all code units (functions, classes, methods)
- **classifications**: Map of unit IDs to their API classifications

### Storage Location

```
<workspace-root>/.delta-analytics-config/
├── index.json        # Complete CodespaceGraph
└── file-map.hash     # File modification tracking
```

Add `.delta-analytics-config/` to your `.gitignore`.

## Configuration

### Customize Pattern Extraction

Edit `src/intelligence.ts` `extractApiPatterns()`:

```typescript
// Add custom API call patterns
const apiCallPatterns = [
  /(\w+)\.(\w+)\([^)]*\)/g,
  /myCustomApi\.\w+\([^)]*\)/g,  // Add this
];

// Add custom keywords
const keywordPatterns = [
  /\b(api|client|service)\b/gi,
  /\b(mycustomkeyword)\b/gi,  // Add this
];
```

### Adjust Batch Size

Edit `src/parser.ts`:

```typescript
// Split into smaller batches if hitting token limits
const BATCH_SIZE = 50;  // Adjust this
for (let i = 0; i < units.length; i += BATCH_SIZE) {
  const batch = units.slice(i, i + BATCH_SIZE);
  await batchClassifyApis(batch);
}
```

### Extension Settings

Configure in VSCode settings:

- `cost-tracker.monthlyBudget`: Monthly budget limit in USD for cost alerts (default: 500)

## Troubleshooting

### No CodeLens Appearing

**Possible causes:**
1. Workspace not indexed yet (wait for notification)
2. No LLM API calls detected in file
3. Gemini classification returned "none"

**Solution:**
- Check console for errors
- Run "Refresh Cost Analysis" command
- Verify `.delta-analytics-config/index.json` exists

### Gemini API Errors

**Error**: "GEMINI_API_KEY not found"

**Solution:**
- Create `.env` file with API key
- Restart extension (reload window)

**Error**: "API quota exceeded"

**Solution:**
- Check Gemini API quota limits
- Wait for quota reset (daily/monthly)
- Upgrade to paid tier for higher limits

### Slow Indexing

**Symptoms**: Indexing takes more than 2 minutes

**Possible causes:**
1. Very large codebase (more than 500 files)
2. Slow network connection to Gemini
3. Complex code units requiring more analysis

**Solutions:**
- Exclude unnecessary directories in scanner
- Check network connection
- Monitor console for specific bottlenecks

## Development

### Project Structure

```
vscode-extension/
├── src/
│   ├── extension.ts           # Entry point
│   ├── parser.ts              # Workspace indexing and parsing
│   ├── intelligence.ts        # Gemini AI classification
│   ├── ast_parser.ts          # AST parsing (VSCode API)
│   ├── codelens_provider.ts   # Inline annotations
│   ├── treeview_provider.ts   # Sidebar panel
│   ├── cost_calculator.ts     # Cost estimation
│   └── types.ts               # Type definitions
├── test_files/                # Sample test files
├── package.json
└── tsconfig.json
```

### Running in Development

```bash
npm run watch    # Watch mode for development
```

Press `F5` to launch Extension Development Host.

### Testing

Use test files in `test_files/`:
- `test_openai.py`
- `test_anthropic.ts`

## Notes

- Session storage is in-memory (workspace-specific)
- Pricing table is hardcoded (accurate as of January 2025)
- Token estimation uses simple heuristic: 1 token ≈ 4 characters
- Supports Python, TypeScript, JavaScript files
- Supports OpenAI, Anthropic, and other major API providers
