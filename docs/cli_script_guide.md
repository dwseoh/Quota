# CLI Test Script - Quick Reference

## ✅ Created: `run-parser.js`

A comprehensive CLI script to test the parser with various options.

---

## Usage

```bash
node run-parser.js [options]
```

---

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--gemini` | Use Gemini batch classification | Quick detection (regex) |
| `--scope <path>` | Limit to specific directory | Full workspace |
| `--clean` | Remove `.delta-analytics-config` before running | Keep existing |
| `--help` | Show help message | - |

---

## Examples

### 1. Quick Detection (Fast, No API Calls)
```bash
node run-parser.js
```
- ⚡ ~1-2 seconds
- Uses regex pattern matching
- No Gemini API calls
- Good for quick testing

### 2. Gemini Classification (Accurate, Uses API)
```bash
node run-parser.js --gemini
```
- 🤖 ~40-60 seconds
- Uses Gemini AI for classification
- 1-2 API calls total
- Most accurate results

### 3. Scope to Specific Directory
```bash
node run-parser.js --scope src/
```
- Only analyzes `src/` directory
- Faster for large workspaces
- Good for testing specific modules

### 4. Clean Index + Gemini
```bash
node run-parser.js --clean --gemini
```
- Removes existing `.delta-analytics-config/`
- Forces complete re-indexing
- Uses Gemini classification

### 5. Clean + Scope + Gemini
```bash
node run-parser.js --clean --scope src/ --gemini
```
- Clean index
- Only `src/` directory
- Gemini classification
- Best for focused testing

---

## Output

The script provides detailed output:

```
=== Delta Parser Test ===

Configuration:
  Classification: 🤖 Gemini API
  Scope: src/
  Clean index: ✅ Yes

🔧 Initializing parser...
✅ Parser initialized

📊 Scanning scope: src/...
✅ Found 11 files

🚀 Starting indexing...
   Using Gemini batch classification

✅ Indexing complete in 43.91s!

=== Results ===

📄 Files indexed: 18
🔍 Code units analyzed: 56
🤖 Classifications: 56

💰 Potential Paid API Usage: 9 location(s)

By Category:
  📦 llm: 9 usage(s)

By Provider:
  🏢 Google (Gemini): 4 usage(s)
  🏢 OpenAI: 3 usage(s)
  🏢 Anthropic: 2 usage(s)

Sample Detections:
  • initializeGemini
    File: intelligence.ts:20
    Provider: Google (Gemini) (llm)
    Confidence: 100%

=== Storage ===

✅ index.json: 118.35 KB
✅ file-map.hash: 2158 bytes
📁 Location: .delta-analytics-config/

✅ Test complete!
```

---

## Features

### ✅ Automatic Cleanup
- `--clean` flag removes `.delta-analytics-config/` before running
- Ensures fresh index every time
- Prevents stale data issues

### ✅ Flexible Scope
- `--scope` limits analysis to specific directories
- Faster for large codebases
- Good for testing individual modules

### ✅ Gemini Toggle
- Default: Quick regex detection (fast)
- `--gemini`: AI-powered classification (accurate)
- Choose based on your needs

### ✅ Detailed Results
- Shows files, units, classifications
- Groups by category and provider
- Sample detections with confidence scores
- Storage information

---

## Performance

| Mode | Time | API Calls | Accuracy |
|------|------|-----------|----------|
| Quick Detection | 1-2s | 0 | Good |
| Gemini Batch | 40-60s | 1-2 | Excellent |

---

## Troubleshooting

### "GEMINI_API_KEY not found"
```bash
# Create .env file
cp .env.example .env

# Add your key
echo "GEMINI_API_KEY=your_key_here" >> .env
```

### "Scope path does not exist"
```bash
# Check the path exists
ls src/

# Use correct relative path
node run-parser.js --scope src/
```

### Slow Performance
```bash
# Use --scope to limit files
node run-parser.js --scope src/intelligence.ts

# Or use quick detection
node run-parser.js  # (no --gemini flag)
```

---

## Tips

1. **Start with quick detection** to test the system
2. **Use --scope** for large codebases
3. **Add --gemini** when you need accurate results
4. **Use --clean** if results seem stale
5. **Check `.delta-analytics-config/index.json`** to see raw data

---

## Next Steps

After running the script:

1. **Review Results**: Check detected APIs and confidence scores
2. **Verify Accuracy**: Compare with actual code
3. **Test in VSCode**: Press F5 to see CodeLens in action
4. **Customize**: Adjust patterns in `intelligence.ts` if needed

---

## File Location

```
vscode-extension/
├── run-parser.js          ← CLI script
├── .delta-analytics-config/
│   ├── index.json         ← Results
│   └── file-map.hash      ← File tracking
└── .env                   ← API key
```

---

## Quick Commands

```bash
# Help
node run-parser.js --help

# Quick test
node run-parser.js

# Full analysis
node run-parser.js --clean --gemini

# Specific directory
node run-parser.js --scope src/intelligence.ts --gemini
```

---

**The CLI script is ready to use!** 🚀
