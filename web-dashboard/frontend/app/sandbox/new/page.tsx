"use client";

import React from "react";
import Link from "next/link";
import { ReactFlowProvider } from "@xyflow/react";
import ComponentLibrary from "@/components/sidebar/ComponentLibrary";
import ArchitectureCanvas from "@/components/canvas/ArchitectureCanvas";
import RightSidebar from "@/components/sidebar/RightSidebar";
import ScopePanel from "@/components/scope/ScopePanel";
import Logo from "@/components/Logo";
import PublishModal from "@/components/sandbox/PublishModal";
import { Save, Upload, Trash2, Share2 } from "lucide-react";
import { useArchitectureStore } from "@/lib/store";
import { publishSandbox } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const { saveToFile, loadFromFile, clearCanvas, projectName, setProjectName, nodes, edges, scope, costEstimate } = useArchitectureStore();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isEditingName, setIsEditingName] = React.useState(false);
  const [tempName, setTempName] = React.useState(projectName);
  const [isPublishModalOpen, setIsPublishModalOpen] = React.useState(false);

  const handleLoadFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        loadFromFile(content);
      };
      reader.readAsText(file);
    }
  };

  const handleClearCanvas = () => {
    if (confirm("Are you sure you want to clear the canvas? This cannot be undone.")) {
      clearCanvas();
    }
  };

  const handleNameClick = () => {
    setIsEditingName(true);
    setTempName(projectName);
  };

  const handleNameBlur = () => {
    setIsEditingName(false);
    if (tempName.trim()) {
      setProjectName(tempName.trim());
    } else {
      setTempName(projectName);
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNameBlur();
    } else if (e.key === "Escape") {
      setIsEditingName(false);
      setTempName(projectName);
    }
  };

  // Sync tempName when projectName changes (e.g., after loading a file)
  React.useEffect(() => {
    setTempName(projectName);
  }, [projectName]);

  // Update document title
  React.useEffect(() => {
    document.title = `Quota Sandbox | ${projectName}`;
  }, [projectName]);

  const handlePublish = async (name: string, description?: string) => {
    try {
      const result = await publishSandbox({
        projectName: name,
        description,
        architectureJson: { nodes, edges, scope, costEstimate },
      });

      setIsPublishModalOpen(false);

      // Clear the canvas for next use
      clearCanvas();

      // Navigate to explore page with success message
      router.push(`/explore?published=${result.sandboxId}`);
    } catch (error) {
      console.error("Failed to publish sandbox:", error);
      alert("Failed to publish sandbox. Please try again.");
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[var(--background)] overflow-hidden">
      {/* Top Navigation */}
      <header className="h-14 border-b border-[var(--border)] bg-[var(--background-secondary)] flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
              <Logo className="w-5 h-5 text-white" />
            </div>
          </Link>
          <div>
            {isEditingName ? (
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={handleNameBlur}
                onKeyDown={handleNameKeyDown}
                autoFocus
                className="text-lg font-bold text-[var(--foreground)] bg-[var(--background-tertiary)] border border-[var(--primary)] rounded px-2 py-0.5 outline-none w-[300px]"
              />
            ) : (
              <h1
                className="text-lg font-bold text-[var(--foreground)] cursor-pointer hover:text-[var(--primary)] transition-colors truncate max-w-[300px]"
                onClick={handleNameClick}
                title={projectName}
              >
                {projectName}
              </h1>
            )}
            <p className="text-xs text-[var(--foreground-secondary)]">
              Design, estimate, and optimize your stack
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={saveToFile}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--background-tertiary)] hover:bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] text-sm transition-colors"
          >
            <Upload className="w-4 h-4" />
            Load
          </button>
          <button
            onClick={handleClearCanvas}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--error)]/20 hover:bg-[var(--error)]/30 border border-[var(--error)]/30 text-[var(--error)] text-sm transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
          <div className="h-6 w-px bg-[var(--border)]" />
          <button
            onClick={() => setIsPublishModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--accent)]/90 hover:bg-[var(--accent)]/70 text-white text-sm font-semibold transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Publish
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleLoadFile}
            className="hidden"
          />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Component Library */}
        <div className="w-64 flex-shrink-0">
          <ComponentLibrary />
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1">
            <ReactFlowProvider>
              <ArchitectureCanvas />
            </ReactFlowProvider>
          </div>

          {/* Bottom - Scope Panel */}
          <div className="flex-shrink-0">
            <ScopePanel />
          </div>
        </div>

        {/* Right Sidebar - Cost, Suggestions, Chat */}
        <div className="w-96 flex-shrink-0">
          <RightSidebar />
        </div>
      </div>

      {/* Publish Modal */}
      <PublishModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onPublish={handlePublish}
        currentProjectName={projectName}
      />
    </div>
  );
}
