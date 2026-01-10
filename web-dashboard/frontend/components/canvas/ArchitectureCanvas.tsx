"use client";

import React, { useCallback } from "react";
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    BackgroundVariant,
    NodeTypes,
    EdgeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useArchitectureStore } from "@/lib/store";
import CustomNode from "./CustomNode";
import CustomEdge from "./CustomEdge";

const nodeTypes: NodeTypes = {
    custom: CustomNode,
};

const edgeTypes: EdgeTypes = {
    custom: CustomEdge,
};

export default function ArchitectureCanvas() {
    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
    } = useArchitectureStore();

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const componentData = event.dataTransfer.getData("application/reactflow");
            if (!componentData) return;

            const { componentId, label, category, icon, color } = JSON.parse(componentData);

            const reactFlowBounds = (event.target as HTMLElement)
                .closest(".react-flow")
                ?.getBoundingClientRect();

            if (!reactFlowBounds) return;

            const position = {
                x: event.clientX - reactFlowBounds.left - 70,
                y: event.clientY - reactFlowBounds.top - 20,
            };

            const newNode = {
                id: `${componentId}-${Date.now()}`,
                type: "custom",
                position,
                data: {
                    label,
                    componentId,
                    category,
                    icon,
                    color,
                },
            };

            useArchitectureStore.getState().addNode(newNode);
        },
        []
    );

    return (
        <div className="w-full h-full">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onDrop={onDrop}
                onDragOver={onDragOver}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                className="bg-[var(--background)]"
                defaultEdgeOptions={{
                    type: "custom",
                    animated: true,
                }}
            >
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={20}
                    size={2}
                    color="rgba(255, 255, 255, 0.2)"
                />
                <Controls
                    className="!bg-[var(--glass-bg)] !border-[var(--glass-border)] !backdrop-blur-xl"
                />
                <MiniMap
                    className="!bg-[var(--glass-bg)] !border-[var(--glass-border)] !backdrop-blur-xl"
                    nodeColor={(node) => {
                        const data = node.data as any;
                        return data.color || "var(--primary)";
                    }}
                />
            </ReactFlow>
        </div>
    );
}
