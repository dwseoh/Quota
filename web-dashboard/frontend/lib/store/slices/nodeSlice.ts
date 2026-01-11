import { StateCreator } from "zustand";
import {
    ArchitectureNode,
    CostEstimate,
    Suggestion,
} from "../../types";
import {
    Edge,
    addEdge,
    applyNodeChanges,
    applyEdgeChanges,
    OnNodesChange,
    OnEdgesChange,
    OnConnect,
    Connection,
} from "@xyflow/react";
import { calculateCosts } from "../../cost-calculator";
import { generateSuggestions } from "../../suggestion-engine";
import type { ArchitectureStore } from "../index";

export interface NodeSlice {
    nodes: ArchitectureNode[];
    edges: Edge[];
    isLocked: boolean;
    costEstimate: CostEstimate;
    suggestions: Suggestion[];

    onNodesChange: OnNodesChange<ArchitectureNode>;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    addNode: (node: ArchitectureNode) => void;
    updateNode: (id: string, data: Partial<ArchitectureNode["data"]>) => void;
    deleteNode: (id: string) => void;
    setNodes: (nodes: ArchitectureNode[]) => void;
    setEdges: (edges: Edge[]) => void;
    toggleLock: () => void;

    // Actions that affect multiple slices
    recalculateCosts: () => void;
    regenerateSuggestions: () => void;
    dismissSuggestion: (id: string) => void;

    // Canvas control
    clearCanvas: () => void;
}

export const createNodeSlice: StateCreator<ArchitectureStore, [], [], NodeSlice> = (set, get) => ({
    nodes: [],
    edges: [],
    isLocked: false,
    costEstimate: {
        total: 0,
        breakdown: [],
    },
    suggestions: [],

    onNodesChange: (changes) => {
        if (get().isLocked) return;
        set({
            nodes: applyNodeChanges(changes, get().nodes) as ArchitectureNode[],
        });
        get().recalculateCosts();
        get().regenerateSuggestions();
    },

    onEdgesChange: (changes) => {
        if (get().isLocked) return;
        set({
            edges: applyEdgeChanges(changes, get().edges),
        });
    },

    onConnect: (connection: Connection) => {
        const { edges, isLocked } = get();
        if (isLocked) return;

        // Prevent self-connections
        if (connection.source === connection.target) return;

        // Check for existing connection
        const existingEdge = edges.find(
            (edge: Edge) =>
                (edge.source === connection.source &&
                    edge.target === connection.target &&
                    edge.sourceHandle === connection.sourceHandle &&
                    edge.targetHandle === connection.targetHandle) ||
                (edge.source === connection.target &&
                    edge.target === connection.source &&
                    edge.sourceHandle === connection.targetHandle &&
                    edge.targetHandle === connection.sourceHandle)
        );

        if (existingEdge) return;

        set({
            edges: addEdge(connection, edges),
        });
    },

    toggleLock: () => {
        set((state) => ({ isLocked: !state.isLocked }));
    },

    addNode: (node: ArchitectureNode) => {
        if (get().isLocked) return;
        set({
            nodes: [...get().nodes, node],
        });
        get().recalculateCosts();
        get().regenerateSuggestions();
    },

    updateNode: (id: string, data: Partial<ArchitectureNode["data"]>) => {
        if (get().isLocked) return;
        set({
            nodes: get().nodes.map((node) =>
                node.id === id ? { ...node, data: { ...node.data, ...data } } : node
            ),
        });
        get().recalculateCosts();
    },

    deleteNode: (id: string) => {
        if (get().isLocked) return;
        set({
            nodes: get().nodes.filter((node) => node.id !== id),
            edges: get().edges.filter(
                (edge) => edge.source !== id && edge.target !== id
            ),
        });
        get().recalculateCosts();
        get().regenerateSuggestions();
    },

    setNodes: (nodes: ArchitectureNode[]) => {
        if (get().isLocked) return;
        set({ nodes });
        get().recalculateCosts();
        get().regenerateSuggestions();
    },

    setEdges: (edges: Edge[]) => {
        if (get().isLocked) return;
        set({ edges });
    },

    recalculateCosts: () => {
        const { nodes, scope } = get();
        const costEstimate = calculateCosts(nodes, scope);
        set({ costEstimate });
    },

    regenerateSuggestions: () => {
        const { nodes } = get();
        const suggestions = generateSuggestions(nodes);
        set({ suggestions });
    },

    dismissSuggestion: (id: string) => {
        set({
            suggestions: get().suggestions.filter((s) => s.id !== id),
        });
    },

    clearCanvas: () => {
        if (get().isLocked) return;
        set({
            nodes: [],
            edges: [],
            suggestions: [],
            projectName: "Untitled Project",
            chatMessages: [],
            sessionId: undefined,
            scope: {
                users: 1000,
                trafficLevel: 2,
                dataVolumeGB: 10,
                regions: 1,
                availability: 99.9,
            },
        });
        get().recalculateCosts();
    },
});
