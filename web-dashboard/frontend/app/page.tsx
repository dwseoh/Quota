"use client";

import React from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { ArrowRight, Layers, DollarSign, Share2, Activity, Zap, ListOrdered } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col h-screen overflow-y-auto bg-[var(--background)]">

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--background-secondary)] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
              <Logo className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">Quota Home</h1>
          </div>
          <Link
            href="/explore"
            className="text-sm text-[var(--foreground-secondary)] hover:text-[var(--primary)] transition-colors"
          >
            Explore Sandboxes
          </Link>
        </div>
      </header>

      {/* Main scrollable content */}
      <main className="flex-grow px-6 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">

          {/* Hero Section */}
          <div className="space-y-4">
            <h2 className="text-5xl font-bold text-[var(--foreground)] leading-tight">
              Design, Estimate, and Optimize
              <br />
              <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent">
                Your Tech Stack
              </span>
            </h2>
            <p className="text-xl text-[var(--foreground-secondary)] max-w-2xl mx-auto">
              Build cloud architectures visually, get instant cost estimates, and share your designs with the community.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/sandbox/new"
              className="group flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-semibold text-lg hover:shadow-[var(--shadow-glow)] transition-all duration-300"
            >
              Enter Sandbox
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/explore"
              className="flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-[var(--border)] text-[var(--foreground)] font-semibold text-lg hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all duration-300"
            >
              Browse Sandboxes
            </Link>
          </div>


          {/* Sandbox Features */}
          <section className="space-y-4 mt-16">
            <h3 className="text-2xl font-bold text-[var(--foreground)] text-center">Sandbox Features</h3>
            <p className="text-[var(--foreground-secondary)] text-center max-w-2xl mx-auto mb-8">
              Design and visualize your cloud architecture with our interactive sandbox
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass rounded-xl p-6 border border-[var(--glass-border)] space-y-3">
                <div className="w-12 h-12 rounded-lg bg-[var(--primary)]/20 flex items-center justify-center">
                  <Layers className="w-6 h-6 text-[var(--primary)]" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--foreground)]">Visual Design</h3>
                <p className="text-sm text-[var(--foreground-secondary)]">
                  Drag and drop components to build your architecture. <br></br>No code required.
                </p>
              </div>

              <div className="glass rounded-xl p-6 border border-[var(--glass-border)] space-y-3">
                <div className="w-12 h-12 rounded-lg bg-[var(--secondary)]/20 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-[var(--secondary)]" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--foreground)]">Cost Estimation</h3>
                <p className="text-sm text-[var(--foreground-secondary)]">
                  Get instant monthly cost breakdowns based on your<br></br>scale and traffic.
                </p>
              </div>

              <div className="glass rounded-xl p-6 border border-[var(--glass-border)] space-y-3">
                <div className="w-12 h-12 rounded-lg bg-[var(--accent)]/20 flex items-center justify-center">
                  <Share2 className="w-6 h-6 text-[var(--accent)]" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--foreground)]">Share & Explore</h3>
                <p className="text-sm text-[var(--foreground-secondary)]">
                  Publish your designs<br></br> and discover architectures<br></br> from the community.
                </p>
              </div>
            </div>
          </section>

          {/* VSCode Extension Features */}
          <section className="space-y-4 mt-20">
            <h3 className="text-2xl font-bold text-[var(--foreground)] text-center">VSCode Extension</h3>
            <p className="text-[var(--foreground-secondary)] text-center max-w-2xl mx-auto mb-8">
              Analyze your codebase and get real-time insights directly in your editor
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass rounded-xl p-6 border border-[var(--glass-border)] space-y-3">
                <div className="w-12 h-12 rounded-lg bg-[var(--success)]/20 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-[var(--success)]" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--foreground)]">Visualize & Simulate<br></br>Cost Inline</h3>
                <p className="text-sm text-[var(--foreground-secondary)]">
                  See cost estimates directly in<br></br>your code as you build.
                </p>
              </div>

              <div className="glass rounded-xl p-6 border border-[var(--glass-border)] space-y-3">
                <div className="w-12 h-12 rounded-lg bg-[var(--warning)]/20 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-[var(--warning)]" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--foreground)]">Get Optimization Suggestions</h3>
                <p className="text-sm text-[var(--foreground-secondary)]">
                  Receive smart recommendations to improve your architecture.
                </p>
              </div>

              <div className="glass rounded-xl p-6 border border-[var(--glass-border)] space-y-3">
                <div className="w-12 h-12 rounded-lg bg-[var(--primary)]/20 flex items-center justify-center">
                  <ListOrdered className="w-6 h-6 text-[var(--primary)]" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--foreground)]">Prioritize What<br></br> to Fix First</h3>
                <p className="text-sm text-[var(--foreground-secondary)]">
                  Get actionable insights on which issues to tackle first.
                </p>
              </div>
            </div>
          </section>

        </div>
      </main>


    </div>
  );
}
