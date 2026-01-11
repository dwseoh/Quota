"use client";

import React, { useState } from "react";
import CostEstimatePanel from "../cost/CostEstimatePanel";
import SmartSuggestions from "../suggestions/SmartSuggestions";
import Chatbot from "../chat/Chatbot";
import { DollarSign, Lightbulb, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "cost" | "suggestions" | "chat";

export default function RightSidebar() {
    const [activeTab, setActiveTab] = useState<Tab>("cost");

    const tabs = [
        { id: "cost" as Tab, label: "Cost", icon: DollarSign },
        { id: "suggestions" as Tab, label: "Suggestions", icon: Lightbulb },
        { id: "chat" as Tab, label: "Chat", icon: MessageSquare },
    ];

    return (
        <div className="h-full flex flex-col bg-[var(--background-secondary)] border-l border-[var(--border)]">
            {/* Tabs */}
            <div className="flex border-b border-[var(--border)]">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
                            activeTab === tab.id
                                ? "bg-[var(--background)] text-[var(--primary)] border-b-2 border-[var(--primary)]"
                                : "text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)]"
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {activeTab === "cost" && <CostEstimatePanel />}
                {activeTab === "suggestions" && <SmartSuggestions />}
                {activeTab === "chat" && <Chatbot />}
            </div>
        </div>
    );
}
