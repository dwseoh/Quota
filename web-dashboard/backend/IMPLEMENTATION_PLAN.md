# Backend RAG Chatbot Implementation Plan

**Last Updated**: Based on branch `logo` (commit 0926dc1, d58de28)  
**Status**: Planning phase - awaiting clarifications before implementation

## Key Changes from Recent Frontend Updates

- **JSON Format**: Now includes `costEstimate` field: `{nodes, edges, scope, costEstimate: {total, breakdown}, timestamp}`
- **Category Icons**: Changed from emojis to text identifiers ("server", "database", "palette", etc.)
- **Component Icons**: Remain as URLs from simple-icons CDN

## Project Overview

This document outlines the implementation plan for a backend service that provides RAG (Retrieval-Augmented Generation) chatbot functionality for the web dashboard's architecture sandbox. The chatbot will help users design architectures, optimize costs, and get suggestions using Google's Gemini API and the Moorsech RAG pipeline.

## Requirements Summary

### Core Functionalities

1. **Architecture Design Assistance**
   - Guide users in designing system architectures
   - Suggest components from available sidebar options (`components-data.ts`)
   - Propose complete architecture designs based on user requirements
   - Update user's JSON architecture file with suggested designs
   - Maintain conversation context for follow-up questions

2. **Cost Optimization**
   - Analyze current architecture costs
   - Suggest cost-effective alternatives
   - Consider user preferences (budget constraints, performance requirements, uptime needs)
   - Provide contextual suggestions based on current architecture state

3. **General Architecture Ideation**
   - Answer questions about design choices
   - Provide best practices and recommendations
   - Suggest improvements based on current architecture
   - Help users understand trade-offs

### Technical Requirements

1. **Backend Framework**: FastAPI (Python) - modern, async, auto-documentation
2. **LLM Integration**: Google Gemini API
3. **RAG Pipeline**: Moorsech RAG pipeline
4. **API Design**: RESTful endpoints for chat interactions
5. **Data Synchronization**: Maintain copy of `components-data.ts` in backend
6. **JSON Processing**: Handle architecture JSON format: `{nodes, edges, scope, costEstimate, timestamp}`
   - Note: Recent changes (commit 0926dc1) added `costEstimate` field to saved JSON format

## Architecture Design

### Backend Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app entry point
│   ├── config.py               # Configuration & environment variables
│   ├── models/
│   │   ├── __init__.py
│   │   ├── chat.py            # Chat request/response models
│   │   └── architecture.py    # Architecture JSON models
│   ├── services/
│   │   ├── __init__.py
│   │   ├── gemini_service.py  # Gemini API integration
│   │   ├── rag_service.py     # Moorsech RAG pipeline integration
│   │   └── architecture_service.py  # Architecture manipulation logic
│   ├── routers/
│   │   ├── __init__.py
│   │   └── chat.py            # Chat API endpoints
│   └── data/
│       └── components_data.py  # Copy of frontend components-data.ts
├── requirements.txt
├── .env.example
└── README.md
```

### API Endpoints

1. **POST /api/chat**
   - Request Body:
     ```json
     {
       "message": "string",
       "session_id": "string (optional)",
       "architecture_json": {
         "nodes": [...],
         "edges": [...],
         "scope": {...},
         "costEstimate": {
           "total": number,
           "breakdown": [...]
         }
       }
     }
     ```
   - Note: `costEstimate` field is optional in requests but should be included if available
   - Response:
     ```json
     {
       "message": "string",
       "session_id": "string",
       "suggest_implementation": boolean,
       "updated_architecture": {...} (optional, if implementation suggested)
     }
     ```

2. **POST /api/chat/implement**
   - Request Body:
     ```json
     {
       "session_id": "string",
       "architecture_json": {...},
       "implementation_request": "string"
     }
     ```
   - Response:
     ```json
     {
       "updated_architecture": {...},
       "explanation": "string"
     }
     ```

### Data Flow

1. **Chat Flow**:
   - User sends message + current architecture JSON
   - Backend processes through RAG pipeline for context
   - Gemini generates response with conversation context
   - If user requests implementation, architecture JSON is updated
   - Updated JSON is returned to frontend

2. **RAG Pipeline Flow**:
   - User query → Vector search in knowledge base
   - Retrieve relevant context about components, architectures, best practices
   - Combine with conversation history
   - Send to Gemini for response generation

## Implementation Steps

### Phase 1: Basic Setup (Foundation)
1. Set up FastAPI project structure
2. Create requirements.txt with dependencies
3. Set up configuration management (environment variables)
4. Copy components-data.ts to Python format
5. Create basic API structure with health check endpoint

### Phase 2: Gemini Integration
1. Set up Google Gemini API client
2. Create service for chat completions
3. Implement conversation context management
4. Test basic chat functionality

### Phase 3: RAG Pipeline Integration
1. Set up Moorsech RAG pipeline (clarify exact library/implementation)
2. Create knowledge base with:
   - Component descriptions and use cases
   - Architecture best practices
   - Cost optimization guidelines
   - Common patterns and recommendations
3. Implement vector storage and retrieval
4. Integrate RAG with Gemini service

### Phase 4: Architecture Manipulation
1. Create service to parse/validate architecture JSON
   - Handle both old format (without costEstimate) and new format (with costEstimate)
   - Validate node/edge structure matches frontend expectations
2. Implement logic to add/remove/modify nodes and edges
3. Implement connection validation (mirror frontend logic)
4. Create architecture update functions
   - When returning updated architecture, optionally include costEstimate if calculated

### Phase 5: Smart Architecture Generation
1. Implement logic to generate architecture from user requirements
2. Map user requests to component IDs from components-data
3. Create appropriate node connections based on connection rules
4. Generate position coordinates for nodes

### Phase 6: Cost Analysis Integration
1. Port cost calculation logic from frontend
2. Integrate cost analysis into responses
3. Implement cost comparison for suggestions

### Phase 7: Frontend Integration
1. Update frontend Chatbot component to call backend API
2. Handle session management
3. Implement architecture update functionality
4. Error handling and loading states

### Phase 8: Testing & Refinement
1. Unit tests for services
2. Integration tests for API endpoints
3. End-to-end testing with frontend
4. Refine prompts and RAG knowledge base

## Key Components Details

### Components Data Synchronization
- Maintain Python version of `components-data.ts`
- Ensure consistency with frontend
- Use for validation and suggestions
- **Important**: Category icons are now text identifiers (e.g., "server", "database", "palette") not emojis
- Component icons remain as URLs (from simple-icons CDN)
- Backend doesn't need to handle icon rendering, only store the icon string values

### Connection Validation
- Port validation logic from `frontend/lib/utils.ts`
- Ensure generated architectures follow connection rules

### Cost Calculation
- Port cost calculation logic from `frontend/lib/cost-calculator.ts`
- Use for cost analysis and optimization suggestions

### Session Management
- Use session IDs to maintain conversation context
- Store conversation history per session
- Consider in-memory storage for MVP (can migrate to Redis later)

## Dependencies (Expected)

```txt
fastapi>=0.104.0
uvicorn[standard]>=0.24.0
google-generativeai>=0.3.0
pydantic>=2.0.0
python-dotenv>=1.0.0
# Moorsech RAG pipeline dependencies (to be confirmed)
# Vector database dependencies (FAISS, Chroma, or similar)
```

## Clarification Questions

1. **Moorsech RAG Pipeline**: 
   - Is this a specific library/framework, or a custom implementation?
   - If it's a typo, did you mean LangChain, LlamaIndex, or another RAG framework?
   - Should I implement a custom RAG pipeline if Moorsech doesn't exist?

2. **Vector Database**:
   - Preference for vector storage? (FAISS, Chroma, Pinecone, etc.)
   - Should we use in-memory for MVP or set up persistent storage?

3. **Knowledge Base Content**:
   - Should I create the initial knowledge base with architecture best practices?
   - Any specific documentation or sources to include?

4. **Session Management**:
   - In-memory storage acceptable for MVP?
   - Expected session duration/lifetime?

5. **Architecture Generation**:
   - How should node positions be determined? (random, grid layout, etc.)
   - Should we preserve existing node positions when updating?

6. **API Authentication**:
   - Any authentication needed, or is it fine to leave open for now?

7. **Error Handling**:
   - How should we handle Gemini API failures?
   - Retry logic needed?

8. **Deployment**:
   - Expected deployment target? (Local dev, Docker, cloud?)
   - Port preferences?

## Recent Changes Analysis (Branch: logo)

Based on git history analysis (commits 0926dc1, d58de28), the following changes were made to the frontend:

### JSON Format Updates (Commit 0926dc1)
- **store.ts**: `saveToFile()` now includes `costEstimate` in the saved JSON
- Updated format: `{nodes, edges, scope, costEstimate: {total, breakdown}, timestamp}`
- Backend must handle this updated format when receiving/returning architecture JSON

### Component Data Updates (Commit 0926dc1)
- **components-data.ts**: Category icons changed from emojis (🎨, 💾, etc.) to text identifiers
  - Examples: "palette", "database", "server", "cloud", "brain", "lock", "zap", "mail", "package", "refresh-cw", "activity", "search"
- Component-level icons remain as URLs (from simple-icons CDN)
- Backend should replicate this structure exactly

### UI Improvements (Commit 0926dc1)
- **CustomNode.tsx**: Enhanced node interactions (delete button, hover states, better handles)
- These changes don't affect backend API but indicate active frontend development
- Backend-generated nodes should follow the same structure

### Implications for Backend
1. When processing architecture JSON, handle `costEstimate` field (optional but may be present)
2. When generating architecture JSON, can optionally include `costEstimate` for consistency
3. Component data structure must match frontend exactly (text category icons, URL component icons)
4. JSON schema validation should account for both old and new formats for backward compatibility

## Next Steps

1. Wait for clarification on Moorsech RAG pipeline
2. Confirm dependencies and preferences
3. Begin Phase 1 implementation
4. Iterate based on feedback
