# quota vscode extension

this is the vscode extension for tracking api costs. it uses tree-sitter to parse your code and gemini to figure out which calls actually cost money.

## setup

1. `npm install`
2. `cp .env.example .env` (add your `gemini_api_key`)
3. `npm run compile`
4. hit `f5` to launch the extension host.

## how it works

- **parser** (`src/parser.ts`, `src/ast_parser.ts`): pulls out functions and calls using ast.
- **classifier** (`src/intelligence.ts`): sends batches of code to gemini to tag paid providers (openai, stripe, etc).
- **codelens** (`src/codelens_provider.ts`): shows the price tag right above the code.
- **sidebar** (`src/treeview_provider.ts`): math for the total cost and scale projections.

## commands

- `cost tracker: refresh cost analysis`: re-scans everything.
- `cost tracker: update user count`: changes the projection math.

## testing

check `test_files/` for `test_openai.py` and `test_anthropic.ts`. run `npm run watch` while devving.
