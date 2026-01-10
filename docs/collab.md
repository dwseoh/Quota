## mvp division - 3 people working in parallel

### person 1: core parser + cost logic

**files:** `parser.ts`, `cost_calculator.ts`, `types.ts`

**tasks:**

- detect llm api calls (regex for openai, anthropic)
- extract model, prompt text, line numbers
- token estimation + cost calculation
- export: `parse_llm_calls(document) => llm_call[]`

**output:** array of `llm_call` objects with all cost data

---

### person 2: codelens (inline display)

**files:** `codelens_provider.ts`, `extension.ts` (just codelens registration)

**tasks:**

- register codelens provider
- consume `parse_llm_calls()` from person 1 (mock it initially)
- display inline cost annotations
- handle click → show vscode info popup with breakdown

**dependency:** needs `llm_call` type from person 1 (share type definition first)

---

### person 3: sidebar panel (treeview)

**files:** `treeview_provider.ts`, `extension.ts` (just treeview registration)

**tasks:**

- create treeview provider
- display list of calls + total cost
- add user count input box
- calculate scaled cost (calls/day × monthly projection)

**dependency:** needs `llm_call` type from person 1 (share type definition first)

---

## workflow

### hour 0 (setup - 15 min, all together)

- person 1 scaffolds project: `yo code`
- push initial boilerplate
- person 1 creates `types.ts` with:
  ```tsx
  export interface llm_call {
    line: number;
    provider: "openai" | "anthropic";
    model: string;
    prompt_text: string;
    estimated_tokens: number;
    estimated_cost: number;
  }
  ```
- all pull

### hours 1-5 (parallel work)

- **person 1:** works on `parser.ts` + `cost_calculator.ts`
- **person 2:** works on `codelens_provider.ts` (uses mock data initially)
- **person 3:** works on `treeview_provider.ts` (uses mock data initially)

### hour 5-6 (integration)

- person 1 pushes parser/calculator
- persons 2 & 3 pull and swap mock data for real `parse_llm_calls()`
- quick test together

### hour 6-7 (polish)

- fix bugs
- test with sample files
- record demo

---

## key rules

- ✅ only person 1 touches `parser.ts` and `cost_calculator.ts`
- ✅ only person 2 touches `codelens_provider.ts`
- ✅ only person 3 touches `treeview_provider.ts`
- ✅ `extension.ts` only modified for registration (merge conflicts minimal)
- ✅ share `types.ts` first thing (everyone needs it)

**no chaos. no idle time. clean merges.**
