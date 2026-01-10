# Node.js v24 Support - UPDATED

## ✅ Better Solution Implemented

The `.npmrc` approach doesn't work because npm doesn't support `cxxflags` directly.

**Instead, use one of these methods:**

---

## Method 1: Environment Variable (Recommended)

Your friend should run this **before** `npm install`:

```bash
export CXXFLAGS="-std=c++20"
npm install
```

### Make it permanent (optional):

Add to `~/.zshrc` or `~/.bashrc`:
```bash
echo 'export CXXFLAGS="-std=c++20"' >> ~/.zshrc
source ~/.zshrc
```

---

## Method 2: One-Line Install

```bash
CXXFLAGS="-std=c++20" npm install
```

This sets the flag just for that one command.

---

## Method 3: Use Node.js v22 (Easiest)

Honestly, this is still the easiest solution:

```bash
nvm use 22
npm install
```

Node v22 works perfectly without any configuration.

---

## Why .npmrc Didn't Work

- npm doesn't recognize `cxxflags` as a valid config option
- C++ compiler flags need to be set as environment variables
- npm can't pass these flags directly to node-gyp

---

## For Your Friend

**Easiest**: Use Node v22
```bash
nvm use 22
npm install
```

**If they must use Node v24**:
```bash
export CXXFLAGS="-std=c++20"
npm install
```

---

**Bottom line**: Node v22 is way easier. Node v24 requires manual environment variable setup.
