"use client";

import React, { memo, useState } from "react";
import { Handle, Position, NodeProps, Node, useReactFlow } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { Box, Trash2 } from "lucide-react";
import { useArchitectureStore } from "@/lib/store";

export interface CustomNodeData extends Record<string, unknown> {
    label: string;
    componentId: string;
    category: string;
    icon: string;
    color: string;
    config?: Record<string, any>;
}

// Detect if a color is very dark (black or near-black)
const isDarkColor = (color: string): boolean => {
    const hex = color.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 50; // Only very dark colors
};

const CustomNode = memo(({ data, selected, id }: NodeProps<Node<CustomNodeData>>) => {
    const isImageUrl = data.icon.startsWith("http");
    const [imageError, setImageError] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const needsWhiteBg = isDarkColor(data.color);
    const { setNodes } = useReactFlow();
    const isLocked = useArchitectureStore((state) => state.isLocked);

    const deleteNode = () => {
        setNodes((nodes) => nodes.filter((node) => node.id !== id));
    };

    return (
        <div
            className={cn(
                "px-4 py-3 rounded-xl border-2 transition-all duration-200 min-w-[140px] relative backdrop-blur-xl",
                "shadow-md hover:shadow-lg",
                selected && !isLocked
                    ? "border-[var(--primary)] shadow-[0_0_20px_rgba(99,102,241,0.5)] scale-105"
                    : "border-[var(--glass-border)]"
            )}
            style={{
                background: `linear-gradient(135deg, ${data.color}20 0%, ${data.color}05 100%)`,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Delete button - shows on hover or select (only if not locked) */}
            {!isLocked && (isHovered || selected) && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        deleteNode();
                    }}
                    className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-[var(--error)] hover:bg-red-600 flex items-center justify-center transition-all shadow-lg hover:scale-110 z-10"
                    title="Delete node"
                >
                    <Trash2 className="w-3 h-3 text-white" />
                </button>
            )}

            {/* Handles - only visible on hover or when selected, hidden when locked */}
            {!isLocked && (
                <>
                    <Handle
                        id="top"
                        type="source"
                        position={Position.Top}
                        className={cn(
                            "!w-3 !h-3 !border-2 transition-opacity",
                            isHovered || selected ? "!opacity-100" : "!opacity-0"
                        )}
                        style={{ borderColor: data.color, top: -3 }}
                    />
                    <Handle
                        id="top-target"
                        type="target"
                        position={Position.Top}
                        className={cn(
                            "!w-3 !h-3 !border-2 transition-opacity",
                            isHovered || selected ? "!opacity-100" : "!opacity-0"
                        )}
                        style={{ borderColor: data.color, top: -3 }}
                    />
                    <Handle
                        id="left"
                        type="source"
                        position={Position.Left}
                        className={cn(
                            "!w-3 !h-3 !border-2 transition-opacity",
                            isHovered || selected ? "!opacity-100" : "!opacity-0"
                        )}
                        style={{ borderColor: data.color, left: -3 }}
                    />
                    <Handle
                        id="left-target"
                        type="target"
                        position={Position.Left}
                        className={cn(
                            "!w-3 !h-3 !border-2 transition-opacity",
                            isHovered || selected ? "!opacity-100" : "!opacity-0"
                        )}
                        style={{ borderColor: data.color, left: -3 }}
                    />
                </>
            )}

            <div className="flex items-center gap-2">
                <div
                    className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-lg p-1.5",
                        needsWhiteBg ? "bg-white" : ""
                    )}
                    style={{ backgroundColor: needsWhiteBg ? "white" : `${data.color}20` }}
                >
                    {isImageUrl && !imageError ? (
                        <img
                            src={data.icon}
                            alt={data.label}
                            className="w-full h-full object-contain"
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <Box className="w-full h-full" style={{ color: data.color }} />
                    )}
                </div>
                <div className="flex-1">
                    <div className="font-semibold text-sm text-[var(--foreground)]">
                        {data.label}
                    </div>
                    <div className="text-xs text-[var(--foreground-secondary)] capitalize">
                        {data.category}
                    </div>
                </div>
            </div>

            {!isLocked && (
                <>
                    <Handle
                        id="bottom"
                        type="source"
                        position={Position.Bottom}
                        className={cn(
                            "!w-3 !h-3 !border-2 transition-opacity",
                            isHovered || selected ? "!opacity-100" : "!opacity-0"
                        )}
                        style={{ borderColor: data.color, bottom: -3 }}
                    />
                    <Handle
                        id="bottom-target"
                        type="target"
                        position={Position.Bottom}
                        className={cn(
                            "!w-3 !h-3 !border-2 transition-opacity",
                            isHovered || selected ? "!opacity-100" : "!opacity-0"
                        )}
                        style={{ borderColor: data.color, bottom: -3 }}
                    />
                    <Handle
                        id="right"
                        type="source"
                        position={Position.Right}
                        className={cn(
                            "!w-3 !h-3 !border-2 transition-opacity",
                            isHovered || selected ? "!opacity-100" : "!opacity-0"
                        )}
                        style={{ borderColor: data.color, right: -3 }}
                    />
                    <Handle
                        id="right-target"
                        type="target"
                        position={Position.Right}
                        className={cn(
                            "!w-3 !h-3 !border-2 transition-opacity",
                            isHovered || selected ? "!opacity-100" : "!opacity-0"
                        )}
                        style={{ borderColor: data.color, right: -3 }}
                    />
                </>
            )}
        </div>
    );
});

CustomNode.displayName = "CustomNode";

export default CustomNode;
