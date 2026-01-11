"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Logo from "@/components/Logo";
import SandboxCard from "@/components/explore/SandboxCard";
import { Search, Loader2, CheckCircle } from "lucide-react";
import { getSandboxes } from "@/lib/actions";

interface Sandbox {
    sandboxId: string;
    projectName: string;
    description?: string;
    techStack: string[];
    totalCost: number;
    createdAt: string;
    views: number;
}

export default function ExplorePage() {
    const searchParams = useSearchParams();
    const publishedId = searchParams.get("published");

    const [sandboxes, setSandboxes] = useState<Sandbox[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [showSuccessToast, setShowSuccessToast] = useState(false);

    useEffect(() => {
        fetchSandboxes();

        // Show success toast if coming from publish
        if (publishedId) {
            setShowSuccessToast(true);
            setTimeout(() => setShowSuccessToast(false), 5000);
        }
    }, [publishedId]);

    const fetchSandboxes = async () => {
        try {
            const data = await getSandboxes();
            setSandboxes(data);
        } catch (error) {
            console.error("Failed to fetch sandboxes:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredSandboxes = sandboxes.filter((sandbox) =>
        sandbox.projectName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-screen overflow-y-auto bg-[var(--background)] flex flex-col">
            {/* Header */}
            <header className="border-b border-[var(--border)] bg-[var(--background-secondary)] px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
                            <Logo className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-[var(--foreground)]">Quota Sandbox</h1>
                    </Link>
                    <Link
                        href="/sandbox/new"
                        className="px-4 py-2 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-sm font-semibold transition-colors"
                    >
                        Create Sandbox
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 px-6 py-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Page Header */}
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold text-[var(--foreground)]">Explore Sandboxes</h2>
                        <p className="text-[var(--foreground-secondary)]">
                            Discover architectures shared by the community
                        </p>
                    </div>

                    {/* Search Bar */}
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--foreground-secondary)]" />
                        <input
                            type="text"
                            placeholder="Search by project name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                        />
                    </div>

                    {/* Grid */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
                        </div>
                    ) : filteredSandboxes.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-[var(--foreground-secondary)]">
                                {searchQuery ? "No sandboxes found matching your search" : "No sandboxes published yet"}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredSandboxes.map((sandbox) => (
                                <SandboxCard key={sandbox.sandboxId} {...sandbox} />
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Success Toast */}
            {showSuccessToast && (
                <div className="fixed bottom-6 right-6 glass rounded-xl border border-[var(--success)]/30 p-4 flex items-center gap-3 animate-fadeIn shadow-lg z-50">
                    <CheckCircle className="w-5 h-5 text-[var(--success)]" />
                    <div>
                        <p className="text-sm font-semibold text-[var(--foreground)]">Sandbox published successfully!</p>
                        <p className="text-xs text-[var(--foreground-secondary)]">Your architecture is now live</p>
                    </div>
                </div>
            )}
        </div>
    );
}
