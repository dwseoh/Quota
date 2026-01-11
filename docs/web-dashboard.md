# Web Dashboard - Architecture Sandbox

Interactive web application for designing and analyzing software architectures with AI-powered assistance.

## Overview

The Architecture Sandbox is a visual tool for designing software architectures. It features a drag-and-drop canvas for building architecture diagrams, an AI chatbot for design assistance, and real-time cost analysis. The application consists of a Python FastAPI backend with RAG capabilities and a Next.js React frontend.

## Features

### Frontend

- **Interactive Canvas**: Drag-and-drop architecture design using React Flow
- **Component Library**: Pre-built components (databases, APIs, caching, authentication, etc.)
- **Real-time Cost Analysis**: Automatic cost calculation based on architecture scope
- **AI Chatbot**: Conversational interface for architecture guidance
- **Scope Configuration**: Define users, traffic, data volume, regions, and availability
- **Export/Import**: Save and load architecture designs

### Backend

- **RAG-Powered Chatbot**: Context-aware responses using LangChain and FAISS
- **Gemini Integration**: Google Gemini API for natural language understanding
- **Architecture Manipulation**: Generate and modify architecture designs programmatically
- **Cost Calculation**: Intelligent cost estimation for components and connections
- **Component Library API**: Access to all available architecture components
- **Session Management**: Maintain conversation context across requests
- **Connection Validation**: Ensure valid connections between components

## Architecture

### Frontend (Next.js)

- **Framework**: Next.js 16 with App Router
- **UI Library**: React 19 with TypeScript
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand
- **Canvas**: React Flow (@xyflow/react)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Markdown**: React Markdown with remark-gfm

### Backend (Python)

- **Framework**: FastAPI with Uvicorn
- **AI/LLM**: Google Gemini API (gemini-2.5-flash)
- **RAG Pipeline**: LangChain with FAISS vector store
- **Data Validation**: Pydantic v2
- **Database**: MongoDB (Motor async driver)
- **Environment**: python-dotenv

## Setup

### Prerequisites

- **Frontend**: Node.js 20.x or higher
- **Backend**: Python 3.10 or higher
- **API Key**: Google Gemini API key (get one at https://makersuite.google.com/app/apikey)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd web-dashboard/backend
   ```

2. Create a virtual environment:
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
   ```
   
   Edit `.env` and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

5. Run the server:
   ```bash
   python -m app.main
   ```
   
   Or using uvicorn directly:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

The API will be available at:
- API: http://localhost:8000
- Interactive docs: http://localhost:8000/docs
- Alternative docs: http://localhost:8000/redoc

### Frontend Setup

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
   ```

4. Open http://localhost:3000 in your browser

## API Endpoints

### POST `/api/chat`

Send a chat message and get a response.

**Request Body:**
```json
{
  "message": "How should I structure my backend?",
  "session_id": "optional-session-id",
  "architecture_json": {
    "nodes": [],
    "edges": [],
    "scope": {
      "users": 1000,
      "trafficLevel": 2,
      "dataVolumeGB": 10.0,
      "regions": 1,
      "availability": 99.9
    }
  }
}
```

**Response:**
```json
{
  "message": "Response text...",
  "session_id": "session-uuid",
  "suggest_implementation": false,
  "updated_architecture": null
}
```

### POST `/api/chat/implement`

Implement architecture changes based on a request.

**Request Body:**
```json
{
  "session_id": "session-id",
  "architecture_json": {...},
  "implementation_request": "Add a login system with Supabase"
}
```

**Response:**
```json
{
  "updated_architecture": {...},
  "explanation": "Explanation of changes..."
}
```

### GET `/health`

Health check endpoint.

**Response:**
```json
{
  "status": "healthy"
}
```

## Component Library

The application includes a comprehensive component library organized by category:

### Databases
- PostgreSQL, MySQL, MongoDB, Redis, DynamoDB, Firestore, Cassandra, Neo4j

### APIs & Backend
- REST API, GraphQL API, WebSocket Server, gRPC Service, Serverless Functions

### Authentication
- Auth0, Supabase Auth, Firebase Auth, Custom JWT, OAuth2 Server

### Caching
- Redis Cache, Memcached, CDN, Browser Cache

### Message Queues
- RabbitMQ, Apache Kafka, AWS SQS, Google Pub/Sub

### Storage
- S3, Google Cloud Storage, Azure Blob Storage, Cloudinary

### Monitoring
- Datadog, New Relic, Sentry, CloudWatch

### Frontend
- React App, Vue App, Angular App, Next.js App, Mobile App

### Load Balancing
- NGINX, AWS ALB, Google Cloud Load Balancer

### Search
- Elasticsearch, Algolia, Typesense

Components are defined in:
- Backend: `app/data/components_data.py`
- Frontend: `lib/components-data.ts`

These files should stay in sync.

## Development

### Backend Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app entry point
│   ├── config.py               # Configuration settings
│   ├── models/
│   │   ├── __init__.py
│   │   ├── chat.py            # Chat request/response models
│   │   └── architecture.py    # Architecture JSON models
│   ├── services/
│   │   ├── __init__.py
│   │   ├── gemini_service.py  # Gemini API integration
│   │   ├── rag_service.py     # RAG pipeline
│   │   ├── architecture_service.py  # Architecture manipulation
│   │   ├── cost_calculator.py # Cost calculation logic
│   │   └── connection_validator.py  # Connection validation
│   ├── routers/
│   │   ├── __init__.py
│   │   └── chat.py            # Chat API endpoints
│   └── data/
│       └── components_data.py  # Component library data
├── faiss_index/               # FAISS vector store (generated)
├── requirements.txt
├── .env.example
└── README.md
```

### Frontend Project Structure

```
frontend/
├── app/
│   ├── page.tsx               # Home page
│   ├── layout.tsx             # Root layout
│   └── sandbox/
│       └── new/
│           └── page.tsx       # Main sandbox page
├── components/
│   ├── Logo.tsx               # Logo component
│   ├── Chatbot.tsx            # AI chatbot interface
│   ├── canvas/
│   │   ├── ArchitectureCanvas.tsx  # Main canvas
│   │   ├── ComponentNode.tsx       # Node component
│   │   └── CustomEdge.tsx          # Edge component
│   └── sidebar/
│       ├── ComponentLibrary.tsx    # Component palette
│       └── ScopeConfig.tsx         # Scope configuration
├── lib/
│   ├── components-data.ts     # Component library data
│   ├── store.ts               # Zustand state management
│   ├── cost-calculator.ts     # Cost calculation
│   └── api.ts                 # API client
├── public/                    # Static assets
├── package.json
└── tsconfig.json
```

### Adding New Components

1. Add component definition to `backend/app/data/components_data.py`
2. Add matching definition to `frontend/lib/components-data.ts`
3. Update cost calculation logic if needed
4. Add connection rules in connection validator

### Extending the Knowledge Base

The RAG knowledge base is built in `backend/app/services/rag_service.py` in the `_create_knowledge_documents()` method. Add new documents to improve the chatbot's knowledge.

### Testing

**Backend:**
```bash
# Run the server
python -m app.main

# Test endpoints using curl or the interactive docs at /docs
curl http://localhost:8000/health
```

**Frontend:**
```bash
# Run development server
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Lint
npm run lint
```

## Configuration

### Backend Environment Variables

Configure in `.env`:

- `GEMINI_API_KEY`: Required. Your Google Gemini API key
- `HOST`: Server host (default: 0.0.0.0)
- `PORT`: Server port (default: 8000)
- `DEBUG`: Enable debug mode (default: false)
- `CORS_ORIGINS`: Comma-separated list of allowed origins
- `GEMINI_MODEL`: Gemini model to use (default: gemini-2.5-flash)
- `RAG_TOP_K`: Number of documents to retrieve for RAG (default: 3)

### Frontend Configuration

Edit `lib/api.ts` to change the backend API URL:

```typescript
const API_BASE_URL = 'http://localhost:8000';
```

## Deployment

### Backend Deployment

**Production mode:**
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Consider using:
- Gunicorn with Uvicorn workers for production
- Docker for containerization
- Environment-specific configuration files

### Frontend Deployment

**Build for production:**
```bash
npm run build
```

Deploy to:
- Vercel (recommended for Next.js)
- Netlify
- AWS Amplify
- Custom server with Node.js

## Notes

### Backend

- Session storage is currently in-memory. For production, consider using Redis.
- The RAG pipeline uses FAISS for vector storage (in-memory). For production, consider persistent storage.
- Architecture implementation parsing is simplified. Enhance with better NLP for production use.

### Frontend

- State management uses Zustand for simplicity
- Canvas state is managed separately from global state
- Cost calculations are performed client-side for real-time updates
- Architecture JSON is sent to backend for AI analysis

## Technologies Used

### Frontend
- Next.js 16
- React 19
- TypeScript 5
- Tailwind CSS 4
- Zustand (state management)
- React Flow (canvas)
- Framer Motion (animations)
- Lucide React (icons)

### Backend
- Python 3.10+
- FastAPI
- Google Gemini API
- LangChain
- FAISS (vector store)
- Pydantic v2
- MongoDB (Motor)
- Uvicorn

## License

Part of the Quota project.
