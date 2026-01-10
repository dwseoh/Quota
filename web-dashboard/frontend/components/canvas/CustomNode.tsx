"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps, Node } from "@xyflow/react";
import { cn } from "@/lib/utils";
import Image from "next/image";

export interface CustomNodeData extends Record<string, unknown> {
    label: string;
    componentId: string;
    category: string;
    icon: string;
    color: string;
    config?: Record<string, any>;
}

const CustomNode = memo(({ data, selected }: NodeProps<Node<CustomNodeData>>) => {
    const isImageUrl = data.icon.startsWith("http");

    return (
        <div
            className={cn(
                "px-4 py-3 rounded-xl border-2 transition-all duration-200 min-w-[140px]",
                "glass shadow-md hover:shadow-lg",
                selected
                    ? "border-[var(--primary)] shadow-[var(--shadow-glow)]"
                    : "border-[var(--glass-border)]"
            )}
            style={{
                background: `linear-gradient(135deg, ${data.color}15 0%, ${data.color}05 100%)`,
            }}
        >
            <Handle
                type="target"
                position={Position.Top}
                className="!w-4 !h-4 !border-2 !-top-2"
                style={{ borderColor: data.color }}
            />
            <Handle
                type="target"
                position={Position.Left}
                className="!w-4 !h-4 !border-2 !-left-2"
                style={{ borderColor: data.color }}
            />

            <div className="flex items-center gap-2">
                <div
                    className="flex items-center justify-center w-8 h-8 rounded-lg p-1.5"
                    style={{ backgroundColor: `${data.color}20` }}
                >
                    {isImageUrl ? (
                        <img
                            src={data.icon}
                            alt={data.label}
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <span className="text-2xl">{data.icon}</span>
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

            <Handle
                type="source"
                position={Position.Bottom}
                className="!w-4 !h-4 !border-2 !-bottom-2"
                style={{ borderColor: data.color }}
            />
            <Handle
                type="source"
                position={Position.Right}
                className="!w-4 !h-4 !border-2 !-right-2"
                style={{ borderColor: data.color }}
            />
        </div>
    );
});

CustomNode.displayName = "CustomNode";

export default CustomNode;
