"use client";

import React from "react";
import { useArchitectureStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import {
    Lightbulb,
    DollarSign,
    Zap,
    TrendingDown,
    X,
    CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SmartSuggestions() {
    const { suggestions, dismissSuggestion } = useArchitectureStore();

    const getIcon = (type: string) => {
        switch (type) {
            case "cost":
                return <DollarSign className="w-4 h-4" />;
            case "performance":
                return <Zap className="w-4 h-4" />;
            case "architecture":
                return <Lightbulb className="w-4 h-4" />;
            default:
                return <Lightbulb className="w-4 h-4" />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case "cost":
                return "var(--success)";
            case "performance":
                return "var(--warning)";
            case "architecture":
                return "var(--primary)";
            default:
                return "var(--primary)";
        }
    };

    const getPriorityBadge = (priority: string) => {
        const colors = {
            high: "bg-red-500/20 text-red-400 border-red-500/30",
            medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
            low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        };
        return colors[priority as keyof typeof colors] || colors.low;
    };

    return (
        <div className="p-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-[var(--foreground)]">
                    Smart Suggestions
                </h3>
                <span className="text-xs text-[var(--foreground-secondary)]">
                    {suggestions.length} {suggestions.length === 1 ? "suggestion" : "suggestions"}
                </span>
            </div>

            {suggestions.length === 0 ? (
                <div className="glass rounded-xl p-8 border border-[var(--glass-border)] text-center">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2 text-[var(--success)]" />
                    <div className="text-sm text-[var(--foreground-secondary)]">
                        No suggestions at the moment
                    </div>
                    <div className="text-xs text-[var(--foreground-secondary)] mt-1">
                        Your architecture looks good!
                    </div>
                </div>
            ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {suggestions.map((suggestion) => (
                        <div
                            key={suggestion.id}
                            className={cn(
                                "glass rounded-xl p-4 border transition-all duration-200 hover:shadow-lg",
                                "border-[var(--glass-border)] hover:border-[var(--border-hover)]"
                            )}
                        >
                            <div className="flex items-start gap-3">
                                <div
                                    className="p-2 rounded-lg flex-shrink-0"
                                    style={{
                                        backgroundColor: `${getTypeColor(suggestion.type)}20`,
                                        color: getTypeColor(suggestion.type),
                                    }}
                                >
                                    {getIcon(suggestion.type)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <h4 className="text-sm font-semibold text-[var(--foreground)]">
                                            {suggestion.title}
                                        </h4>
                                        <button
                                            onClick={() => dismissSuggestion(suggestion.id)}
                                            className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors flex-shrink-0"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <p className="text-xs text-[var(--foreground-secondary)] mb-3">
                                        {suggestion.description}
                                    </p>

                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span
                                            className={cn(
                                                "text-xs px-2 py-1 rounded-full border capitalize",
                                                getPriorityBadge(suggestion.priority)
                                            )}
                                        >
                                            {suggestion.priority} priority
                                        </span>

                                        {suggestion.savings !== undefined && (
                                            <span className="text-xs px-2 py-1 rounded-full bg-[var(--success)]/20 text-[var(--success)] border border-[var(--success)]/30 flex items-center gap-1">
                                                <TrendingDown className="w-3 h-3" />
                                                Save {formatCurrency(suggestion.savings)}/mo
                                            </span>
                                        )}

                                        <span
                                            className="text-xs px-2 py-1 rounded-full capitalize"
                                            style={{
                                                backgroundColor: `${getTypeColor(suggestion.type)}20`,
                                                color: getTypeColor(suggestion.type),
                                            }}
                                        >
                                            {suggestion.type}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
