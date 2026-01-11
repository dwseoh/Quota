import { Node, Edge } from "@xyflow/react";

export interface ArchitectureNode extends Node {
    data: {
        label: string;
        componentId: string;
        category: string;
        icon: string;
        color: string;
        config?: Record<string, any>;
    };
}

export interface ArchitectureEdge extends Edge { }

export interface Scope {
    users: number;
    trafficLevel: 1 | 2 | 3 | 4 | 5;
    dataVolumeGB: number;
    regions: number;
    availability: number; // percentage
}

export interface CostBreakdown {
    category: string;
    component: string;
    componentId: string;
    baseCost: number;
    scaledCost: number;
}

export interface CostEstimate {
    total: number;
    breakdown: CostBreakdown[];
}

export interface Suggestion {
    id: string;
    type: "cost" | "architecture" | "performance";
    title: string;
    description: string;
    savings?: number;
    priority: "high" | "medium" | "low";
    action?: () => void;
}

export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: number;
}
