"""Pydantic models for chat API requests and responses."""

from typing import Optional
from pydantic import BaseModel
from app.models.architecture import ArchitectureJson


class ChatRequest(BaseModel):
    """Chat request model."""
    message: str
    session_id: Optional[str] = None
    architecture_json: ArchitectureJson


class ChatResponse(BaseModel):
    """Chat response model."""
    message: str
    session_id: str
    suggest_implementation: bool = False
    updated_architecture: Optional[ArchitectureJson] = None


class ImplementRequest(BaseModel):
    """Architecture implementation request model."""
    session_id: str
    architecture_json: ArchitectureJson
    implementation_request: str


class ImplementResponse(BaseModel):
    """Architecture implementation response model."""
    updated_architecture: ArchitectureJson
    explanation: str
