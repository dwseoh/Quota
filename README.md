<div align="center">

<img src="logo.png" alt="" width="100">

<h1> Quota </h1>

<p> Real-time financial intelligence for your codebase. </p>

</div>

---

> Don't let hidden tech debts become a surprise bill.

Quota solves that. It allows developers to track and optimize resource costs like APIs, databases, and cloud infrastructure directly within the engineering workflow.

By surfacing resource impact _before_ shipping, Quota prevents budget overruns and ensures efficient scaling.

Watch the demo: https://youtu.be/SUyDS37U6A0

## Key Features

### VS Code Extension

Transforms the editor into a financial control center.

- **Key Metrics**: Live dashboard displays the cost origins and calculated value throughout the codebase, allowing you to fix it immediately.
- **Real-Time Cost Heatmaps**: Editor decorations highlight high-cost code blocks (e.g., heavy DB queries or legacy LLM calls) for immediate optimization.
- **One-Click Optimization**: Auto-detects inefficient resource patterns and suggests one-click refactors to cheaper alternatives.
- **Bankruptcy Prevention**: Live dashboard projects monthly burn rates based on user scale, alerting you before budget thresholds are breached.
- **Intelligent Classification**: Parses and prices resource usage across complex codebases using AST analysis.

### Web Sandbox

Platform for architectural planning and cost forecasting.

- **Architecture Designer**: Drag-and-drop canvas for prototyping systems with built-in cost projections.
- **Predictive Pricing**: Estimates cloud and AI costs for designs before implementation.
- **AI Architect Assistant**: Intelligent agent that optimizes designs for latency and cost.
- **AI Visualization**: Automatically generates and visualizes interactive system architecture graphs from high-level descriptions.

## Tech Stack

- **Core**: TypeScript, Python (FastAPI), Node.js, Go
- **AI**: Google Gemini Pro, Tree-sitter, LangChain (RAG)
- **Frontend**: Next.js, React Flow, Tailwind CSS
- **Data**: MongoDB, Vector embeddings (FAISS)

## Quick Start

### 1. VS Code Extension

```bash
cd vscode-extension
npm install
npm run compile
code .
# press F5 to launch
```

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
