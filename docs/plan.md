## **Technical Plan**

### **Tech Stack**

- **VSCode Extension:** TypeScript + VSCode Extension API
- **Web Dashboard (Sprint 2):** Next.js + React + Tailwind
- **Parsing:** Tree-sitter or regex-based AST parsing
- **Storage:** VSCode globalState (MVP), SQLite/Supabase (Sprint 2+)

---

## **MVP - Technical Approach**

### **1. Project Setup (30 min)**

```bash
npm install -g yo generator-code
yo code  # scaffold extension

```

- Use TypeScript template
- Set up: `extension.ts`, `package.json`, `tsconfig.json`

### **2. API Call Detection (2 hours)**

**Approach:** Naive regex + simple AST parsing

**Implementation:**

- Listen to `vscode.workspace.onDidOpenTextDocument` and `onDidChangeTextDocument`
- Parse file content looking for patterns:
    
    ```tsx
    // Regex patterns to detect:- openai.chat.completions.create(...)- anthropic.messages.create(...)- client.messages.create(...)
    
    ```
    
- Extract: function name, model parameter, prompt/messages content
- Store detected calls in memory (array of objects)

**Data structure:**

```tsx
interface LLMCall {
  line: number;
  provider: 'openai' | 'anthropic';
  model: string;
  promptText: string;
  estimatedTokens: number;
  estimatedCost: number;
}

```

### **3. Cost Calculation (1 hour)**

**Token estimation heuristic:**

```tsx
estimatedTokens = promptText.length / 4  // rough approximation

```

**Pricing table (hardcoded):**

```tsx
const PRICING = {
  'gpt-4': { input: 0.03, output: 0.06 },  // per 1K tokens
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  'claude-sonnet-4': { input: 0.003, output: 0.015 },
  'claude-haiku': { input: 0.00025, output: 0.00125 }
};

```

Calculate: `cost = (tokens / 1000) * price`

### **4. Inline Display - CodeLens (2 hours)**

**Implementation:**

```tsx
vscode.languages.registerCodeLensProvider(
  { language: 'python' },  // or 'typescript', 'javascript'
  {
    provideCodeLenses(document) {
      // For each detected LLM call:
      // Create CodeLens at that line showing cost
      return detectedCalls.map(call =>
        new vscode.CodeLens(
          new vscode.Range(call.line, 0, call.line, 0),
          {
            title: `💰 ~$${call.estimatedCost.toFixed(4)} per call`,
            command: 'extension.showCostDetails',
            arguments: [call]
          }
        )
      );
    }
  }
);

```

**On click:** Show VSCode info message with breakdown

### **5. Sidebar Panel (2-3 hours)**

**Approach:** TreeView API

**Implementation:**

```tsx
// Create TreeView provider
class CostTreeProvider implements vscode.TreeDataProvider<CostItem> {
  getChildren() {
    return [
      // Header showing total
      new CostItem(`Total: $${totalCost}`),
      // Each call as child item
      ...detectedCalls.map(call =>
        new CostItem(`${call.model}: $${call.cost}`)
      ),
      // Simulation section
      new CostItem('--- Scale Simulator ---'),
      new CostItem(`At ${userCount} users/day: $${scaledCost}/month`)
    ];
  }
}

// Register in package.json
"views": {
  "explorer": [{
    "id": "costPanel",
    "name": "AI Cost Analyzer"
  }]
}

```

**User count input:** Use `vscode.window.showInputBox()` to get multiplier

---

## **Sprint 2 - Technical Approach**

### **Architecture Decision:**

Split into **2 components:**

1. **VSCode Extension** (file analysis + sends data to web)
2. **Web Dashboard** (visualization + sandbox)

### **1. Live Cost Dashboard - Web App (3-4 hours)**

**Setup:**

```bash
npx create-next-app@latest cost-dashboard
# Add: Recharts for graphs, Tailwind for styling

```

**Data flow:**

```
VSCode Extension → POST to local server → Store in DB → Web displays

```

**Implementation:**

- Extension sends cost events via HTTP POST to `localhost:3000/api/track`
- Next.js API route stores in SQLite/file-based DB
- Dashboard polls/subscribes for updates
- Show: line chart of costs over time, session total, today's activity

**Pages:**

- `/` - Real-time dashboard
- `/sandbox` - Interactive cost simulator (more robust than MVP)

### **2. Budget Alerts (1 hour)**

**Implementation:**

- Store budget limit in VSCode settings: `extension.configuration`
- Check after each cost calculation:
    
    ```tsx
    if (sessionTotal > budget * 0.8) {  vscode.window.showWarningMessage('⚠️ 80% of budget used!');}
    
    ```
    
- Visual: Status bar item changes color (green → yellow → red)

### **3. Multi-File Analysis (2-3 hours)**

**Approach:** Workspace file scanner

**Implementation:**

```tsx
// Scan all files in workspace
const files = await vscode.workspace.findFiles('**/*.{py,js,ts}');

// Parse each file in parallel
const allCalls = await Promise.all(
  files.map(file => parseFileForCalls(file))
);

// Aggregate results
const summary = {
  totalFiles: files.length,
  totalCalls: allCalls.flat().length,
  totalCost: calculateTotal(allCalls),
  mostExpensiveFiles: sortByFost(allCalls).slice(0, 5)
};

```

**Display:** New webview panel showing project overview

### **4. Optimization Suggestions (2 hours)**

**Approach:** Rule-based pattern matching

**Implementation:**

```tsx
function generateSuggestions(calls: LLMCall[]) {
  const suggestions = [];

  // Rule 1: Expensive model check
  calls.forEach(call => {
    if (call.model === 'gpt-4' && call.promptText.length < 500) {
      suggestions.push({
        type: 'model_swap',
        message: `Line ${call.line}: Switch to GPT-3.5 (85% cheaper)`,
        savings: calculateSavings(call, 'gpt-3.5-turbo')
      });
    }
  });

  // Rule 2: Duplicate prompts
  const promptCounts = countDuplicates(calls.map(c => c.promptText));
  promptCounts.forEach((count, prompt) => {
    if (count > 3) {
      suggestions.push({
        type: 'caching',
        message: `Prompt appears ${count}x - cache to save $X/month`
      });
    }
  });

  // Rule 3: Loop detection (simple heuristic)
  // Check if multiple calls on consecutive lines

  return suggestions;
}

```

**Display:** Show in sidebar panel or as CodeActions (lightbulb)

---

## **Key Technical Decisions**

### **MVP:**

- ✅ Regex parsing (fast, good enough for demo)
- ✅ In-memory storage (no DB needed)
- ✅ Native VSCode UI (TreeView, CodeLens)
- ✅ Hardcoded pricing (accurate as of Jan 2025)

### **Sprint 2:**

- ✅ Separate web dashboard (more flexible UI)
- ✅ SQLite for persistence (lightweight, no server)
- ✅ HTTP API for extension ↔ web communication
- ✅ Rule-based suggestions (no ML needed)

---

## **File Structure**

```
vscode-extension/
├── src/
│   ├── extension.ts          # Entry point
│   ├── parser.ts              # Detect LLM calls
│   ├── costCalculator.ts      # Token estimation + pricing
│   ├── codeLensProvider.ts    # Inline annotations
│   ├── treeViewProvider.ts    # Sidebar panel
│   └── suggestionEngine.ts    # Sprint 2: optimization rules
├── package.json
└── tsconfig.json

web-dashboard/  # Sprint 2
├── app/
│   ├── page.tsx               # Real-time dashboard
│   ├── sandbox/page.tsx       # Cost simulator
│   └── api/track/route.ts     # Data ingestion endpoint
├── components/
│   ├── CostChart.tsx
│   └── BudgetAlert.tsx
└── lib/db.ts                  # SQLite wrapper
**Testing Strategy**
```

---

### **Sample test files to create:**

```python
# test_openai.py
import openai
client = openai.OpenAI()
response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "Hello world"}]
)

```

```tsx
// test_anthropic.ts
import Anthropic from '@anthropic-ai/sdk';
const client = new Anthropic();
const msg = await client.messages.create({
  model: "claude-sonnet-4-20250514",
  messages: [{ role: "user", content: "Hi" }]
});

```

---