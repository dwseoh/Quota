import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function validateConnection(
    sourceType: string,
    targetType: string
): boolean {
    // Define valid connection rules
    const validConnections: Record<string, string[]> = {
        frontend: ["backend", "database", "hosting", "auth", "storage"],
        backend: ["database", "cache", "queue", "ml", "storage", "auth"],
        database: ["cache", "backup"],
        hosting: [], // hosting is usually a target, not a source
        ml: ["storage", "database"],
        auth: ["database"],
        cache: [],
        queue: ["backend"],
        storage: [],
        cicd: ["hosting"],
        monitoring: [], // can connect to anything
        search: ["database"],
    };

    return validConnections[sourceType]?.includes(targetType) ?? true;
}
