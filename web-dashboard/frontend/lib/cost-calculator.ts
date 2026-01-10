import { ArchitectureNode, Scope, CostBreakdown, CostEstimate } from "./types";
import { getComponentById } from "./components-data";

export function calculateCosts(
    nodes: ArchitectureNode[],
    scope: Scope
): CostEstimate {
    const breakdown: CostBreakdown[] = [];

    for (const node of nodes) {
        const component = getComponentById(node.data.componentId);
        if (!component) continue;

        const baseCost = component.baseCost || 0;

        // Calculate scaled cost based on scope
        let scaledCost = baseCost;

        // Apply user multiplier (rough estimate)
        const userMultiplier = Math.log10(scope.users + 1) / 2;

        // Apply traffic multiplier
        const trafficMultiplier = scope.trafficLevel / 3;

        // Apply data volume multiplier (per GB)
        const dataMultiplier = scope.dataVolumeGB / 100;

        // Apply region multiplier
        const regionMultiplier = scope.regions > 1 ? scope.regions * 0.3 : 1;

        // Different categories scale differently
        switch (node.data.category) {
            case "hosting":
                scaledCost = baseCost + (baseCost * userMultiplier) + (baseCost * trafficMultiplier);
                break;
            case "database":
                scaledCost = baseCost + (baseCost * userMultiplier) + (dataMultiplier * 10);
                break;
            case "ml":
                scaledCost = baseCost + (baseCost * trafficMultiplier * 2);
                break;
            case "cache":
            case "queue":
                scaledCost = baseCost + (baseCost * trafficMultiplier);
                break;
            case "storage":
                scaledCost = baseCost + (dataMultiplier * 5);
                break;
            case "monitoring":
            case "search":
                scaledCost = baseCost + (baseCost * userMultiplier * 0.5);
                break;
            default:
                scaledCost = baseCost;
        }

        // Apply region multiplier to all
        scaledCost *= regionMultiplier;

        // Apply availability multiplier (higher availability = higher cost)
        if (scope.availability > 99) {
            scaledCost *= 1.2;
        }
        if (scope.availability > 99.9) {
            scaledCost *= 1.5;
        }

        breakdown.push({
            category: node.data.category,
            component: node.data.label,
            componentId: node.data.componentId,
            baseCost,
            scaledCost: Math.max(scaledCost, 0),
        });
    }

    const total = breakdown.reduce((sum, item) => sum + item.scaledCost, 0);

    return {
        total,
        breakdown,
    };
}

export function estimateMonthlyCost(
    nodes: ArchitectureNode[],
    scope: Scope
): number {
    const estimate = calculateCosts(nodes, scope);
    return estimate.total;
}
