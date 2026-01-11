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
    selected,
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

    const showButton = isHovered || selected;

    return (
        <>
            <BaseEdge
                path={edgePath}
                markerEnd={markerEnd}
                style={{
                    ...style,
                    strokeWidth: showButton ? 3 : 2,
                    stroke: showButton ? "var(--primary)" : "var(--border-hover)",
                }}
            />
            {/* Invisible wider path for easier hovering */}
            <path
                d={edgePath}
                fill="none"
                strokeWidth={30}
                stroke="transparent"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{ cursor: "pointer" }}
            />
            {showButton && (
                <EdgeLabelRenderer>
                    <div
                        style={{
                            position: "absolute",
                            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                            pointerEvents: "all",
                        }}
                        className="nodrag nopan"
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                    >
                        <button
                            className="w-7 h-7 rounded-full bg-[var(--error)] hover:bg-red-600 flex items-center justify-center transition-all shadow-lg hover:scale-110"
                            onClick={(event) => {
                                event.stopPropagation();
                                onEdgeDelete();
                            }}
                            title="Delete connection"
                        >
                            <X className="w-4 h-4 text-white" />
                        </button>
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
}
