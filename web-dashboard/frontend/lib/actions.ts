"use server";

import { revalidatePath } from "next/cache";

const API_BASE_URL = process.env.API_URL || "http://localhost:8000";

export async function getSandboxes() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/sandboxes`, {
            cache: 'no-store', // Ensure we get fresh data
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch sandboxes: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Failed to fetch sandboxes:", error);
        return [];
    }
}
