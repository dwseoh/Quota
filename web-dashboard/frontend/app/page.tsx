"use client";

import React from "react";
import { ReactFlowProvider } from "@xyflow/react";
import ComponentLibrary from "@/components/sidebar/ComponentLibrary";
import ArchitectureCanvas from "@/components/canvas/ArchitectureCanvas";
import RightSidebar from "@/components/sidebar/RightSidebar";
import ScopePanel from "@/components/scope/ScopePanel";
import { Layers, Save, Upload, Trash2 } from "lucide-react";
import { useArchitectureStore } from "@/lib/store";

export default function Home() {
  const { saveToFile, loadFromFile, clearCanvas } = useArchitectureStore();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

  return (
    <div className="h-screen w-screen flex flex-col bg-[var(--background)] overflow-hidden">
      {/* Top Navigation */}
      <header className="h-14 border-b border-[var(--border)] bg-[var(--background-secondary)] flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--foreground)]">
              Architecture Sandbox
            </h1>
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
    </div>
  );
}
