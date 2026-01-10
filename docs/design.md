## what is this

vscode extension that tracks and optimizes costs in your codebase. shows you what things cost in real-time and suggests ways to save money.

**mvp scope:** api calls (llm providers like openai, anthropic)  
**future scope:** all cost types (db queries, cloud services, storage, compute, etc)

---

## mvp

**goal:** track llm api call costs inline

- detect api calls (naive regex parsing)
- inline cost estimates via codelens
- sidebar panel: list calls, total cost, scale simulator
- works for openai + anthropic (minimum)

**demo flow:**

1. open file with llm calls → costs appear automatically
2. click annotation → see breakdown (model, tokens, cost)
3. adjust user count in sidebar → monthly projection updates

---

## sprint 2

**goal:** web dashboard + smarter analysis

### live cost dashboard

- web app (next.js) with real-time tracking
- "you've written $X worth of api calls today"
- session history graph (costs over time)
- better sandbox than mvp (more customizable)

### budget alerts

- set monthly limit in settings
- warnings at 80%: "you're at 80% of $500 budget"
- status bar color: green → yellow → red

### multi-file analysis

- scan entire workspace
- project-wide cost summary
- find most expensive files/functions
- architecture cost overview

### optimization suggestions (pick 2-3)

- "switch to gpt-3.5 to save $X/month"
- "this prompt appears 5x - consider caching"
- "this call is in a loop - batch instead"

---

## sprint 3

**goal:** advanced features + extensibility

### git integration

- cost history over commits
- "this pr will increase monthly costs by $450"
- git blame for expensive functions

### smart caching analyzer

- detect duplicate/similar calls
- calculate exact savings from caching
- generate caching code snippets

### cost heatmap

- color-code entire codebase by cost
- red = expensive, green = cheap
- visual overview of problem areas

### model comparison tool

- side-by-side: gpt-4 vs gpt-3.5 vs claude
- show cost difference + quality trade-offs
- one-click model swap recommendations

### export & reporting

- generate cost reports (pdf/csv)
- share with team
- cost trends over time graphs

### extended support

- more languages (java, go, ruby, php)
- more providers (gemini, cohere, etc)
- **expand beyond api calls:** db queries, cloud services, storage costs
