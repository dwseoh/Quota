# quota - vscode extension

vscode extension that tracks and optimizes costs in your codebase. mvp focuses on llm api calls.

## setup

```bash
npm install
npm run compile
```

## development

### running the extension

1. press `F5` in vscode to open extension development host
2. open a test file from `test_files/`
3. you should see the cost tracker panel in the sidebar

### parallel work structure

this project is set up for 3 people to work in parallel:

#### person 1: parser + cost calculator

**files to modify:**

- `src/parser.ts` - detect llm api calls using regex
- `src/cost_calculator.ts` - calculate token estimates and costs

**what to implement:**

- regex patterns to detect openai and anthropic api calls
- extract model name, prompt text, line numbers
- token estimation (text.length / 4)
- cost calculation using pricing table

**testing:**

- use `test_files/test_openai.py` and `test_files/test_anthropic.ts`
- export `parse_llm_calls()` function that returns `llm_call[]`

#### person 2: codelens provider

**files to modify:**

- `src/codelens_provider.ts` - inline cost annotations

**what to implement:**

- call `parse_llm_calls()` from person 1 (use mock data initially)
- create codelens at each detected call line
- show cost estimate in codelens title
- handle click to show detailed breakdown

**testing:**

- open test files and verify codelens appear above api calls
- click codelens to see cost details popup

#### person 3: treeview provider

**files to modify:**

- `src/treeview_provider.ts` - sidebar panel

**what to implement:**

- display list of detected calls with costs
- show total cost at top
- add scale simulator section
- implement user count input for monthly projection

**testing:**

- check sidebar panel shows detected calls
- verify total cost calculation
- test user count input and monthly projection

### shared files (don't modify in parallel)

- `src/types.ts` - shared type definitions (already complete)
- `src/extension.ts` - main entry point (already wired up)

### workflow

1. **hour 0:** everyone pulls, person 1 ensures `types.ts` is complete
2. **hours 1-5:** parallel work (use mock data if needed)
3. **hour 5-6:** integration (person 1 pushes, others pull and integrate)
4. **hour 6-7:** polish and test together

## commands

- `cost-tracker.showCostDetails` - show detailed cost breakdown
- `cost-tracker.updateUserCount` - update user count for simulation
- `cost-tracker.refresh` - refresh cost analysis

## testing

```bash
npm run compile  # compile typescript
npm run watch    # watch mode for development
```

open test files in extension development host:

- `test_files/test_openai.py`
- `test_files/test_anthropic.ts`

## architecture

```
src/
├── extension.ts           # main entry point (wires everything together)
├── types.ts               # shared type definitions
├── parser.ts              # person 1: detect api calls
├── cost_calculator.ts     # person 1: calculate costs
├── codelens_provider.ts   # person 2: inline annotations
└── treeview_provider.ts   # person 3: sidebar panel
```

## notes

- all function/variable names use snake_case (lowercase)
- pricing table is hardcoded (accurate as of jan 2025)
- token estimation uses simple heuristic: 1 token ≈ 4 characters
- mvp supports python, typescript, javascript files
- mvp supports openai and anthropic providers
