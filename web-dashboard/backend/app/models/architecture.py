"""Pydantic models for architecture data structures."""

from typing import Optional, Any
from pydantic import BaseModel, Field


class NodeData(BaseModel):
    """Node data structure."""
    label: str
    componentId: str
    category: str
    icon: str
    color: str
    config: Optional[dict[str, Any]] = None


class ArchitectureNode(BaseModel):
    """Architecture node model."""
    id: str
    type: Optional[str] = "custom"
    position: dict[str, float] = Field(default_factory=lambda: {"x": 0, "y": 0})
    data: NodeData


class Edge(BaseModel):
    """Edge connection model."""
    id: Optional[str] = None
    source: str
    target: str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None
    type: Optional[str] = "custom"


class Scope(BaseModel):
    """Scope configuration model."""
    users: int = 1000
    trafficLevel: int = Field(ge=1, le=5, default=2)
    dataVolumeGB: float = 10.0
    regions: int = 1
    availability: float = 99.9


class CostBreakdown(BaseModel):
    """Cost breakdown item."""
    category: str
    component: str
    componentId: str
    baseCost: float
    scaledCost: float


class CostEstimate(BaseModel):
    """Cost estimate model."""
    total: float
    breakdown: list[CostBreakdown]


class ArchitectureJson(BaseModel):
    """Complete architecture JSON structure."""
    nodes: list[ArchitectureNode] = Field(default_factory=list)
    edges: list[Edge] = Field(default_factory=list)
    scope: Scope = Field(default_factory=Scope)
    costEstimate: Optional[CostEstimate] = None
    timestamp: Optional[int] = None
