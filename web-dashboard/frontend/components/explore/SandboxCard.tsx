"use client";

import React from "react";
import Link from "next/link";
import { Calendar, Eye, DollarSign } from "lucide-react";

interface SandboxCardProps {
    sandboxId: string;
    projectName: string;
    description?: string;
    techStack: string[];
    totalCost: number;
    createdAt: string;
    views: number;
}

export default function SandboxCard({
    sandboxId,
    projectName,
    description,
    techStack,
    totalCost,
    createdAt,
    views,
}: SandboxCardProps) {
    const formattedDate = new Date(createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });

    return (
        <Link href={`/sandbox/${sandboxId}`}>
            <div className="glass rounded-xl p-5 border border-[var(--glass-border)] hover:border-[var(--primary)] transition-all duration-300 cursor-pointer group h-full flex flex-col">
                {/* Header */}
                <div className="flex-1 space-y-3">
                    <h3 className="text-lg font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors line-clamp-2">
                        {projectName}
                    </h3>

                    {description && (
                        <p className="text-sm text-[var(--foreground-secondary)] line-clamp-2">
                            {description}
                        </p>
                    )}

                    {/* Tech Stack */}
                    <div className="flex flex-wrap gap-2">
                        {techStack.slice(0, 4).map((tech) => (
                            <span
                                key={tech}
                                className="px-2 py-1 rounded-md bg-[var(--background-tertiary)] text-xs text-[var(--foreground)] border border-[var(--border)]"
                            >
                                {tech}
                            </span>
                        ))}
                        {techStack.length > 4 && (
                            <span className="px-2 py-1 rounded-md bg-[var(--background-tertiary)] text-xs text-[var(--foreground-secondary)]">
                                +{techStack.length - 4} more
                            </span>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--foreground-secondary)]">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>${totalCost.toFixed(0)}/mo</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            <span>{views}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formattedDate}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
