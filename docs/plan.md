## tech stack

- **vscode extension:** typescript + vscode api
- **web dashboard:** next.js + react + tailwind
- **parsing:** regex (mvp) → tree-sitter (later)
- **storage:** vscode globalstate (mvp) → sqlite (sprint 2+)

---

## mvp implementation

### 1. setup (30 min)

```bash
npm install -g yo generator-code
yo code  # pick typescript template
```

files: `extension.ts`, `package.json`, `tsconfig.json`

### 2. api call detection (2 hrs)

**approach:** naive regex matching

**listen to:**

- `vscode.workspace.onDidOpenTextDocument`
- `vscode.workspace.onDidChangeTextDocument`

**detect patterns:**

```tsx
// openai
openai.chat.completions.create(...)
client.chat.completions.create(...)

// anthropic
anthropic.messages.create(...)
client.messages.create(...)
```

**extract:** function name, model param, prompt/messages content

**data structure:**

```tsx
interface llm_call {
  line: number;
  provider: "openai" | "anthropic";
  model: string;
  prompt_text: string;
  estimated_tokens: number;
  estimated_cost: number;
}
```

### 3. cost calculation (1 hr)

**token estimation:**

```tsx
estimated_tokens = prompt_text.length / 4; // rough heuristic
```

**pricing table (hardcoded):**

```tsx
const pricing = {
  "gpt-4": { input: 0.03, output: 0.06 }, // per 1k tokens
  "gpt-3.5-turbo": { input: 0.0005, output: 0.0015 },
  "claude-sonnet-4": { input: 0.003, output: 0.015 },
  "claude-haiku": { input: 0.00025, output: 0.00125 },
};
```

**calculate:** `cost = (tokens / 1000) * price`

### 4. inline display - codelens (2 hrs)

```tsx
vscode.languages.registerCodeLensProvider(
  { language: "python" }, // or 'typescript', 'javascript'
  {
    provideCodeLenses(document) {
      return detected_calls.map(
        (call) =>
          new vscode.CodeLens(new vscode.Range(call.line, 0, call.line, 0), {
            title: `💰 ~$${call.estimated_cost.toFixed(4)} per call`,
            command: "extension.showCostDetails",
            arguments: [call],
          })
      );
    },
  }
);
```

**on click:** show vscode info message with breakdown

### 5. sidebar panel (2-3 hrs)

**approach:** treeview api

```tsx
class cost_tree_provider implements vscode.TreeDataProvider<cost_item> {
  getChildren() {
    return [
      new cost_item(`total: $${total_cost}`),
      ...detected_calls.map(call =>
        new cost_item(`${call.model}: $${call.cost}`)
      ),
      new cost_item('--- scale simulator ---'),
      new cost_item(`at ${user_count} users/day: $${scaled_cost}/month`)
    ];
  }
}

// in package.json
"views": {
  "explorer": [{
    "id": "cost_panel",
    "name": "cost tracker"
  }]
}
```

**user input:** `vscode.window.showInputBox()` for multiplier

---

## sprint 2 implementation

### architecture

split into 2 components:

1. **vscode extension** - file analysis + send data to web
2. **web dashboard** - visualization + sandbox

### 1. live cost dashboard (3-4 hrs)

**setup:**

```bash
npx create-next-app@latest cost-dashboard
# add recharts, tailwind
```

**data flow:**

```
vscode extension → POST localhost:3000/api/track → sqlite → web displays
```

**implementation:**

- extension sends cost events via http post
- next.js api route stores in sqlite
- dashboard polls/subscribes for updates
- show: line chart (costs over time), session total, today's activity

**pages:**

- `/` - real-time dashboard
- `/sandbox` - interactive cost simulator

### 2. budget alerts (1 hr)

**implementation:**

- store budget in vscode settings: `extension.configuration`
- check after each calculation:
  ```tsx
  if (session_total > budget * 0.8) {
    vscode.window.showWarningMessage("⚠️ 80% of budget used!");
  }
  ```
- status bar item changes color (green → yellow → red)

### 3. multi-file analysis (2-3 hrs)

**approach:** workspace scanner

```tsx
// scan all files
const files = await vscode.workspace.findFiles("**/*.{py,js,ts}");

// parse in parallel
const all_calls = await Promise.all(
  files.map((file) => parse_file_for_calls(file))
);

// aggregate
const summary = {
  total_files: files.length,
  total_calls: all_calls.flat().length,
  total_cost: calculate_total(all_calls),
  most_expensive_files: sort_by_cost(all_calls).slice(0, 5),
};
```

**display:** webview panel with project overview

### 4. optimization suggestions (2 hrs)

**approach:** rule-based pattern matching

```tsx
function generate_suggestions(calls: llm_call[]) {
  const suggestions = [];

  // rule 1: expensive model check
  calls.forEach((call) => {
    if (call.model === "gpt-4" && call.prompt_text.length < 500) {
      suggestions.push({
        type: "model_swap",
        message: `line ${call.line}: switch to gpt-3.5 (85% cheaper)`,
        savings: calculate_savings(call, "gpt-3.5-turbo"),
      });
    }
  });

  // rule 2: duplicate prompts
  const prompt_counts = count_duplicates(calls.map((c) => c.prompt_text));
  prompt_counts.forEach((count, prompt) => {
    if (count > 3) {
      suggestions.push({
        type: "caching",
        message: `prompt appears ${count}x - cache to save $X/month`,
      });
    }
  });

  // rule 3: loop detection
  // check if multiple calls on consecutive lines

  return suggestions;
}
```

**display:** sidebar panel or codelens actions (lightbulb)

---

## file structure

```
vscode-extension/
├── src/
│   ├── extension.ts          # entry point
│   ├── parser.ts              # detect llm calls
│   ├── cost_calculator.ts     # token estimation + pricing
│   ├── codelens_provider.ts   # inline annotations
│   ├── treeview_provider.ts   # sidebar panel
│   └── suggestion_engine.ts   # sprint 2: optimization rules
├── package.json
└── tsconfig.json

web-dashboard/  # sprint 2
├── app/
│   ├── page.tsx               # real-time dashboard
│   ├── sandbox/page.tsx       # cost simulator
│   └── api/track/route.ts     # data ingestion
├── components/
│   ├── cost_chart.tsx
│   └── budget_alert.tsx
└── lib/db.ts                  # sqlite wrapper
```

---

## testing strategy

**sample test files:**

```python
# test_openai.py
import openai
client = openai.OpenAI()
response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "hello world"}]
)
```

```tsx
// test_anthropic.ts
import Anthropic from "@anthropic-ai/sdk";
const client = new Anthropic();
const msg = await client.messages.create({
  model: "claude-sonnet-4-20250514",
  messages: [{ role: "user", content: "hi" }],
});
```

---

## key decisions

### mvp

- ✅ regex parsing (fast, good enough)
- ✅ in-memory storage (no db)
- ✅ native vscode ui (treeview, codelens)
- ✅ hardcoded pricing (accurate as of jan 2025)

### sprint 2

- ✅ separate web dashboard (flexible ui)
- ✅ sqlite for persistence (lightweight)
- ✅ http api for extension ↔ web
- ✅ rule-based suggestions (no ml needed)
