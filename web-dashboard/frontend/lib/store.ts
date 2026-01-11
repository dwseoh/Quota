import { create } from "zustand";
import { persist } from "zustand/middleware";
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
    isLocked: boolean;
    projectName: string;
    sessionId?: string;

    // Node/Edge operations
    onNodesChange: OnNodesChange<ArchitectureNode>;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    addNode: (node: ArchitectureNode) => void;
    updateNode: (id: string, data: Partial<ArchitectureNode["data"]>) => void;
    deleteNode: (id: string) => void;
    setNodes: (nodes: ArchitectureNode[]) => void;
    setEdges: (edges: Edge[]) => void;
    toggleLock: () => void;

    // Scope operations
    updateScope: (scope: Partial<Scope>) => void;

    // Cost & suggestions
    recalculateCosts: () => void;
    regenerateSuggestions: () => void;
    dismissSuggestion: (id: string) => void;

    // Chat operations
    addChatMessage: (message: ChatMessage) => void;
    clearChat: () => void;

    // Project operations
    setProjectName: (name: string) => void;
    setSessionId: (id: string) => void;

    // Save/Load operations
    saveToFile: () => void;
    loadFromFile: (data: string) => void;
    clearCanvas: () => void;
}

export const useArchitectureStore = create<ArchitectureStore>()(
    persist(
        (set, get) => ({
            nodes: [],
            edges: [],
            isLocked: false,
            projectName: "Untitled Project",
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

                console.log("Connection attempt:", connection);

                // Prevent self-connections
                if (connection.source === connection.target) {
                    console.log("Self-connection prevented");
                    return;
                }

                // Check for existing connection between these two nodes (same handles)
                const existingEdge = edges.find(
                    (edge) =>
                        (edge.source === connection.source &&
                            edge.target === connection.target &&
                            edge.sourceHandle === connection.sourceHandle &&
                            edge.targetHandle === connection.targetHandle) ||
                        (edge.source === connection.target &&
                            edge.target === connection.source &&
                            edge.sourceHandle === connection.targetHandle &&
                            edge.targetHandle === connection.sourceHandle)
                );

                if (existingEdge) {
                    console.log("Duplicate connection prevented");
                    return; // Prevent duplicate/bidirectional connections
                }

                console.log("Creating connection");
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

            updateScope: (scope: Partial<Scope>) => {
                if (get().isLocked) return;
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

            setProjectName: (name: string) => {
                set({ projectName: name });
            },

            setSessionId: (id: string) => {
                set({ sessionId: id });
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
                const { nodes, edges, scope, costEstimate, projectName } = get();
                const data = {
                    projectName,
                    nodes,
                    edges,
                    scope,
                    costEstimate: {
                        total: costEstimate.total,
                        breakdown: costEstimate.breakdown,
                    },
                    timestamp: Date.now(),
                };
                const json = JSON.stringify(data, null, 2);
                const blob = new Blob([json], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                const fileName = projectName.toLowerCase().replace(/\s+/g, "-");
                a.download = `${fileName}-${Date.now()}.json`;
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
                        projectName: data.projectName || "Untitled Project",
                    });
                    get().recalculateCosts();
                    get().regenerateSuggestions();
                } catch (error) {
                    console.error("Failed to load architecture:", error);
                }
            },

            clearCanvas: () => {
                if (get().isLocked) return;
                set({
                    nodes: [],
                    edges: [],
                    suggestions: [],
                    projectName: "Untitled Project",
                    chatMessages: [],  // Clear chat conversation
                    sessionId: undefined,  // Reset session
                    scope: {  // Reset scope to default values
                        users: 1000,
                        trafficLevel: 2,
                        dataVolumeGB: 10,
                        regions: 1,
                        availability: 99.9,
                    },
                });
                get().recalculateCosts();
            },
        }),
        {
            name: "architecture-storage", // local storage key
            partialize: (state) => ({
                nodes: state.nodes,
                edges: state.edges,
                scope: state.scope,
                suggestions: state.suggestions,
                chatMessages: state.chatMessages,
                projectName: state.projectName,
                // Don't persist isLocked state so user doesn't get stuck
            }),
        }
    )
);
