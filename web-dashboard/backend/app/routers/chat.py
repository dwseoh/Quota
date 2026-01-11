"""Chat API router."""

import uuid
import re
import json
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


def detect_canvas_intent(message: str) -> bool:
    """
    Detect if the user wants to implement something on the canvas.
    
    Very flexible detection - triggers on:
    1. Any mention of "canvas", "diagram", "visualize"
    2. Architecture-related words + action words (create, design, build, show, etc.)
    """
    message_lower = message.lower()
    
    # Direct canvas/diagram mentions
    direct_triggers = ["canvas", "diagram", "visualize", "visualization", "draw", "sure","show"]
    if any(trigger in message_lower for trigger in direct_triggers):
        return True
    
    # Architecture-related keywords
    architecture_terms = ["architecture", "system", "stack", "setup", "infrastructure"]
    
    # Action words
    action_words = ["create", "design", "build", "make", "show", "implement", "set up", "add", "sure"]
    
    # Check if message contains both architecture term and action word
    has_architecture = any(term in message_lower for term in architecture_terms)
    has_action = any(action in message_lower for action in action_words)
    
    return has_architecture and has_action


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Handle chat messages with RAG context and canvas implementation detection.
    
    This endpoint processes user messages, retrieves relevant context,
    and generates responses using Gemini. It can also detect when users
    want to implement architectures on the canvas and generate the JSON.
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
        
        # Prepare scope for context-aware recommendations
        scope_dict = {
            "users": request.architecture_json.scope.users,
            "trafficLevel": request.architecture_json.scope.trafficLevel,
            "dataVolumeGB": request.architecture_json.scope.dataVolumeGB,
            "regions": request.architecture_json.scope.regions,
            "availability": request.architecture_json.scope.availability,
        }
        
        # Generate response - SINGLE Gemini API call per request
        response_text = gemini.generate_response(
            user_message=request.message,
            context=context,
            conversation_history=conversation_history if conversation_history else None,
            chat_width=request.chat_width,
            scope=scope_dict
        )
        
        # Add messages to session history
        session_history.append({"role": "user", "content": request.message})
        session_history.append({"role": "assistant", "content": response_text})
        
        # Detect canvas implementation intent
        canvas_intent = detect_canvas_intent(request.message)
        canvas_action = "none"
        updated_architecture = None
        
        # Only generate architecture if canvas intent AND components are mentioned
        # This prevents generation when AI is just asking questions
        if canvas_intent:
            # Extract component IDs mentioned in the user message and AI response
            mentioned_components = gemini.extract_component_ids_from_text(
                request.message + " " + response_text
            )
            
            # Only generate if we found actual components (not just intent keywords)
            if mentioned_components and len(mentioned_components) > 0:
                # Generate architecture from mentioned components
                updated_architecture = arch_service.generate_architecture_from_components(
                    component_ids=mentioned_components,
                    scope=request.architecture_json.scope
                )
                canvas_action = "update"
                print(f"🎨 Generating canvas with components: {mentioned_components}")
            else:
                print("💬 Canvas intent detected but no components mentioned - likely clarifying questions")
                canvas_action = "none"
        
        # Extract scope analysis if present
        updated_scope = None
        try:
            # Look for JSON block with scope_analysis
            json_match = re.search(r"```json\s*(\{.*?\})\s*```", response_text, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group(1))
                if "scope_analysis" in data:
                    analysis = data["scope_analysis"]
                    # Map to Scope fields (removing estimatedCost as it's not in Scope model directly, or handling it separately)
                    # The Scope model has: users, trafficLevel, dataVolumeGB, regions, availability
                    updated_scope = {
                        "users": analysis.get("users"),
                        "trafficLevel": analysis.get("trafficLevel"),
                        "dataVolumeGB": analysis.get("dataVolumeGB"),
                        "regions": analysis.get("regions"),
                        "availability": analysis.get("availability")
                    }
                    # Filter out None values
                    updated_scope = {k: v for k, v in updated_scope.items() if v is not None}
                    print(f"📊 Detected scope update: {updated_scope}")
                    
                    # Remove the JSON block from the visible response
                    response_text = response_text.replace(json_match.group(0), "").strip()
        except Exception as e:
            print(f"⚠️ Failed to parse scope JSON: {str(e)}")
        
        
        # Check for general implementation keywords (for backward compatibility)
        suggest_implementation = any(
            keyword in request.message.lower()
            for keyword in ["implement", "create", "build", "design", "set up", "add"]
        )
        
        response = ChatResponse(
            message=response_text,
            session_id=session_id,
            suggest_implementation=suggest_implementation,
            updated_architecture=updated_architecture,
            canvas_action=canvas_action,
            updated_scope=updated_scope
        )
        
        return response
    
    except Exception as e:
        import traceback
        traceback.print_exc()
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

