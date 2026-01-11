"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ReactFlowProvider } from "@xyflow/react";
import Logo from "@/components/Logo";
import ArchitectureCanvas from "@/components/canvas/ArchitectureCanvas";
import { getSandbox, SandboxResponse } from "@/lib/api";
import { useArchitectureStore } from "@/lib/store";
import { Loader2, ArrowLeft, Copy, Eye, Calendar, DollarSign } from "lucide-react";

export default function SandboxViewPage() {
    const params = useParams();
    const router = useRouter();
    const sandboxId = params.id as string;

    const [sandbox, setSandbox] = useState<SandboxResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { setNodes, setEdges } = useArchitectureStore();

    useEffect(() => {
        fetchSandbox();
    }, [sandboxId]);

    const fetchSandbox = async () => {
        try {
            const data = await getSandbox(sandboxId);
            setSandbox(data);

            // Load architecture into store
            setNodes(data.architectureJson.nodes || []);
            setEdges(data.architectureJson.edges || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load sandbox");
        } finally {
            setLoading(false);
        }
    };

    const handleFork = () => {
        // Architecture is already loaded in store, just navigate
        router.push("/sandbox/new");
    };

    if (loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-[var(--background)]">
                <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
            </div>
        );
    }

    if (error || !sandbox) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-[var(--background)] gap-4">
                <p className="text-[var(--error)] text-lg">{error || "Sandbox not found"}</p>
                <Link
                    href="/explore"
                    className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors"
                >
                    Back to Explore
                </Link>
            </div>
        );
    }

    const formattedDate = new Date(sandbox.createdAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });

    return (
        <div className="h-screen w-screen flex flex-col bg-[var(--background)]">
            {/* Header */}
            <header className="h-14 border-b border-[var(--border)] bg-[var(--background-secondary)] flex items-center justify-between px-6 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <Link href="/explore" className="flex items-center gap-2 text-[var(--foreground-secondary)] hover:text-[var(--primary)] transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm">Back to Explore</span>
                    </Link>

                    <div className="h-6 w-px bg-[var(--border)]" />

                    <div className="flex items-center gap-3">
                        <Link href="/">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
                                <Logo className="w-5 h-5 text-white" />
                            </div>
                        </Link>
                        <div>
                            <h1 className="text-lg font-bold text-[var(--foreground)]">{sandbox.projectName}</h1>
                            <p className="text-xs text-[var(--foreground-secondary)]">Read-only view</p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleFork}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-sm font-semibold transition-colors"
                >
                    <Copy className="w-4 h-4" />
                    Fork to New Sandbox
                </button>
            </header>

            {/* Metadata Bar */}
            <div className="border-b border-[var(--border)] bg-[var(--background-secondary)] px-6 py-3 flex items-center gap-6 text-sm text-[var(--foreground-secondary)]">
                {sandbox.description && (
                    <>
                        <p className="flex-1">{sandbox.description}</p>
                        <div className="h-4 w-px bg-[var(--border)]" />
                    </>
                )}
                <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    <span>${sandbox.totalCost.toFixed(0)}/mo</span>
                </div>
                <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{sandbox.views} views</span>
                </div>
                <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formattedDate}</span>
                </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 overflow-hidden">
                <ReactFlowProvider>
                    <ArchitectureCanvas readOnly={true} />
                </ReactFlowProvider>
            </div>
        </div>
    );
}
