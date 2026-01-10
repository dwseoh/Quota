"use client";

import React from "react";
import {
    BaseEdge,
    EdgeProps,
    getBezierPath,
    EdgeLabelRenderer,
    useReactFlow,
} from "@xyflow/react";
import { X } from "lucide-react";

export default function CustomEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
}: EdgeProps) {
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    const [isHovered, setIsHovered] = React.useState(false);
    const { setEdges } = useReactFlow();

    const onEdgeDelete = () => {
        setEdges((edges) => edges.filter((edge) => edge.id !== id));
    };

    return (
        <>
            <BaseEdge
                path={edgePath}
                markerEnd={markerEnd}
                style={{
                    ...style,
                    strokeWidth: isHovered ? 3 : 2,
                    stroke: isHovered ? "var(--primary)" : "var(--border-hover)",
                }}
            />
            <path
                d={edgePath}
                fill="none"
                strokeWidth={20}
                stroke="transparent"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{ cursor: "pointer" }}
            />
            {isHovered && (
                <EdgeLabelRenderer>
                    <div
                        style={{
                            position: "absolute",
                            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                            pointerEvents: "all",
                        }}
                        className="nodrag nopan"
                    >
                        <button
                            className="w-6 h-6 rounded-full bg-[var(--error)] hover:bg-red-600 flex items-center justify-center transition-colors shadow-lg"
                            onClick={(event) => {
                                event.stopPropagation();
                                onEdgeDelete();
                            }}
                        >
                            <X className="w-4 h-4 text-white" />
                        </button>
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
}
