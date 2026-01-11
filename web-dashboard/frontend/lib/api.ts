import { generateId } from "./utils";

const API_BASE_URL = "http://localhost:8000/api";

import { Scope } from "./types";

export interface ChatResponse {
    message: string;
    session_id: string;
    suggest_implementation: boolean;
    updated_architecture?: any;
    updated_scope?: Partial<Scope>;
    canvas_action?: "update" | "clear" | "none";
}

export interface ImplementResponse {
    updated_architecture: any;
    explanation: string;
}

/**
 * Send a message to the backend chat API
 */
export async function sendChatMessage(
    message: string,
    sessionId?: string,
    currentArchitecture?: any,
    chatWidth?: number
): Promise<ChatResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message,
                session_id: sessionId,
                architecture_json: currentArchitecture,
                chat_width: chatWidth || 600,  // Increased default width
            }),
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Chat API error:", error);
        throw error;
    }
}

/**
 * Request architecture implementation
 */
export async function implementArchitecture(
    request: string,
    sessionId: string,
    currentArchitecture: any
): Promise<ImplementResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/chat/implement`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                implementation_request: request,
                session_id: sessionId,
                architecture_json: currentArchitecture,
            }),
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Implementation API error:", error);
        throw error;
    }
}

/**
 * Clear chat session
 */
export async function clearSession(sessionId: string): Promise<void> {
    try {
        const response = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        console.error("Clear session API error:", error);
        throw error;
    }
}
