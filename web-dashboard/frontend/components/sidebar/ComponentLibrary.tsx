"use client";

import React, { useState } from "react";
import { COMPONENT_LIBRARY } from "@/lib/components-data";
import {
    ChevronDown,
    ChevronRight,
    Search,
    Box,
    Server,
    Palette,
    Database,
    Cloud,
    Brain,
    Lock,
    Zap,
    Mail,
    Package,
    RefreshCw,
    Activity,
    Search as SearchIcon,
    LucideIcon
} from "lucide-react";
import { cn, isDarkColor } from "@/lib/utils";

// Map icon names to Lucide components

// Map icon names to Lucide components
const iconMap: Record<string, LucideIcon> = {
    server: Server,
    palette: Palette,
    database: Database,
    cloud: Cloud,
    brain: Brain,
    lock: Lock,
    zap: Zap,
    mail: Mail,
    package: Package,
    "refresh-cw": RefreshCw,
    activity: Activity,
    search: SearchIcon,
};

export default function ComponentLibrary() {
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
        new Set(["backend", "frontend", "database", "hosting"])
    );
    const [searchQuery, setSearchQuery] = useState("");

    const toggleCategory = (categoryId: string) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(categoryId)) {
            newExpanded.delete(categoryId);
        } else {
            newExpanded.add(categoryId);
        }
        setExpandedCategories(newExpanded);
    };

    const onDragStart = (
        event: React.DragEvent,
        componentId: string,
        label: string,
        category: string,
        icon: string,
        color: string
    ) => {
        event.dataTransfer.setData(
            "application/reactflow",
            JSON.stringify({ componentId, label, category, icon, color })
        );
        event.dataTransfer.effectAllowed = "move";
    };

    const filteredLibrary = COMPONENT_LIBRARY.map((category) => ({
        ...category,
        components: category.components.filter((comp) =>
            comp.name.toLowerCase().includes(searchQuery.toLowerCase())
        ),
    })).filter((category) => category.components.length > 0);

    return (
        <div className="h-full flex flex-col bg-[var(--background-secondary)] border-r border-[var(--border)]">
            {/* Header */}
            <div className="p-4 border-b border-[var(--border)]">
                <h2 className="text-lg font-bold text-[var(--foreground)] mb-3">
                    Components
                </h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-secondary)]" />
                    <input
                        type="text"
                        placeholder="Search components..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
                    />
                </div>
            </div>

            {/* Component List */}
            <div className="flex-1 overflow-y-auto p-2">
                {filteredLibrary.map((category) => {
                    const IconComponent = iconMap[category.icon];
                    return (
                        <div key={category.id} className="mb-2">
                            <button
                                onClick={() => toggleCategory(category.id)}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--background-tertiary)] transition-colors text-left"
                            >
                                {expandedCategories.has(category.id) ? (
                                    <ChevronDown className="w-4 h-4 text-[var(--foreground-secondary)]" />
                                ) : (
                                    <ChevronRight className="w-4 h-4 text-[var(--foreground-secondary)]" />
                                )}
                                {IconComponent && (
                                    <IconComponent className="w-4 h-4 text-[var(--primary)]" />
                                )}
                                <span className="text-sm font-semibold text-[var(--foreground)]">
                                    {category.name}
                                </span>
                                <span className="ml-auto text-xs text-[var(--foreground-secondary)]">
                                    {category.components.length}
                                </span>
                            </button>

                            {expandedCategories.has(category.id) && (
                                <div className="mt-1 ml-2 space-y-1">
                                    {category.components.map((component) => (
                                        <div
                                            key={component.id}
                                            draggable
                                            onDragStart={(e) =>
                                                onDragStart(
                                                    e,
                                                    component.id,
                                                    component.name,
                                                    category.id,
                                                    component.icon,
                                                    component.color
                                                )
                                            }
                                            className={cn(
                                                "flex items-center gap-2 px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing",
                                                "hover:bg-[var(--background-tertiary)] transition-all duration-200",
                                                "border border-transparent hover:border-[var(--border)]"
                                            )}
                                            style={{
                                                background: `linear-gradient(90deg, ${isDarkColor(component.color) ? "rgba(255,255,255,0.05)" : component.color + "10"} 0%, transparent 100%)`,
                                            }}
                                        >
                                            <ComponentIcon
                                                icon={component.icon}
                                                color={component.color}
                                                name={component.name}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-[var(--foreground)] truncate">
                                                    {component.name}
                                                </div>
                                                {component.baseCost !== undefined && component.baseCost > 0 && (
                                                    <div className="text-xs text-[var(--foreground-secondary)]">
                                                        ${component.baseCost}/mo
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Footer hint */}
            <div className="p-4 border-t border-[var(--border)] bg-[var(--background-tertiary)]">
                <p className="text-xs text-[var(--foreground-secondary)] text-center">
                    Drag components to canvas
                </p>
            </div>
        </div>
    );
}

// Component icon with error handling and dark logo detection
function ComponentIcon({ icon, color, name }: { icon: string; color: string; name: string }) {
    const [imageError, setImageError] = useState(false);
    const isImageUrl = icon.startsWith("http");
    const needsWhiteBg = isDarkColor(color);

    return (
        <div
            className={cn(
                "flex items-center justify-center w-8 h-8 rounded-lg p-1.5",
                needsWhiteBg ? "bg-white" : ""
            )}
            style={{ backgroundColor: needsWhiteBg ? "white" : `${color}20` }}
        >
            {isImageUrl && !imageError ? (
                <img
                    src={icon}
                    alt={name}
                    className="w-full h-full object-contain"
                    onError={() => setImageError(true)}
                />
            ) : (
                <Box className="w-full h-full" style={{ color }} />
            )}
        </div>
    );
}
