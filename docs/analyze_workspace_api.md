# Using `analyzeWorkspace()` in Your Extension

## New Main Function Added

I've added a comprehensive `analyzeWorkspace()` function to `parser.ts` that provides a simple, all-in-one API for your extension.

---

## Function Signature

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

---

## Usage in Extension

### Example 1: Basic Usage

```typescript
import { analyzeWorkspace } from './parser';

// In your extension.ts activate() function:
export function activate(context: vscode.ExtensionContext) {
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
  
  if (workspaceRoot) {
    // Run analysis
    analyzeWorkspace(workspaceRoot, {
      onProgress: (message) => {
        console.log(`Parser: ${message}`);
      }
    }).then(results => {
      if (results.success) {
        vscode.window.showInformationMessage(
          `Found ${results.stats.totalApis} paid APIs in ${results.duration.toFixed(1)}s`
        );
      }
    });
  }
}
```

### Example 2: With Progress Notification

```typescript
async function runAnalysis() {
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
  if (!workspaceRoot) return;

  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: 'Analyzing workspace...',
    cancellable: false
  }, async (progress) => {
    
    const results = await analyzeWorkspace(workspaceRoot, {
      useGemini: true,  // Use AI classification
      onProgress: (message) => {
        progress.report({ message });
      }
    });

    if (results.success) {
      // Show results
      vscode.window.showInformationMessage(
        `Analysis complete! Found ${results.stats.totalApis} paid APIs`
      );
      
      // Log details
      console.log('By Category:', results.stats.byCategory);
      console.log('By Provider:', results.stats.byProvider);
      console.log('Sample Detections:', results.sampleDetections);
    } else {
      vscode.window.showErrorMessage(`Analysis failed: ${results.error}`);
    }
  });
}
```

### Example 3: Command with Options

```typescript
// Register command
const analyzeCommand = vscode.commands.registerCommand(
  'cost-tracker.analyzeWorkspace',
  async () => {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    if (!workspaceRoot) {
      vscode.window.showErrorMessage('No workspace folder open');
      return;
    }

    // Ask user for options
    const useGemini = await vscode.window.showQuickPick(
      ['Quick Detection (Fast)', 'Gemini AI (Accurate)'],
      { placeHolder: 'Select classification method' }
    );

    const forceClean = await vscode.window.showQuickPick(
      ['Keep existing index', 'Clean and re-index'],
      { placeHolder: 'Index strategy' }
    );

    // Run analysis
    const results = await analyzeWorkspace(workspaceRoot, {
      useGemini: useGemini?.includes('Gemini'),
      forceClean: forceClean?.includes('Clean'),
      onProgress: (msg) => console.log(msg)
    });

    if (results.success) {
      // Show detailed results in output channel
      const output = vscode.window.createOutputChannel('Cost Tracker Analysis');
      output.clear();
      output.appendLine(`=== Analysis Results ===`);
      output.appendLine(`Duration: ${results.duration.toFixed(2)}s`);
      output.appendLine(`Files: ${results.stats.filesIndexed}`);
      output.appendLine(`Code Units: ${results.stats.codeUnits}`);
      output.appendLine(`Paid APIs: ${results.stats.totalApis}\n`);
      
      output.appendLine('By Category:');
      for (const [cat, count] of Object.entries(results.stats.byCategory)) {
        output.appendLine(`  ${cat}: ${count}`);
      }
      
      output.appendLine('\nBy Provider:');
      for (const [prov, count] of Object.entries(results.stats.byProvider)) {
        output.appendLine(`  ${prov}: ${count}`);
      }
      
      output.appendLine('\nSample Detections:');
      for (const det of results.sampleDetections) {
        output.appendLine(`  • ${det.name} (${det.file}:${det.line})`);
        output.appendLine(`    ${det.provider} - ${det.category} (${(det.confidence * 100).toFixed(0)}%)`);
      }
      
      output.show();
    }
  }
);

context.subscriptions.push(analyzeCommand);
```

---

## Return Value

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

---

## Benefits

✅ **Simple API** - One function call does everything  
✅ **Progress Callbacks** - Show progress to users  
✅ **Error Handling** - Returns success/error status  
✅ **Detailed Stats** - Get counts by category/provider  
✅ **Sample Data** - See actual detections  
✅ **Flexible Options** - Configure as needed  

---

## Integration with Existing Code

You can still use the lower-level functions if needed:

```typescript
// Low-level (existing)
await initializeParser(workspaceRoot);
const graph = await indexWorkspace(workspaceRoot);
const calls = parse_llm_calls(document);

// High-level (new)
const results = await analyzeWorkspace(workspaceRoot, options);
```

Both work! Use `analyzeWorkspace()` for simplicity, or the low-level functions for fine control.

---

## Complete Example

```typescript
import * as vscode from 'vscode';
import { analyzeWorkspace } from './parser';

export function activate(context: vscode.ExtensionContext) {
  // Run analysis on activation
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
        
        // Update your UI with results
        updateCodeLens(results.graph);
        updateTreeView(results.stats);
      }
    });
  }
}
```

---

**The `analyzeWorkspace()` function is ready to use in your extension!** 🚀
