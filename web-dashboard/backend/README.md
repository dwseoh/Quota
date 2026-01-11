# Architecture Sandbox Chatbot Backend

Backend service for the Architecture Sandbox web dashboard's RAG chatbot. Provides intelligent architecture design assistance using Google Gemini API and RAG (Retrieval-Augmented Generation).

## Features

- **RAG-powered Chatbot**: Uses LangChain and FAISS for context-aware responses
- **Gemini Integration**: Leverages Google Gemini for natural language understanding
- **Architecture Manipulation**: Generate and modify architecture designs
- **Cost Analysis**: Calculate and optimize architecture costs
- **Component Library**: Access to all available architecture components
- **Session Management**: Maintain conversation context across requests

## Setup

### Prerequisites

- Python 3.10 or higher
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Installation

1. **Clone the repository** (if not already done)

2. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

3. **Create a virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

4. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

5. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Gemini API key (or use the default in config.py):
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```
   
   **Note**: The API key is already configured in `config.py` by default. 
   You can override it with an environment variable if needed.

### Running the Server

**Development mode** (with auto-reload):
```bash
python -m app.main
```

Or using uvicorn directly:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Production mode**:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The API will be available at:
- API: http://localhost:8000
- Documentation: http://localhost:8000/docs
- Alternative docs: http://localhost:8000/redoc

## API Endpoints

### POST `/api/chat`

Send a chat message and get a response.

**Request Body**:
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

**Response**:
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

**Request Body**:
```json
{
  "session_id": "session-id",
  "architecture_json": {...},
  "implementation_request": "Add a login system with Supabase"
}
```

**Response**:
```json
{
  "updated_architecture": {...},
  "explanation": "Explanation of changes..."
}
```

### GET `/health`

Health check endpoint.

## Project Structure

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
├── requirements.txt
├── .env.example
└── README.md
```

## Configuration

Configuration is managed through environment variables (see `.env.example`):

- `GEMINI_API_KEY`: Required. Your Google Gemini API key
- `HOST`: Server host (default: 0.0.0.0)
- `PORT`: Server port (default: 8000)
- `DEBUG`: Enable debug mode (default: false)
- `CORS_ORIGINS`: Comma-separated list of allowed origins
- `GEMINI_MODEL`: Gemini model to use (default: gemini-1.5-flash)
- `RAG_TOP_K`: Number of documents to retrieve for RAG (default: 3)

## Development

### Adding New Components

Components are defined in `app/data/components_data.py`. This file should stay in sync with `frontend/lib/components-data.ts`.

### Extending the Knowledge Base

The RAG knowledge base is built in `app/services/rag_service.py` in the `_create_knowledge_documents()` method. Add new documents to improve the chatbot's knowledge.

### Testing

```bash
# Run the server
python -m app.main

# Test endpoints using curl or the interactive docs at /docs
curl http://localhost:8000/health
```

## Notes

- Session storage is currently in-memory. For production, consider using Redis.
- The RAG pipeline uses FAISS for vector storage (in-memory). For production, consider persistent storage.
- Architecture implementation parsing is a simplified version. Enhance with better NLP for production use.

## License

Part of the Architecture Sandbox project.
