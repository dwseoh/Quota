"""Sandboxes API router for publishing and retrieving shared sandboxes."""

import secrets
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from app.models.sandbox import (
    SandboxCreate,
    SandboxResponse,
    SandboxListItem,
    SandboxFilters
)
from app.db.mongodb import get_sandboxes_collection

router = APIRouter(prefix="/sandboxes", tags=["sandboxes"])


def generate_sandbox_id() -> str:
    """Generate a unique sandbox ID (8 characters)."""
    return secrets.token_urlsafe(6)[:8]


def extract_tech_stack(architecture_json: dict) -> List[str]:
    """Extract unique tech stack from architecture nodes."""
    tech_stack = set()
    for node in architecture_json.get("nodes", []):
        component_name = node.get("data", {}).get("label", "")
        if component_name:
            tech_stack.add(component_name)
    return sorted(list(tech_stack))


@router.post("", response_model=SandboxResponse, status_code=201)
async def publish_sandbox(sandbox: SandboxCreate):
    """
    Publish a new sandbox.
    
    Generates a unique ID and stores the sandbox in MongoDB.
    """
    collection = get_sandboxes_collection()
    
    # Generate unique ID
    sandbox_id = generate_sandbox_id()
    
    # Ensure uniqueness (retry if collision)
    max_retries = 5
    for _ in range(max_retries):
        existing = await collection.find_one({"sandboxId": sandbox_id})
        if not existing:
            break
        sandbox_id = generate_sandbox_id()
    else:
        raise HTTPException(status_code=500, detail="Failed to generate unique ID")
    
    # Extract tech stack and calculate cost
    arch_json = sandbox.architectureJson.model_dump()
    tech_stack = extract_tech_stack(arch_json)
    total_cost = arch_json.get("costEstimate", {}).get("total", 0.0)
    
    # Create document
    now = datetime.utcnow()
    document = {
        "sandboxId": sandbox_id,
        "projectName": sandbox.projectName,
        "description": sandbox.description,
        "architectureJson": arch_json,
        "techStack": tech_stack,
        "totalCost": total_cost,
        "createdAt": now,
        "updatedAt": now,
        "isPublic": True,
        "views": 0
    }
    
    # Insert into MongoDB
    result = await collection.insert_one(document)
    
    if not result.inserted_id:
        raise HTTPException(status_code=500, detail="Failed to publish sandbox")
    
    # Return response
    return SandboxResponse(
        sandboxId=sandbox_id,
        projectName=sandbox.projectName,
        description=sandbox.description,
        architectureJson=sandbox.architectureJson,
        techStack=tech_stack,
        totalCost=total_cost,
        createdAt=now,
        updatedAt=now,
        isPublic=True,
        views=0
    )


@router.get("/{sandbox_id}", response_model=SandboxResponse)
async def get_sandbox(sandbox_id: str):
    """
    Get a sandbox by ID.
    
    Increments view counter on each access.
    """
    collection = get_sandboxes_collection()
    
    # Find sandbox
    sandbox = await collection.find_one({"sandboxId": sandbox_id})
    
    if not sandbox:
        raise HTTPException(status_code=404, detail="Sandbox not found")
    
    # Increment view counter
    await collection.update_one(
        {"sandboxId": sandbox_id},
        {"$inc": {"views": 1}}
    )
    
    # Convert MongoDB document to response model
    from app.models.architecture import ArchitectureJson
    
    return SandboxResponse(
        sandboxId=sandbox["sandboxId"],
        projectName=sandbox["projectName"],
        description=sandbox.get("description"),
        architectureJson=ArchitectureJson(**sandbox["architectureJson"]),
        techStack=sandbox["techStack"],
        totalCost=sandbox["totalCost"],
        createdAt=sandbox["createdAt"],
        updatedAt=sandbox["updatedAt"],
        isPublic=sandbox["isPublic"],
        views=sandbox["views"] + 1  # Return incremented value
    )


@router.get("", response_model=List[SandboxListItem])
async def list_sandboxes(
    search: Optional[str] = Query(None, description="Search by project name"),
    tech_stack: Optional[str] = Query(None, description="Filter by tech (comma-separated)"),
    min_cost: Optional[float] = Query(None, ge=0),
    max_cost: Optional[float] = Query(None, ge=0),
    limit: int = Query(20, ge=1, le=100),
    skip: int = Query(0, ge=0)
):
    """
    List public sandboxes with optional filters.
    
    Supports pagination, search, and filtering by tech stack and cost.
    """
    collection = get_sandboxes_collection()
    
    # Build query
    query = {"isPublic": True}
    
    if search:
        query["projectName"] = {"$regex": search, "$options": "i"}
    
    if tech_stack:
        tech_list = [t.strip() for t in tech_stack.split(",")]
        query["techStack"] = {"$in": tech_list}
    
    if min_cost is not None or max_cost is not None:
        cost_query = {}
        if min_cost is not None:
            cost_query["$gte"] = min_cost
        if max_cost is not None:
            cost_query["$lte"] = max_cost
        query["totalCost"] = cost_query
    
    # Execute query with pagination
    cursor = collection.find(query).sort("createdAt", -1).skip(skip).limit(limit)
    sandboxes = await cursor.to_list(length=limit)
    
    # Convert to response models
    return [
        SandboxListItem(
            sandboxId=s["sandboxId"],
            projectName=s["projectName"],
            description=s.get("description"),
            techStack=s["techStack"],
            totalCost=s["totalCost"],
            createdAt=s["createdAt"],
            views=s["views"]
        )
        for s in sandboxes
    ]
