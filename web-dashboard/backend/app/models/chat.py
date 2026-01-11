"""Pydantic models for chat API requests and responses."""

from typing import Optional, Literal
from pydantic import BaseModel, Field
from app.models.architecture import ArchitectureJson


class ChatRequest(BaseModel):
    """Chat request model."""
    message: str
    session_id: Optional[str] = None
    architecture_json: ArchitectureJson
    chat_width: Optional[int] = Field(
        default=600,  # Increased default width
        description="Width of the chat panel in pixels for UI-aware responses"
    )


class ChatResponse(BaseModel):
    """Chat response model."""
    message: str
    session_id: str
    suggest_implementation: bool = False
    updated_architecture: Optional[ArchitectureJson] = None
    canvas_action: Optional[Literal["update", "clear", "none"]] = Field(
        default="none",
        description="Action for the frontend canvas: 'update' to apply architecture, 'clear' to reset, 'none' for no action"
    )
    updated_scope: Optional[dict] = Field(
        default=None,
        description="Updated scope parameters (users, trafficLevel, dataVolumeGB, regions, availability) to sync with frontend"
    )


class ImplementRequest(BaseModel):
    """Architecture implementation request model."""
    session_id: str
    architecture_json: ArchitectureJson
    implementation_request: str


class ImplementResponse(BaseModel):
    """Architecture implementation response model."""
    updated_architecture: ArchitectureJson
    explanation: str
