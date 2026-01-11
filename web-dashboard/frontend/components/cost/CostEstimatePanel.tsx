"use client";

import React, { useEffect } from "react";
import { useArchitectureStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { TrendingDown, TrendingUp, Calculator } from "lucide-react";

export default function CostEstimatePanel() {
    const { costEstimate, scope, recalculateCosts } = useArchitectureStore();

    useEffect(() => {
        recalculateCosts();
    }, [recalculateCosts]);

    const categoryTotals = costEstimate.breakdown.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = 0;
        }
        acc[item.category] += item.scaledCost;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="p-4 space-y-4 h-full overflow-y-auto">
            {/* Total Cost */}
            <div className="glass rounded-xl p-4 border border-[var(--glass-border)]">
                <div className="text-sm text-[var(--foreground-secondary)] mb-1">
                    Total Monthly Cost
                </div>
                <div className="text-3xl font-bold text-[var(--foreground)] mb-2">
                    {formatCurrency(costEstimate.total)}
                </div>
                <div className="text-xs text-[var(--foreground-secondary)]">
                    Based on {scope.users.toLocaleString()} users, traffic level {scope.trafficLevel}
                </div>
            </div>

            {/* Breakdown by Category */}
            {Object.keys(categoryTotals).length > 0 && (
                <div className="glass rounded-xl p-4 border border-[var(--glass-border)]">
                    <div className="text-sm font-semibold text-[var(--foreground)] mb-3">
                        Cost Breakdown
                    </div>
                    <div className="space-y-2">
                        {Object.entries(categoryTotals)
                            .sort(([, a], [, b]) => b - a)
                            .map(([category, cost]) => {
                                const percentage = (cost / costEstimate.total) * 100;
                                return (
                                    <div key={category} className="space-y-1">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-[var(--foreground)] capitalize">
                                                {category}
                                            </span>
                                            <span className="font-semibold text-[var(--foreground)]">
                                                {formatCurrency(cost)}
                                            </span>
                                        </div>
                                        <div className="w-full h-1.5 bg-[var(--background)] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] rounded-full transition-all duration-500"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}

            {/* Detailed Breakdown */}
            {costEstimate.breakdown.length > 0 && (
                <div className="glass rounded-xl p-4 border border-[var(--glass-border)]">
                    <div className="text-sm font-semibold text-[var(--foreground)] mb-3">
                        Component Details
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {costEstimate.breakdown.map((item, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--background-tertiary)] transition-colors"
                            >
                                <div className="flex-1">
                                    <div className="text-sm text-[var(--foreground)]">
                                        {item.component}
                                    </div>
                                    <div className="text-xs text-[var(--foreground-secondary)] capitalize">
                                        {item.category}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-semibold text-[var(--foreground)]">
                                        {formatCurrency(item.scaledCost)}
                                    </div>
                                    {item.scaledCost > item.baseCost && (
                                        <div className="text-xs text-[var(--warning)] flex items-center gap-1">
                                            <TrendingUp className="w-3 h-3" />
                                            {((item.scaledCost / item.baseCost - 1) * 100).toFixed(0)}%
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {costEstimate.breakdown.length === 0 && (
                <div className="glass rounded-xl p-8 border border-[var(--glass-border)] text-center flex flex-col items-center">
                    <div className="w-12 h-12 bg-[var(--background-tertiary)] rounded-full flex items-center justify-center mb-3">
                        <Calculator className="w-6 h-6 text-[var(--foreground-secondary)]" />
                    </div>
                    <div className="text-sm text-[var(--foreground-secondary)]">
                        Add components to see cost estimates
                    </div>
                </div>
            )}
        </div>
    );
}
