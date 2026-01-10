# Node.js v24 Setup Instructions

## ✅ This project is now configured for Node.js v24!

A `.npmrc` file has been added to force C++20 compilation for `tree-sitter`.

---

## For Your Friend on Node.js v24

Just run:

```bash
cd vscode-extension
npm install
```

That's it! The `.npmrc` file will automatically configure C++20 compilation.

---

## What Was Added

**File**: `.npmrc`
```
cxxflags=-std=c++20
```

This tells npm to compile native modules (like tree-sitter) with C++20 support.

---

## If It Still Fails

1. **Make sure build tools are installed**:
   
   **macOS**:
   ```bash
   xcode-select --install
   ```
   
   **Linux**:
   ```bash
   sudo apt-get install build-essential
   ```
   
   **Windows**:
   Install Visual Studio Build Tools

2. **Check compiler supports C++20**:
   ```bash
   c++ --version
   ```

3. **Try clean install**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Fallback to Node v22** (if still issues):
   ```bash
   nvm use 22
   npm install
   ```

---

## Verification

After `npm install`, test it works:

```bash
npm run compile
node test-analyze.js
```

Expected output:
```
✅ Success!
⏱️  Duration: 0.01s
📄 Files: 15
🔍 Units: 74
💰 Paid APIs: 16
```

---

## Why This Works

- Node.js v24 requires C++20 for tree-sitter
- The `.npmrc` file tells npm to use C++20
- This happens automatically during `npm install`
- No manual configuration needed!

---

**The project is now Node.js v24 compatible!** 🚀
