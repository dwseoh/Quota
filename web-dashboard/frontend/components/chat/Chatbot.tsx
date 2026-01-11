"use client";

import React, { useState, useRef, useEffect } from "react";
import { useArchitectureStore } from "@/lib/store";
import { Send, Bot, User, Trash2 } from "lucide-react";
import { generateId } from "@/lib/utils";
import { sendChatMessage, clearSession } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Chatbot() {
    const {
        chatMessages, addChatMessage, sessionId, setSessionId,
        nodes, edges, scope, clearChat, setNodes, setEdges, updateScope
    } = useArchitectureStore();
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when messages change or typing indicator appears
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages, isTyping]);

    const handleClear = async () => {
        if (chatMessages.length === 0) return;

        if (confirm("Are you sure you want to clear the conversation history?")) {
            try {
                if (sessionId) {
                    await clearSession(sessionId);
                }
                clearChat();
            } catch (error) {
                console.error("Failed to clear session:", error);
                // Still clear local chat if backend fails
                clearChat();
            }
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        // Add user message
        const userMessage = {
            id: generateId(),
            role: "user" as const,
            content: input,
            timestamp: Date.now(),
        };
        addChatMessage(userMessage);
        const currentInput = input;
        setInput("");
        setIsTyping(true);

        try {
            // Include current architecture context
            const currentArchitecture = {
                nodes,
                edges,
                scope
            };

            // Measure chat width
            const chatWidth = chatContainerRef.current?.offsetWidth || 400;

            // Call backend API with chat width
            const response = await sendChatMessage(
                currentInput,
                sessionId,
                currentArchitecture,
                chatWidth
            );

            // Update session ID if new
            if (response.session_id && response.session_id !== sessionId) {
                setSessionId(response.session_id);
            }

            // Log the full response for debugging
            console.log("📦 Backend Response:", response);

            // Add AI response
            const aiMessage = {
                id: generateId(),
                role: "assistant" as const,
                content: response.message,
                timestamp: Date.now(),
            };
            addChatMessage(aiMessage);

            // Handle canvas actions
            if (response.canvas_action === "update" && response.updated_architecture) {
                // Update the architecture on the canvas
                setNodes(response.updated_architecture.nodes || []);
                setEdges(response.updated_architecture.edges || []);
                console.log("✅ Canvas updated with new architecture");
            } else if (response.canvas_action === "clear") {
                // Clear the canvas
                setNodes([]);
                setEdges([]);

                console.log("🗑️ Canvas cleared");
            }

            // Handle scope updates
            if (response.updated_scope) {
                updateScope(response.updated_scope);
                console.log("📊 Scope updated:", response.updated_scope);
            }
        } catch (error) {
            console.error("Failed to get chat response:", error);
            const errorMessage = {
                id: generateId(),
                role: "assistant" as const,
                content: "Sorry, I'm having trouble connecting to the backend. Is it running?",
                timestamp: Date.now(),
            };
            addChatMessage(errorMessage);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div ref={chatContainerRef} className="flex flex-col h-full">
            <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
                <div>
                    <div className="flex items-center gap-2">
                        <Bot className="w-5 h-5 text-[var(--primary)]" />
                        <h3 className="text-sm font-semibold text-[var(--foreground)]">
                            AI Assistant
                        </h3>
                    </div>
                    <p className="text-xs text-[var(--foreground-secondary)] mt-1">
                        Ask questions about your architecture
                    </p>
                </div>
                {chatMessages.length > 0 && (
                    <button
                        onClick={handleClear}
                        className="p-1.5 rounded-lg hover:bg-[var(--background-tertiary)] text-[var(--foreground-secondary)] hover:text-[var(--destructive)] transition-colors"
                        title="Clear conversation"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.length === 0 ? (
                    <div className="text-center py-8">
                        <Bot className="w-12 h-12 mx-auto mb-3 text-[var(--primary)]" />
                        <p className="text-sm text-[var(--foreground-secondary)]">
                            Start a conversation to get architecture advice
                        </p>
                        <div className="mt-4 space-y-2">
                            <button
                                onClick={() => setInput("How should I structure my backend?")}
                                className="block w-full text-left px-3 py-2 rounded-lg bg-[var(--background-tertiary)] hover:bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--foreground)] transition-colors"
                            >
                                💡 How should I structure my backend?
                            </button>
                            <button
                                onClick={() => setInput("What's the best database for my use case?")}
                                className="block w-full text-left px-3 py-2 rounded-lg bg-[var(--background-tertiary)] hover:bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--foreground)] transition-colors"
                            >
                                💾 What's the best database for my use case?
                            </button>
                            <button
                                onClick={() => setInput("How can I reduce costs?")}
                                className="block w-full text-left px-3 py-2 rounded-lg bg-[var(--background-tertiary)] hover:bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--foreground)] transition-colors"
                            >
                                💰 How can I reduce costs?
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {chatMessages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"
                                    }`}
                            >
                                {message.role === "assistant" && (
                                    <div className="w-8 h-8 rounded-full bg-[var(--primary)]/20 flex items-center justify-center flex-shrink-0">
                                        <Bot className="w-4 h-4 text-[var(--primary)]" />
                                    </div>
                                )}
                                <div
                                    className={`max-w-[80%] px-4 py-2 rounded-xl ${message.role === "user"
                                        ? "bg-[#99f6e4] text-black"
                                        : "glass border border-[var(--glass-border)] text-[var(--foreground)]"
                                        }`}
                                >
                                    <div className="text-sm prose prose-sm max-w-none prose-invert">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                // Custom styling for markdown elements
                                                code: (props: any) => {
                                                    const { children, className, node, inline, ...rest } = props;

                                                    // Robust inline detection
                                                    // 1. If inline prop is explicitly boolean, trust it
                                                    // 2. Fallback: check if content has newlines (block) or language class (block)
                                                    let isInline = inline;

                                                    if (typeof isInline !== 'boolean') {
                                                        const content = String(children).trim();
                                                        const hasNewlines = content.includes('\n');
                                                        const hasLangClass = /language-(\w+)/.test(className || "");
                                                        isInline = !hasNewlines && !hasLangClass;
                                                    }

                                                    return isInline ? (
                                                        <code className="px-1.5 py-0.5 rounded bg-black/20 text-[var(--accent)] font-mono text-xs" {...rest}>
                                                            {children}
                                                        </code>
                                                    ) : (
                                                        <code className="block px-3 py-2 rounded-lg bg-black/30 text-[var(--foreground)] font-mono text-xs overflow-x-auto my-2" {...rest}>
                                                            {children}
                                                        </code>
                                                    );
                                                },
                                                pre: ({ children }) => <div className="my-2">{children}</div>,
                                                ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>,
                                                ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>,
                                                li: ({ children }) => <li className="text-sm">{children}</li>,
                                                p: ({ children }) => <p className="my-1">{children}</p>,
                                                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                                em: ({ children }) => <em className="italic">{children}</em>,
                                                a: ({ children, href }) => (
                                                    <a href={href} className="text-[var(--accent)] hover:underline" target="_blank" rel="noopener noreferrer">
                                                        {children}
                                                    </a>
                                                ),
                                            }}
                                        >
                                            {message.content}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                                {message.role === "user" && (
                                    <div className="w-8 h-8 rounded-full bg-[var(--accent)]/20 flex items-center justify-center flex-shrink-0">
                                        <User className="w-4 h-4 text-[var(--accent)]" />
                                    </div>
                                )}
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-[var(--primary)]/20 flex items-center justify-center flex-shrink-0">
                                    <Bot className="w-4 h-4 text-[var(--primary)]" />
                                </div>
                                <div className="glass border border-[var(--glass-border)] px-4 py-2 rounded-xl">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 rounded-full bg-[var(--foreground-secondary)] animate-pulse" />
                                        <div className="w-2 h-2 rounded-full bg-[var(--foreground-secondary)] animate-pulse delay-100" />
                                        <div className="w-2 h-2 rounded-full bg-[var(--foreground-secondary)] animate-pulse delay-200" />
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Invisible element to scroll to */}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-[var(--border)]">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSend()}
                        placeholder="Ask about your architecture..."
                        className="flex-1 px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className="px-4 py-2 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
