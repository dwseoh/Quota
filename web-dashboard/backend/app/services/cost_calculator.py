"""Cost calculation logic - synced with frontend/lib/cost-calculator.ts"""

import math
from typing import TypedDict, Optional
from app.data.components_data import get_component_by_id


class Scope(TypedDict):
    users: int
    trafficLevel: int  # 1-5
    dataVolumeGB: float
    regions: int
    availability: float  # percentage


class CostBreakdown(TypedDict):
    category: str
    component: str
    componentId: str
    baseCost: float
    scaledCost: float


class CostEstimate(TypedDict):
    total: float
    breakdown: list[CostBreakdown]


class ArchitectureNodeData(TypedDict):
    label: str
    componentId: str
    category: str
    icon: str
    color: str


class ArchitectureNode(TypedDict):
    id: str
    data: ArchitectureNodeData


def calculate_costs(nodes: list[ArchitectureNode], scope: Scope) -> CostEstimate:
    """
    Calculate costs for an architecture based on nodes and scope.
    
    Args:
        nodes: List of architecture nodes
        scope: Scope configuration (users, traffic, etc.)
        
    Returns:
        Cost estimate with total and breakdown
    """
    breakdown: list[CostBreakdown] = []
    
    for node in nodes:
        component = get_component_by_id(node["data"]["componentId"])
        if not component:
            continue
        
        base_cost = component.baseCost or 0.0
        category = node["data"]["category"]
        
        # Calculate scaled cost based on scope
        scaled_cost = base_cost
        
        # Apply user multiplier (rough estimate)
        user_multiplier = math.log10(scope["users"] + 1) / 2
        
        # Apply traffic multiplier
        traffic_multiplier = scope["trafficLevel"] / 3
        
        # Apply data volume multiplier (per GB)
        data_multiplier = scope["dataVolumeGB"] / 100
        
        # Apply region multiplier
        region_multiplier = scope["regions"] * 0.3 if scope["regions"] > 1 else 1
        
        # Different categories scale differently
        if category == "hosting":
            scaled_cost = base_cost + (base_cost * user_multiplier) + (base_cost * traffic_multiplier)
        elif category == "database":
            scaled_cost = base_cost + (base_cost * user_multiplier) + (data_multiplier * 10)
        elif category == "ml":
            scaled_cost = base_cost + (base_cost * traffic_multiplier * 2)
        elif category in ["cache", "queue"]:
            scaled_cost = base_cost + (base_cost * traffic_multiplier)
        elif category == "storage":
            scaled_cost = base_cost + (data_multiplier * 5)
        elif category in ["monitoring", "search"]:
            scaled_cost = base_cost + (base_cost * user_multiplier * 0.5)
        else:
            scaled_cost = base_cost
        
        # Apply region multiplier to all
        scaled_cost *= region_multiplier
        
        # Apply availability multiplier (higher availability = higher cost)
        if scope["availability"] > 99.9:
            scaled_cost *= 1.5
        elif scope["availability"] > 99:
            scaled_cost *= 1.2
        
        breakdown.append({
            "category": category,
            "component": node["data"]["label"],
            "componentId": node["data"]["componentId"],
            "baseCost": base_cost,
            "scaledCost": max(scaled_cost, 0.0),
        })
    
    total = sum(item["scaledCost"] for item in breakdown)
    
    return {
        "total": total,
        "breakdown": breakdown,
    }


def estimate_monthly_cost(nodes: list[ArchitectureNode], scope: Scope) -> float:
    """Estimate monthly cost as a single number."""
    estimate = calculate_costs(nodes, scope)
    return estimate["total"]
