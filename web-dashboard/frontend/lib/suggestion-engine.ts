import { ArchitectureNode, Suggestion } from "./types";
import { getComponentById } from "./components-data";
import { generateId } from "./utils";

export function generateSuggestions(
    nodes: ArchitectureNode[]
): Suggestion[] {
    const suggestions: Suggestion[] = [];

    // Rule 1: Check for expensive ML/AI components
    const mlNodes = nodes.filter((n) => n.data.category === "ml");
    mlNodes.forEach((node) => {
        const component = getComponentById(node.data.componentId);
        if (component && component.baseCost && component.baseCost > 50) {
            suggestions.push({
                id: generateId(),
                type: "cost",
                title: "Consider cheaper ML alternatives",
                description: `${component.name} can be expensive at scale. Consider using open-source alternatives or serverless inference.`,
                savings: component.baseCost * 0.4,
                priority: "medium",
            });
        }
    });

    // Rule 2: Check for missing caching layer
    const hasCache = nodes.some((n) => n.data.category === "cache");
    const hasDatabase = nodes.some((n) => n.data.category === "database");
    if (hasDatabase && !hasCache && nodes.length > 3) {
        suggestions.push({
            id: generateId(),
            type: "performance",
            title: "Add caching layer",
            description: "Your architecture would benefit from Redis or Memcached to reduce database load and improve response times.",
            priority: "high",
        });
    }

    // Rule 3: Check for monitoring
    const hasMonitoring = nodes.some((n) => n.data.category === "monitoring");
    if (!hasMonitoring && nodes.length > 4) {
        suggestions.push({
            id: generateId(),
            type: "architecture",
            title: "Add monitoring and observability",
            description: "Consider adding Sentry or DataDog to track errors and performance in production.",
            priority: "medium",
        });
    }

    // Rule 4: Check for expensive hosting with low-cost alternatives
    const hostingNodes = nodes.filter((n) => n.data.category === "hosting");
    hostingNodes.forEach((node) => {
        const component = getComponentById(node.data.componentId);
        if (component && component.baseCost && component.baseCost > 25) {
            suggestions.push({
                id: generateId(),
                type: "cost",
                title: "Consider serverless hosting",
                description: `${component.name} might be overkill. Consider Vercel, Netlify, or Cloud Run for lower costs with auto-scaling.`,
                savings: component.baseCost * 0.5,
                priority: "medium",
            });
        }
    });

    // Rule 5: Check for authentication without database
    const hasAuth = nodes.some((n) => n.data.category === "auth");
    const hasDB = nodes.some((n) => n.data.category === "database");
    if (hasAuth && !hasDB) {
        const authNode = nodes.find((n) => n.data.category === "auth");
        if (authNode?.data.componentId === "jwt") {
            // JWT is fine without DB
        } else {
            suggestions.push({
                id: generateId(),
                type: "architecture",
                title: "Authentication needs database",
                description: "Most auth providers require a database to store user data. Consider adding PostgreSQL or using Supabase Auth.",
                priority: "high",
            });
        }
    }

    // Rule 6: Check for multiple databases (might be over-engineering)
    const databaseNodes = nodes.filter((n) => n.data.category === "database");
    if (databaseNodes.length > 2) {
        suggestions.push({
            id: generateId(),
            type: "architecture",
            title: "Multiple databases detected",
            description: "Having multiple databases can increase complexity. Consider if you really need all of them.",
            priority: "low",
        });
    }

    // Rule 7: Suggest CI/CD if missing
    const hasCICD = nodes.some((n) => n.data.category === "cicd");
    if (!hasCICD && nodes.length > 5) {
        suggestions.push({
            id: generateId(),
            type: "architecture",
            title: "Add CI/CD pipeline",
            description: "Automate your deployments with GitHub Actions or GitLab CI for faster iteration.",
            priority: "low",
        });
    }

    // Rule 8: Check for storage without hosting
    const hasStorage = nodes.some((n) => n.data.category === "storage");
    const hasHosting = nodes.some((n) => n.data.category === "hosting");
    if (hasStorage && !hasHosting) {
        suggestions.push({
            id: generateId(),
            type: "architecture",
            title: "Storage needs hosting",
            description: "You have storage configured but no hosting. Add a hosting provider to serve your application.",
            priority: "high",
        });
    }

    return suggestions;
}
