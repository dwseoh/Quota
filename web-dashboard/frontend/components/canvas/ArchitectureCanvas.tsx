"use client";

import React, { useCallback, useEffect } from "react";
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    BackgroundVariant,
    NodeTypes,
    EdgeTypes,
    ControlButton,
    ConnectionMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useArchitectureStore } from "@/lib/store";
import CustomNode from "./CustomNode";
import CustomEdge from "./CustomEdge";
import { Lock, Unlock } from "lucide-react";

const nodeTypes: NodeTypes = {
    custom: CustomNode,
};

const edgeTypes: EdgeTypes = {
    custom: CustomEdge,
};

interface ArchitectureCanvasProps {
    readOnly?: boolean;
}

export default function ArchitectureCanvas({ readOnly = false }: ArchitectureCanvasProps) {
    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        isLocked: storeIsLocked,
        toggleLock,
    } = useArchitectureStore();

    const isLocked = readOnly || storeIsLocked;

    // Inject readOnly prop into node data
    const nodesWithReadOnly = React.useMemo(() => {
        return nodes.map(node => ({
            ...node,
            data: {
                ...node.data,
                readOnly: isLocked
            }
        }));
    }, [nodes, isLocked]);

    // Deselect all nodes when entering lock mode
    useEffect(() => {
        if (isLocked) {
            useArchitectureStore.getState().onNodesChange(
                nodes.map((node) => ({
                    id: node.id,
                    type: "select",
                    selected: false,
                }))
            );
        }
    }, [isLocked]);

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            if (isLocked) return;
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
        [isLocked]
    );

    const handleConnect = useCallback((connection: any) => {
        // Deselect all nodes before creating connection to avoid interference
        useArchitectureStore.getState().onNodesChange(
            nodes.map((node) => ({
                id: node.id,
                type: "select" as const,
                selected: false,
            }))
        );
        // Then create the connection
        onConnect(connection);
    }, [nodes, onConnect]);

    return (
        <div className="w-full h-full">
            <ReactFlow
                nodes={nodesWithReadOnly}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={handleConnect}
                onDrop={onDrop}
                onDragOver={onDragOver}
                nodesDraggable={!isLocked}
                nodesConnectable={!isLocked}
                elementsSelectable={!isLocked}
                selectNodesOnDrag={false}
                connectionMode={ConnectionMode.Loose}
                proOptions={{ hideAttribution: true }}
                onPaneClick={() => {
                    if (isLocked) return;
                    // Deselect all nodes when clicking on empty canvas
                    useArchitectureStore.getState().onNodesChange(
                        nodes.map((node) => ({
                            id: node.id,
                            type: "select" as const,
                            selected: false,
                        }))
                    );
                }}
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
                {!readOnly && (
                    <Controls
                        showInteractive={false}
                        className="!bg-[var(--glass-bg)] !border-[var(--glass-border)] !backdrop-blur-xl !rounded-xl !shadow-lg [&>button]:!bg-[var(--background-tertiary)] [&>button]:!rounded-lg [&>button]:!border [&>button]:!border-[var(--border)] [&>button]:!w-8 [&>button]:!h-8"
                    >
                        <ControlButton onClick={toggleLock} title={isLocked ? "Unlock Canvas" : "Lock Canvas"}>
                            {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </ControlButton>
                    </Controls>
                )}
                <MiniMap
                    style={{ height: 100, width: 140 }}
                    className="!bg-[var(--glass-bg)]/20 !border-[var(--border)]/30 !backdrop-blur-[4px] !rounded-lg !shadow-sm !bottom-2 !right-2"
                    maskColor="rgba(0, 0, 0, 0.05)"
                    nodeColor={(node) => {
                        const data = node.data as any;
                        return data.color ? `${data.color}80` : "#888";
                    }}
                />
            </ReactFlow>
        </div>
    );
}
