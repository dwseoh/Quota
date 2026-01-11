# Quota

VSCode extension and web dashboard for tracking and optimizing costs in your codebase.

## Overview

Quota helps developers understand and optimize the costs associated with their code by analyzing paid API usage and providing intelligent insights. The project consists of two main components:

1. **VSCode Extension**: Analyzes your codebase to detect paid API calls (OpenAI, Anthropic, Stripe, etc.) and provides inline cost estimates with AI-powered classification
2. **Web Dashboard**: Interactive architecture design tool with AI chatbot assistance for building and analyzing software architectures

## Components

### VSCode Extension

A VSCode extension that tracks API costs in real-time by analyzing your codebase.

**Key Features:**
- Workspace indexing with AST parsing
- AI-powered API classification using Google Gemini
- Inline cost estimates via CodeLens
- Sidebar panel with cost breakdown and scale simulator
- Incremental updates for changed files only

**Technologies:**
- TypeScript
- VSCode Extension API
- Google Gemini API
- AST parsing with VSCode DocumentSymbolProvider

### Web Dashboard

An interactive web application for designing software architectures with AI assistance.

**Key Features:**
- Drag-and-drop architecture canvas
- Comprehensive component library (databases, APIs, caching, etc.)
- Real-time cost analysis
- RAG-powered AI chatbot for architecture guidance
- Scope configuration (users, traffic, data volume, regions)
- Export/import architecture designs

**Technologies:**

**Frontend:**
- Next.js + React + TypeScript + Tailwind CSS
- Zustand (state management)
- React Flow (canvas)
- Framer Motion (animations)

**Backend:**
- FastAPI
- Google Gemini API
- LangChain with FAISS vector store
- Pydantic
- MongoDB with Motor async driver

## Setup

### VSCode Extension

1. Navigate to the extension directory:
   ```bash
   cd vscode-extension
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env and add your GEMINI_API_KEY
   ```

4. Compile and run:
   ```bash
   npm run compile
   # Press F5 in VSCode to launch Extension Development Host
   ```

See [docs/vscode-extension.md](docs/vscode-extension.md) for detailed documentation.

### Web Dashboard

**Backend:**

1. Navigate to the backend directory:
   ```bash
   cd web-dashboard/backend
   ```

2. Create and activate virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env and add your GEMINI_API_KEY
   ```

5. Run the server:
   ```bash
   python -m app.main
   # API available at http://localhost:8000
   ```

**Frontend:**

1. Navigate to the frontend directory:
   ```bash
   cd web-dashboard/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   # Open http://localhost:3000
   ```

See [docs/web-dashboard.md](docs/web-dashboard.md) for detailed documentation.

## Project Structure

```
delta/
├── docs/
│   ├── vscode-extension.md    # VSCode extension documentation
│   └── web-dashboard.md       # Web dashboard documentation
├── vscode-extension/          # VSCode extension
│   ├── src/                   # TypeScript source code
│   ├── test_files/            # Sample test files
│   ├── run-parser.js          # CLI testing script
│   └── package.json
├── web-dashboard/
│   ├── backend/               # Python FastAPI backend
│   │   ├── app/               # Application code
│   │   └── requirements.txt
│   └── frontend/              # Next.js frontend
│       ├── app/               # Next.js app directory
│       ├── components/        # React components
│       ├── lib/               # Utilities and data
│       └── package.json
└── README.md
```

## Documentation

- [VSCode Extension Documentation](docs/vscode-extension.md) - Complete guide for the VSCode extension
- [Web Dashboard Documentation](docs/web-dashboard.md) - Complete guide for the web dashboard

## Development

### VSCode Extension

```bash
cd vscode-extension
npm run watch    # Watch mode for development
# Press F5 to launch Extension Development Host
```

### Web Dashboard

**Backend:**
```bash
cd web-dashboard/backend
python -m app.main  # Development mode with auto-reload
```

**Frontend:**
```bash
cd web-dashboard/frontend
npm run dev  # Development server with hot reload
```

## Prerequisites

- **VSCode Extension**: Node.js 22.x or higher, VSCode 1.95.0 or higher
- **Web Dashboard Backend**: Python 3.10 or higher
- **Web Dashboard Frontend**: Node.js 20.x or higher
- **API Key**: Google Gemini API key (get one at https://makersuite.google.com/app/apikey)

## License

Part of the Quota project.
