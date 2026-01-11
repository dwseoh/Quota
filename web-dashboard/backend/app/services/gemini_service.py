"""Gemini API service for chat completions."""

import google.generativeai as genai
from typing import Optional
from app.config import settings


class GeminiService:
    """Service for interacting with Google Gemini API."""
    
    def __init__(self):
        """Initialize Gemini client."""
        if not settings.gemini_api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        
        genai.configure(api_key=settings.gemini_api_key)
        self.model = genai.GenerativeModel(settings.gemini_model)
    
    def generate_response(
        self,
        user_message: str,
        context: Optional[str] = None,
        conversation_history: Optional[list[dict[str, str]]] = None
    ) -> str:
        """
        Generate a response using Gemini.
        
        IMPORTANT: This method makes exactly ONE API call to Gemini per invocation.
        All context and history are included in a single request to minimize token usage.
        
        Args:
            user_message: The user's message
            context: Additional context (e.g., from RAG)
            conversation_history: Previous conversation messages
            
        Returns:
            Generated response text
        """
        # Build the prompt with system context
        system_prompt = self._build_system_prompt(context)
        
        # Build conversation history
        if conversation_history:
            # Convert to Gemini format (alternating user/assistant)
            chat_history = []
            for msg in conversation_history:
                role = "user" if msg.get("role") == "user" else "model"
                chat_history.append({"role": role, "parts": [msg.get("content", "")]})
            
            # Create chat session with history
            chat = self.model.start_chat(history=chat_history)
            response = chat.send_message(f"{system_prompt}\n\n{user_message}")
        else:
            # Single request without history
            full_prompt = f"{system_prompt}\n\nUser: {user_message}\nAssistant:"
            response = self.model.generate_content(full_prompt)
        
        return response.text
    
    def _build_system_prompt(self, context: Optional[str] = None) -> str:
        """Build the system prompt with context."""
        base_prompt = """You are an expert architecture advisor for software systems. You help users design, optimize, and understand software architectures.

Your responsibilities:
1. Help users design architectures using available components
2. Suggest cost-effective alternatives
3. Provide best practices and recommendations
4. Analyze current architectures and suggest improvements
5. When users request implementation, you can propose complete architecture designs

Available components are from the component library. Always use only components that exist in the library.
When suggesting architectures, consider cost, performance, scalability, and maintainability.
Be conversational, helpful, and provide clear explanations."""
        
        if context:
            base_prompt += f"\n\nRelevant Context:\n{context}"
        
        return base_prompt
