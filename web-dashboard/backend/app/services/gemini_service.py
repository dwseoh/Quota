"""Gemini API service for chat completions."""

from google import genai
from google.genai import types
from typing import Optional
from app.config import settings
from app.data.components_data import COMPONENT_LIBRARY


class GeminiService:
    """Service for interacting with Google Gemini API."""
    
    def __init__(self):
        """Initialize Gemini client."""
        if not settings.gemini_api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        
        self.client = genai.Client(api_key=settings.gemini_api_key)
        self.model_id = settings.gemini_model
    
    def generate_response(
        self,
        user_message: str,
        context: Optional[str] = None,
        conversation_history: Optional[list[dict[str, str]]] = None,
        chat_width: Optional[int] = None,
        scope: Optional[dict] = None
    ) -> str:
        """
        Generate a response using Gemini.
        
        Args:
            user_message: The user's message
            context: RAG context from knowledge base
            conversation_history: Previous conversation messages
            chat_width: Width of chat panel in pixels
            scope: Architecture scope (users, traffic, etc.)
        """
        # Build the prompt with system context
        system_prompt = self._build_system_prompt(context, chat_width, scope)
        
        # Build conversation history
        contents = []
        if conversation_history:
            for msg in conversation_history:
                role = "user" if msg.get("role") == "user" else "model"
                contents.append(types.Content(
                    role=role,
                    parts=[types.Part.from_text(text=msg.get("content", ""))]
                ))
            
        try:
            chat = self.client.chats.create(
                model=self.model_id,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt
                ),
                history=contents
            )
            
            response = chat.send_message(user_message)
            return response.text
        except Exception as e:
            # Fallback for error handling or debug
            print(f"Gemini API Error: {str(e)}")
            raise e
    
    def _build_system_prompt(
        self, 
        context: Optional[str] = None,
        chat_width: Optional[int] = None,
        scope: Optional[dict] = None
    ) -> str:
        """Build the system prompt with context, component library, and constraints."""
        
        # Build component library listing
        component_library_text = self._build_component_library_text()
        
        # Build scope context
        scope_text = ""
        if scope:
            scope_text = f"""
Current Architecture Scope:
- Users: {scope.get('users', 'not specified')}
- Traffic Level: {scope.get('trafficLevel', 'not specified')}/5
- Data Volume: {scope.get('dataVolumeGB', 'not specified')} GB
- Regions: {scope.get('regions', 1)}
- Availability: {scope.get('availability', 99.9)}%
"""
        
        # Build chat width context
        width_text = ""
        if chat_width:
            width_text = f"""
UI Constraints:
- Chat panel width: {chat_width}px
- For complex diagrams or visualizations, suggest implementing on the canvas instead of text
- Keep code blocks and text responses concise to fit the chat width
- Avoid ASCII diagrams that are wider than {chat_width - 100}px
"""
        
        base_prompt = f"""You are an expert architecture advisor.

**Role & Persona:**
- Target Audience: Senior/Staff Software Engineers at top tech companies.
- Tone: Extremely concise, direct, technical, "no-nonsense".
- Format: Bullet points preferred. Short paragraphs (max 2 sentences).

**Responsibilities:**
1. Design architectures using ONLY the provided Component Library.
2. Propose cost-effective, scalable solutions based on Scope.
3. Suggest improvements to existing designs.

**IMPORTANT RULES:**
- Ask for scope details if not provided and clarify the user's intentions FIRST
- **NO FLUFF**: Do not use phrases like "Here is a suggestion", "I hope this helps", "Great question". Go straight to the answer.
- When you describe an architecture, ALWAYS ask: "Would you like me to visualize this on the canvas?"
- **Visuals**: If a diagram is helpful, listing component IDs is enough. The system will auto-render.
- **NO DIAGRAM CODE**: Do not output Mermaid, Graphviz, or other diagram code in the chat. The user cannot see it properly.
- **Canvas Trigger**: To visualize, specific component IDs in your response using single backticks (e.g., `react` `fastapi` `redis`).
- **Scope Awareness**: 
    - <1k users: Low cost/Free tier.
    - 1k-10k users: Managed services.
    - >10k users: Enterprise/Auto-scaling.



**Scope Analysis Format:**
- When the user defines or updates scope, you MUST output a JSON block exactly like this:
  ```json
  {{
    "scope_analysis": {{
      "users": [Number],
      "trafficLevel": [1-5],
      "dataVolumeGB": [Number],
      "regions": [Number],
      "availability": [Number 0-100],
      "estimatedCost": [Number]
    }}
  }}
  ```
- If details are missing, estimate them based on context.
- **IMPORTANT**: Provide a brief text summary of these values BEFORE the JSON block, so the user sees the confirmation. The JSON block itself will be hidden from the user.

{component_library_text}

{scope_text}

{width_text}
"""
        
        if context:
            base_prompt += f"\n\nRelevant Knowledge Base Context:\n{context}"
        
        return base_prompt
    
    def _build_component_library_text(self) -> str:
        """Build a text representation of the component library."""
        lines = ["Available Component Library:"]
        
        for category in COMPONENT_LIBRARY:
            lines.append(f"\n{category.name} ({category.id}):")
            for comp in category.components:
                cost_text = f"${comp.baseCost}/mo" if comp.baseCost and comp.baseCost > 0 else "Free"
                lines.append(f"  - {comp.name} (ID: {comp.id}) - {cost_text}")
        
        return "\n".join(lines)
    
    def extract_component_ids_from_text(self, text: str) -> list[str]:
        """
        Extract component IDs mentioned in text.
        
        This is a simple keyword-based extraction. In production, you might use
        more sophisticated NLP or have Gemini return structured data.
        """
        text_lower = text.lower()
        mentioned_ids = []
        
        for category in COMPONENT_LIBRARY:
            for comp in category.components:
                # Check if component name or ID is mentioned
                if comp.id in text_lower or comp.name.lower() in text_lower:
                    mentioned_ids.append(comp.id)
        
        return list(set(mentioned_ids))  # Remove duplicates

