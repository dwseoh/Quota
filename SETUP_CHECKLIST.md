# setup verification checklist

run through this checklist to verify everything is ready for parallel work

## ✅ extension boilerplate

- [x] vscode extension scaffolded
- [x] typescript configured
- [x] package.json set up with commands and views
- [x] extension compiles successfully

## ✅ shared foundation

- [x] `src/types.ts` - shared type definitions
- [x] `src/extension.ts` - main entry point wired up
- [x] codelens provider registered
- [x] treeview provider registered
- [x] commands registered

## ✅ work areas (ready for parallel work)

- [x] `src/parser.ts` - person 1 (placeholder ready)
- [x] `src/cost_calculator.ts` - person 1 (pricing table + functions ready)
- [x] `src/codelens_provider.ts` - person 2 (placeholder ready)
- [x] `src/treeview_provider.ts` - person 3 (placeholder ready)

## ✅ test files

- [x] `test_files/test_openai.py` - openai api calls
- [x] `test_files/test_anthropic.ts` - anthropic api calls

## ✅ documentation

- [x] `README.md` - root level quick start
- [x] `vscode-extension/README.md` - detailed setup guide
- [x] `docs/design.md` - feature roadmap
- [x] `docs/plan.md` - technical plan
- [x] `docs/collab.md` - parallel work strategy

## 🚀 ready to branch!

main branch is now ready for parallel collaboration. each person can:

1. pull main branch
2. create feature branch:
   - `git checkout -b feature/parser` (person 1)
   - `git checkout -b feature/codelens` (person 2)
   - `git checkout -b feature/treeview` (person 3)
3. work on their assigned files
4. test using the test files
5. merge back when ready

## testing the setup

to verify the extension works:

```bash
cd vscode-extension
npm run compile
```

press `F5` in vscode to launch extension development host

you should see:

- cost tracker panel in sidebar (empty for now)
- no errors in debug console
- extension activates when opening .py, .ts, or .js files

## next steps

see `docs/collab.md` for the detailed parallel work workflow
