"""Pydantic models for sandbox operations."""

from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime
from app.models.architecture import ArchitectureJson


class SandboxCreate(BaseModel):
    """Request model for publishing a new sandbox."""
    projectName: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    architectureJson: ArchitectureJson


class SandboxResponse(BaseModel):
    """Full sandbox response model."""
    sandboxId: str
    projectName: str
    description: Optional[str] = None
    architectureJson: ArchitectureJson
    techStack: List[str]
    totalCost: float
    createdAt: datetime
    updatedAt: datetime
    isPublic: bool
    views: int
    
    class Config:
        from_attributes = True


class SandboxListItem(BaseModel):
    """Lightweight model for explore page grid."""
    sandboxId: str
    projectName: str
    description: Optional[str] = None
    techStack: List[str]
    totalCost: float
    createdAt: datetime
    views: int
    
    class Config:
        from_attributes = True


class SandboxFilters(BaseModel):
    """Query filters for listing sandboxes."""
    search: Optional[str] = None
    techStack: Optional[List[str]] = None
    minCost: Optional[float] = None
    maxCost: Optional[float] = None
    limit: int = Field(default=20, ge=1, le=100)
    skip: int = Field(default=0, ge=0)
