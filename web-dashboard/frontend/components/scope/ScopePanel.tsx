"use client";

import React from "react";
import { useArchitectureStore } from "@/lib/store";
import { Users, Activity, Database, Globe, Shield } from "lucide-react";

export default function ScopePanel() {
    const { scope, updateScope } = useArchitectureStore();

    return (
        <div className="p-4 bg-[var(--background-secondary)] border-t border-[var(--border)]">
            <div className="flex items-center gap-6 flex-wrap">
                {/* Users */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-[var(--primary)]" />
                        <label className="text-sm font-medium text-[var(--foreground)]">
                            Users
                        </label>
                    </div>
                    <input
                        type="number"
                        value={scope.users}
                        onChange={(e) =>
                            updateScope({ users: Math.max(1, parseInt(e.target.value) || 1) })
                        }
                        className="w-24 px-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
                    />
                </div>

                {/* Traffic Level */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[var(--secondary)]" />
                        <label className="text-sm font-medium text-[var(--foreground)]">
                            Traffic
                        </label>
                    </div>
                    <select
                        value={scope.trafficLevel}
                        onChange={(e) =>
                            updateScope({
                                trafficLevel: parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5,
                            })
                        }
                        className="px-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
                    >
                        <option value={1}>Low (1)</option>
                        <option value={2}>Medium (2)</option>
                        <option value={3}>High (3)</option>
                        <option value={4}>Very High (4)</option>
                        <option value={5}>Extreme (5)</option>
                    </select>
                </div>

                {/* Data Volume */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-[var(--accent)]" />
                        <label className="text-sm font-medium text-[var(--foreground)]">
                            Data (GB)
                        </label>
                    </div>
                    <input
                        type="number"
                        value={scope.dataVolumeGB}
                        onChange={(e) =>
                            updateScope({
                                dataVolumeGB: Math.max(0, parseInt(e.target.value) || 0),
                            })
                        }
                        className="w-24 px-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
                    />
                </div>

                {/* Regions */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-[var(--success)]" />
                        <label className="text-sm font-medium text-[var(--foreground)]">
                            Regions
                        </label>
                    </div>
                    <input
                        type="number"
                        value={scope.regions}
                        onChange={(e) =>
                            updateScope({ regions: Math.max(1, parseInt(e.target.value) || 1) })
                        }
                        min={1}
                        max={10}
                        className="w-20 px-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
                    />
                </div>

                {/* Availability */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-[var(--warning)]" />
                        <label className="text-sm font-medium text-[var(--foreground)]">
                            Uptime %
                        </label>
                    </div>
                    <select
                        value={scope.availability}
                        onChange={(e) =>
                            updateScope({ availability: parseFloat(e.target.value) })
                        }
                        className="px-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
                    >
                        <option value={99}>99%</option>
                        <option value={99.9}>99.9%</option>
                        <option value={99.99}>99.99%</option>
                        <option value={99.999}>99.999%</option>
                    </select>
                </div>
            </div>
        </div>
    );
}
