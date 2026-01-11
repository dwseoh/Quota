Quota-

vscode extension + web dashboard for tracking and optimizing costs in your codebase

## project structure

```
deltahacks/
├── docs/              # documentation
│   ├── design.md      # feature roadmap (mvp → sprint 3)
│   ├── plan.md        # technical implementation plan
│   └── collab.md      # parallel work strategy
├── vscode-extension/  # mvp: vscode extension
└── web-dashboard/     # sprint 2: web app (not started yet)
```

## quick start

### vscode extension (mvp)

```bash
cd vscode-extension
npm install
npm run compile
```

press `F5` in vscode to launch extension development host

**see `vscode-extension/README.md` for detailed setup and parallel work instructions**

## mvp scope

track llm api call costs inline:

- detect openai + anthropic api calls
- show inline cost estimates (codelens)
- sidebar panel with total cost + scale simulator
- supports python, typescript, javascript

## parallel work setup

this project is designed for 3 people to work in parallel:

1. **person 1:** parser + cost calculator (`parser.ts`, `cost_calculator.ts`)
2. **person 2:** codelens provider (`codelens_provider.ts`)
3. **person 3:** treeview provider (`treeview_provider.ts`)

shared foundation is already set up:

- ✅ extension boilerplate
- ✅ shared types (`types.ts`)
- ✅ main entry point wired up (`extension.ts`)
- ✅ package.json configured
- ✅ test files ready

**ready to branch and work in parallel!**

## next steps

1. everyone pulls main branch
2. create feature branches:
   - `feature/parser`
   - `feature/codelens`
   - `feature/treeview`
3. work in parallel (hours 1-5)
4. integrate (hours 5-6)
5. polish together (hours 6-7)

see `docs/collab.md` for detailed workflow
