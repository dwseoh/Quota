import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createNodeSlice, NodeSlice } from "./slices/nodeSlice";
import { createScopeSlice, ScopeSlice } from "./slices/scopeSlice";
import { createChatSlice, createProjectSlice, ChatSlice, ProjectSlice } from "./slices/projectSlice";

export interface ArchitectureStore extends NodeSlice, ScopeSlice, ChatSlice, ProjectSlice { }

export const useArchitectureStore = create<ArchitectureStore>()(
    persist(
        (...a) => ({
            ...createNodeSlice(...a),
            ...createScopeSlice(...a),
            ...createChatSlice(...a),
            ...createProjectSlice(...a),
        }),
        {
            name: "architecture-storage",
            partialize: (state) => ({
                nodes: state.nodes,
                edges: state.edges,
                scope: state.scope,
                suggestions: state.suggestions,
                chatMessages: state.chatMessages,
                projectName: state.projectName,
            }),
        }
    )
);
