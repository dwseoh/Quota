import { StateCreator } from "zustand";
import { Scope } from "../../types";
import type { ArchitectureStore } from "../index";

export interface ScopeSlice {
    scope: Scope;
    updateScope: (scope: Partial<Scope>) => void;
}

export const createScopeSlice: StateCreator<ArchitectureStore, [], [], ScopeSlice> = (set, get) => ({
    scope: {
        users: 1000,
        trafficLevel: 2,
        dataVolumeGB: 10,
        regions: 1,
        availability: 99.9,
    },

    updateScope: (scope: Partial<Scope>) => {
        if (get().isLocked) return;
        set({
            scope: { ...get().scope, ...scope },
        });
        get().recalculateCosts();
    },
});
