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

// ===== Sandbox API =====

export interface SandboxCreate {
    projectName: string;
    description?: string;
    architectureJson: any;
}

export interface SandboxResponse {
    sandboxId: string;
    projectName: string;
    description?: string;
    architectureJson: any;
    techStack: string[];
    totalCost: number;
    createdAt: string;
    updatedAt: string;
    isPublic: boolean;
    views: number;
}

export interface SandboxListItem {
    sandboxId: string;
    projectName: string;
    description?: string;
    techStack: string[];
    totalCost: number;
    createdAt: string;
    views: number;
}

/**
 * Publish a new sandbox
 */
export async function publishSandbox(data: SandboxCreate): Promise<SandboxResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/sandboxes`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Publish sandbox API error:", error);
        throw error;
    }
}

/**
 * Get a sandbox by ID
 */
export async function getSandbox(sandboxId: string): Promise<SandboxResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/sandboxes/${sandboxId}`);

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error("Sandbox not found");
            }
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Get sandbox API error:", error);
        throw error;
    }
}

/**
 * List public sandboxes
 */
export async function listSandboxes(params?: {
    search?: string;
    techStack?: string;
    minCost?: number;
    maxCost?: number;
    limit?: number;
    skip?: number;
}): Promise<SandboxListItem[]> {
    try {
        const queryParams = new URLSearchParams();
        if (params?.search) queryParams.append("search", params.search);
        if (params?.techStack) queryParams.append("tech_stack", params.techStack);
        if (params?.minCost !== undefined) queryParams.append("min_cost", params.minCost.toString());
        if (params?.maxCost !== undefined) queryParams.append("max_cost", params.maxCost.toString());
        if (params?.limit) queryParams.append("limit", params.limit.toString());
        if (params?.skip) queryParams.append("skip", params.skip.toString());

        const url = `${API_BASE_URL}/sandboxes${queryParams.toString() ? `?${queryParams}` : ""}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("List sandboxes API error:", error);
        throw error;
    }
}
