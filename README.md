<div align="center">

<img src="assets/logo.png" width="120" height="120">

# Quota

Real-time financial intelligence for your codebase.

🥇 First place at DeltaHacks 2026

[![GitHub stars](https://img.shields.io/github/stars/dwseoh/Quota?style=social)](https://github.com/dwseoh/Quota)
[![GitHub forks](https://img.shields.io/github/forks/dwseoh/Quota?style=social)](https://github.com/dwseoh/Quota/network/members)

</div>

---

**Don't let hidden tech debt become a surprise bill.**

Quota tracks and optimizes resource costs—APIs, databases, and cloud infrastructure—directly within your engineering workflow. By surfacing financial impact _before_ shipping, Quota prevents budget overruns and ensures efficient scaling.

[Watch the Demo](https://youtu.be/SUyDS37U6A0)

[View the Devpost](https://devpost.com/software/quota-fg4pzi)

## Key Features

### VS Code Extension

Real-time cost tracking and optimization directly in your editor.

- **Cost Heatmaps**: Highlights high-cost code blocks (DB queries, LLM calls) for immediate optimization.
- **Optimization Suggestions**: Auto-detects inefficient patterns and suggests methods (e.g. caching, batch processing, change cloud provider, etc.)
- **One-Click Fixes**: Auto-detects inefficient patterns and suggests cheaper alternatives.
- **Budget Alerts**: Live dashboard projects monthly burn rates and alerts you before reaching thresholds.
- **Smart Analysis**: Uses AST parsing and Gemini AI to classify and price resource usage.

### Web Dashboard

Visual architecture planning and cost forecasting.

- **Architecture Designer**: Drag-and-drop canvas for prototyping systems with built-in cost projections.
- **AI Assistant**: Intelligent agent that optimizes designs for latency and cost.
- **Architecture Generation**: Automatically builds interactive system graphs from high-level descriptions.

## Tech Stack

### VS Code Extension

- TypeScript
- Tree-sitter (AST parsing)

### Web Dashboard

- **Frontend**: Next.js, React Flow, Tailwind CSS, Zustand
- **Backend**: Python (FastAPI), LangChain (RAG)
- **Database**: MongoDB, FAISS (Vector Store)
- **AI**: Google Gemini (Architecture manipulation & assistance)

## How it works

### Web sandbox workflow

![](assets/sandbox_flow.png)

### VS Code extension workflow

![](assets/vscode_flow.png)

## Quick Start

### 1. VS Code Extension

```bash
cd vscode-extension
npm install
npm run compile
```

then press `F5` in VS Code to launch

### 2. Web Dashboard

**Backend:**

```bash
cd web-dashboard/backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python -m app.main
```

**Frontend:**

```bash
cd web-dashboard/frontend
npm install
npm run dev
```

## Web sandbox design process

![Initial Sketch](assets/sketch.jpg)
