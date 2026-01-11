import { StateCreator } from "zustand";
import { ChatMessage } from "../../types";
import type { ArchitectureStore } from "../index";

export interface ChatSlice {
    chatMessages: ChatMessage[];
    addChatMessage: (message: ChatMessage) => void;
    clearChat: () => void;
}

export interface ProjectSlice {
    projectName: string;
    sessionId?: string;
    setProjectName: (name: string) => void;
    setSessionId: (id: string) => void;
    saveToFile: () => void;
    loadFromFile: (data: string) => void;
}

export const createChatSlice: StateCreator<ArchitectureStore, [], [], ChatSlice> = (set, get) => ({
    chatMessages: [],

    addChatMessage: (message: ChatMessage) => {
        set({
            chatMessages: [...get().chatMessages, message],
        });
    },

    clearChat: () => {
        set({ chatMessages: [] });
    },
});

export const createProjectSlice: StateCreator<ArchitectureStore, [], [], ProjectSlice> = (set, get) => ({
    projectName: "Untitled Project",
    sessionId: undefined,

    setProjectName: (name: string) => {
        set({ projectName: name });
    },

    setSessionId: (id: string) => {
        set({ sessionId: id });
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
});
