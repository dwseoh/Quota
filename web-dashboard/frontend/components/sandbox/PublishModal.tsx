"use client";

import React, { useState } from "react";
import { X, AlertTriangle } from "lucide-react";

interface PublishModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPublish: (projectName: string, description?: string) => void;
    currentProjectName: string;
}

export default function PublishModal({
    isOpen,
    onClose,
    onPublish,
    currentProjectName,
}: PublishModalProps) {
    const [projectName, setProjectName] = useState(currentProjectName);
    const [description, setDescription] = useState("");
    const [isPublishing, setIsPublishing] = useState(false);

    if (!isOpen) return null;

    const handlePublish = async () => {
        if (!projectName.trim()) return;

        setIsPublishing(true);
        await onPublish(projectName.trim(), description.trim() || undefined);
        setIsPublishing(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass rounded-xl border border-[var(--glass-border)] max-w-md w-full p-6 space-y-4 animate-fadeIn">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-[var(--foreground)]">Publish Sandbox</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg hover:bg-[var(--background-tertiary)] flex items-center justify-center transition-colors"
                    >
                        <X className="w-5 h-5 text-[var(--foreground-secondary)]" />
                    </button>
                </div>

                {/* Warning */}
                <div className="flex gap-3 p-3 rounded-lg bg-[var(--warning)]/10 border border-[var(--warning)]/30">
                    <AlertTriangle className="w-5 h-5 text-[var(--warning)] flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-[var(--foreground-secondary)]">
                        Once published, this sandbox will be <strong>view-only for everyone, including you</strong>. You won't be able to edit it.
                    </p>
                </div>

                {/* Form */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                            Project Name *
                        </label>
                        <input
                            type="text"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            maxLength={100}
                            className="w-full px-3 py-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                            placeholder="My Awesome Architecture"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                            Description (optional)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={500}
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] transition-colors resize-none"
                            placeholder="A brief description of your architecture..."
                        />
                        <p className="text-xs text-[var(--foreground-secondary)] mt-1">
                            {description.length}/500 characters
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <button
                        onClick={onClose}
                        disabled={isPublishing}
                        className="flex-1 px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--background-tertiary)] transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handlePublish}
                        disabled={!projectName.trim() || isPublishing}
                        className="flex-1 px-4 py-2 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isPublishing ? "Publishing..." : "Publish"}
                    </button>
                </div>
            </div>
        </div>
    );
}
