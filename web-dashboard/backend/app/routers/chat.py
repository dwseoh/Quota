"""Chat API router."""

import uuid
from typing import Dict, List, Optional
from fastapi import APIRouter, HTTPException
from app.models.chat import ChatRequest, ChatResponse, ImplementRequest, ImplementResponse
from app.services.gemini_service import GeminiService
from app.services.rag_service import RAGService
from app.services.architecture_service import ArchitectureService
from app.config import settings

router = APIRouter(prefix="/chat", tags=["chat"])

# In-memory session storage (can be migrated to Redis later)
sessions: Dict[str, List[Dict[str, str]]] = {}

# Initialize services (singleton pattern)
gemini_service: GeminiService | None = None
rag_service: RAGService | None = None
architecture_service: ArchitectureService | None = None


def get_gemini_service() -> GeminiService:
    """Get or create Gemini service instance."""
    global gemini_service
    if gemini_service is None:
        gemini_service = GeminiService()
    return gemini_service


def get_rag_service() -> RAGService:
    """Get or create RAG service instance."""
    global rag_service
    if rag_service is None:
        rag_service = RAGService()
    return rag_service


def get_architecture_service() -> ArchitectureService:
    """Get or create architecture service instance."""
    global architecture_service
    if architecture_service is None:
        architecture_service = ArchitectureService()
    return architecture_service


def get_or_create_session(session_id: Optional[str]) -> str:
    """Get existing session or create a new one."""
    if session_id and session_id in sessions:
        return session_id
    new_session_id = str(uuid.uuid4())
    sessions[new_session_id] = []
    return new_session_id


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Handle chat messages with RAG context.
    
    This endpoint processes user messages, retrieves relevant context,
    and generates responses using Gemini. It can also suggest architecture
    implementations if the user requests them.
    """
    try:
        # Get or create session
        session_id = get_or_create_session(request.session_id)
        session_history = sessions[session_id]
        
        # Get services
        rag = get_rag_service()
        gemini = get_gemini_service()
        arch_service = get_architecture_service()
        
        # Retrieve relevant context from RAG (no API call - just vector search)
        context = rag.retrieve_context(request.message)
        
        # Get conversation history
        conversation_history = session_history[-10:]  # Last 10 messages
        
        # Generate response - SINGLE Gemini API call per request
        response_text = gemini.generate_response(
            user_message=request.message,
            context=context,
            conversation_history=conversation_history if conversation_history else None
        )
        
        # Add messages to session history
        session_history.append({"role": "user", "content": request.message})
        session_history.append({"role": "assistant", "content": response_text})
        
        # Check if user is requesting implementation
        # This is a simple heuristic - could be improved with better intent detection
        suggest_implementation = any(
            keyword in request.message.lower()
            for keyword in ["implement", "create", "build", "design", "set up", "add"]
        )
        
        # If implementation is suggested, generate architecture
        updated_architecture = None
        if suggest_implementation:
            # Try to extract component mentions or generate a basic architecture
            # This is simplified - in production, use better NLP to extract intent
            updated_architecture = request.architecture_json
        
        response = ChatResponse(
            message=response_text,
            session_id=session_id,
            suggest_implementation=suggest_implementation,
            updated_architecture=updated_architecture
        )
        
        return response
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing chat: {str(e)}")


@router.post("/implement", response_model=ImplementResponse)
async def implement_architecture(request: ImplementRequest):
    """
    Implement architecture changes based on user request.
    
    This endpoint takes a natural language request and modifies the
    architecture JSON accordingly.
    """
    try:
        session_id = get_or_create_session(request.session_id)
        
        # Get services
        rag = get_rag_service()
        gemini = get_gemini_service()
        arch_service = get_architecture_service()
        
        # Retrieve context about components and architectures (no API call - just vector search)
        context = rag.retrieve_context(request.implementation_request)
        
        # For now, return the architecture as-is
        # In production, this would use Gemini to parse the request and modify the architecture
        # This is a placeholder implementation (no additional API calls)
        
        response = ImplementResponse(
            updated_architecture=request.architecture_json,
            explanation="Architecture implementation feature is being enhanced. "
                       "Currently returns the architecture as provided."
        )
        
        return response
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error implementing architecture: {str(e)}")


@router.get("/sessions/{session_id}")
async def get_session(session_id: str):
    """Get conversation history for a session."""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"session_id": session_id, "messages": sessions[session_id]}


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    """Delete a session."""
    if session_id in sessions:
        del sessions[session_id]
    return {"message": "Session deleted"}
