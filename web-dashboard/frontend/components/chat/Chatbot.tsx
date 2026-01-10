"use client";

import React, { useState } from "react";
import { useArchitectureStore } from "@/lib/store";
import { Send, Bot, User } from "lucide-react";
import { generateId } from "@/lib/utils";

export default function Chatbot() {
    const { chatMessages, addChatMessage } = useArchitectureStore();
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);

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
        setInput("");
        setIsTyping(true);

        // Simulate AI response (placeholder - RAG to be implemented later)
        setTimeout(() => {
            const aiMessage = {
                id: generateId(),
                role: "assistant" as const,
                content: "I'm a placeholder chatbot. RAG implementation coming soon! For now, I can help you understand the architecture sandbox. Try dragging components from the left sidebar to the canvas.",
                timestamp: Date.now(),
            };
            addChatMessage(aiMessage);
            setIsTyping(false);
        }, 1000);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-[var(--border)]">
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
                                            ? "bg-[var(--primary)] text-white"
                                            : "glass border border-[var(--glass-border)] text-[var(--foreground)]"
                                        }`}
                                >
                                    <p className="text-sm">{message.content}</p>
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
