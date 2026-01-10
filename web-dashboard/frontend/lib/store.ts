import { create } from "zustand";
import {
    Node,
    Edge,
    addEdge,
    applyNodeChanges,
    applyEdgeChanges,
    OnNodesChange,
    OnEdgesChange,
    OnConnect,
    Connection,
} from "@xyflow/react";
import {
    ArchitectureNode,
    Scope,
    CostEstimate,
    Suggestion,
    ChatMessage,
} from "./types";
import { calculateCosts } from "./cost-calculator";
import { generateSuggestions } from "./suggestion-engine";

interface ArchitectureStore {
    nodes: ArchitectureNode[];
    edges: Edge[];
    scope: Scope;
    costEstimate: CostEstimate;
    suggestions: Suggestion[];
    chatMessages: ChatMessage[];

    // Node/Edge operations
    onNodesChange: OnNodesChange<ArchitectureNode>;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    addNode: (node: ArchitectureNode) => void;
    updateNode: (id: string, data: Partial<ArchitectureNode["data"]>) => void;
    deleteNode: (id: string) => void;

    // Scope operations
    updateScope: (scope: Partial<Scope>) => void;

    // Cost & suggestions
    recalculateCosts: () => void;
    regenerateSuggestions: () => void;
    dismissSuggestion: (id: string) => void;

    // Chat operations
    addChatMessage: (message: ChatMessage) => void;
    clearChat: () => void;

    // Save/Load operations
    saveToFile: () => void;
    loadFromFile: (data: string) => void;
    clearCanvas: () => void;
}

export const useArchitectureStore = create<ArchitectureStore>((set, get) => ({
    nodes: [],
    edges: [],
    scope: {
        users: 1000,
        trafficLevel: 2,
        dataVolumeGB: 10,
        regions: 1,
        availability: 99.9,
    },
    costEstimate: {
        total: 0,
        breakdown: [],
    },
    suggestions: [],
    chatMessages: [],

    onNodesChange: (changes) => {
        set({
            nodes: applyNodeChanges(changes, get().nodes) as ArchitectureNode[],
        });
        get().recalculateCosts();
        get().regenerateSuggestions();
    },

    onEdgesChange: (changes) => {
        set({
            edges: applyEdgeChanges(changes, get().edges),
        });
    },

    onConnect: (connection: Connection) => {
        set({
            edges: addEdge(connection, get().edges),
        });
    },

    addNode: (node: ArchitectureNode) => {
        set({
            nodes: [...get().nodes, node],
        });
        get().recalculateCosts();
        get().regenerateSuggestions();
    },

    updateNode: (id: string, data: Partial<ArchitectureNode["data"]>) => {
        set({
            nodes: get().nodes.map((node) =>
                node.id === id ? { ...node, data: { ...node.data, ...data } } : node
            ),
        });
        get().recalculateCosts();
    },

    deleteNode: (id: string) => {
        set({
            nodes: get().nodes.filter((node) => node.id !== id),
            edges: get().edges.filter(
                (edge) => edge.source !== id && edge.target !== id
            ),
        });
        get().recalculateCosts();
        get().regenerateSuggestions();
    },

    updateScope: (scope: Partial<Scope>) => {
        set({
            scope: { ...get().scope, ...scope },
        });
        get().recalculateCosts();
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

    addChatMessage: (message: ChatMessage) => {
        set({
            chatMessages: [...get().chatMessages, message],
        });
    },

    clearChat: () => {
        set({ chatMessages: [] });
    },

    saveToFile: () => {
        const { nodes, edges, scope } = get();
        const data = {
            nodes,
            edges,
            scope,
            timestamp: Date.now(),
        };
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `architecture-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    loadFromFile: (jsonString: string) => {
        try {
            const data = JSON.parse(jsonString);
            set({
                nodes: data.nodes || [],
                edges: data.edges || [],
                scope: data.scope || get().scope,
            });
            get().recalculateCosts();
            get().regenerateSuggestions();
        } catch (error) {
            console.error("Failed to load architecture:", error);
        }
    },

    clearCanvas: () => {
        set({
            nodes: [],
            edges: [],
            suggestions: [],
        });
        get().recalculateCosts();
    },
}));
