# How to Run the Extension

## Super Simple Steps

### 1. Open the `vscode-extension` folder in VS Code

**IMPORTANT**: You must open the `vscode-extension` folder itself, not the parent `deltahacks` folder.

```bash
cd vscode-extension
code .
```

Or in VS Code: `File > Open Folder` → select `vscode-extension`

### 2. Install dependencies (first time only)

In the terminal inside VS Code:
```bash
npm install
```

### 3. Compile the code

```bash
npm run compile
```

### 4. Press F5

Just hit `F5` on your keyboard.

**What happens:**
- A **second VS Code window** opens (this is the "Extension Development Host")
- Your extension is running in that new window
- The original window is for editing code

### 5. See your extension

In the **new window** (Extension Development Host):
- Look at the left sidebar (Explorer)
- Scroll down
- You'll see **"Cost Tracker"** panel with your treeview
- It shows 3 mock API calls with costs

## Visual Guide

```
WINDOW 1 (your code editor)          WINDOW 2 (Extension Development Host)
┌─────────────────────────┐          ┌─────────────────────────┐
│ vscode-extension/       │          │                         │
│ ├─ src/                 │          │  ← Your extension       │
│ │  ├─ extension.ts      │          │     running here        │
│ │  └─ treeview_...ts    │          │                         │
│ ├─ package.json         │          │  Explorer sidebar:      │
│ └─ ...                  │          │  ├─ 📁 Files            │
│                         │          │  └─ 💰 Cost Tracker ←   │
│ [Press F5 here] ────────┼─────────→│      └─ Your treeview!  │
└─────────────────────────┘          └─────────────────────────┘
```

## Test It

In the Extension Development Host window (window 2):
- Click on any API call in Cost Tracker → popup shows details
- Click toolbar buttons (refresh icon, edit icon)
- Expand/collapse sections

## Making Changes

When you edit code:

1. Save your changes
2. In window 1: `npm run compile`
3. In window 2: Press `Ctrl+R` (or `Cmd+R` on Mac) to reload
4. Your changes appear

Or use watch mode (auto-compiles):
```bash
npm run watch
```
Then you only need to `Ctrl+R` in window 2.

## Troubleshooting

**Nothing happens when I press F5**
- Make sure you opened the `vscode-extension` folder, not `deltahacks`
- Check bottom-left of VS Code - should show "vscode-extension" as folder name

**"Cannot find module" errors**
```bash
npm install
npm run compile
```

**Don't see Cost Tracker panel**
- You're looking in window 2 (Extension Development Host), right?
- Check left sidebar → Explorer → scroll down
- Try: View > Open View > Cost Tracker

## Development Workflow

1. Make code changes in main VS Code window
2. Save files
3. If using `npm run watch`: Just reload Extension Development Host
   - Press `Ctrl+R` (or `Cmd+R` on Mac) in Extension Development Host
4. If not using watch mode: Recompile then reload
   ```bash
   npm run compile
   ```
   - Then `Ctrl+R` in Extension Development Host

## Quick Reload

Instead of stopping and restarting:
- In Extension Development Host window
- Press `Ctrl+R` (Windows/Linux) or `Cmd+R` (Mac)
- Or: `Ctrl+Shift+P` → "Developer: Reload Window"

## Debugging

### View Console Logs
In main VS Code window:
- View > Output
- Select "Extension Host" from dropdown

Or:
- View > Debug Console

### Set Breakpoints
- Open any `.ts` file in `src/`
- Click left of line number to add red dot
- When code runs, debugger pauses there

## Package Extension (Optional)

To create a `.vsix` file for distribution:

```bash
npm install -g @vscode/vsce
vsce package
```

This creates `cost-tracker-0.0.1.vsix` that can be installed in VS Code.

## Current Status

- ✅ Treeview: Complete with mock data
- ⏳ Parser: Not implemented yet (person 1's work)
- ⏳ Codelens: Basic structure only (person 2's work)

The treeview works with mock data right now. When parser is ready, uncomment 2 lines in `extension.ts` (lines 9, 114-115).
