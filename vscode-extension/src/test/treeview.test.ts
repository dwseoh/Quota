import * as assert from 'assert';
import * as vscode from 'vscode';
import { cost_tree_provider, cost_tree_item } from '../treeview_provider';
import { OptimizationSuggestion } from '../optimization/types';

suite('TreeView Expansion Integration', () => {
    test('TreeView handles Optimization Suggestions', async () => {
        const provider = new cost_tree_provider();
        
        // Mock suggestion
        const suggestions: OptimizationSuggestion[] = [{
            id: 'test-opt',
            title: 'Test Optimization',
            description: 'Fix this',
            severity: 'warning',
            costImpact: 'High',
            location: {
                fileUri: 'file:///test.ts',
                startLine: 1, startColumn: 1, endLine: 1, endColumn: 10
            }
        }];

        // Inject suggestions
        provider.update_suggestions(suggestions);

        // Get children (root)
        const roots = await provider.getChildren();
        
        // Verify "Optimization & Infra" section exists
        const optSection = roots.find(r => r.label && r.label.toString().includes('Optimization & Infra'));
        assert.ok(optSection, 'Optimization section should be present');
        assert.strictEqual(optSection?.collapsibleState, vscode.TreeItemCollapsibleState.Expanded);

        // Get children of Optimization section
        const items = await provider.getChildren(optSection);
        assert.strictEqual(items.length, 1);
        assert.strictEqual(items[0].label, 'Test Optimization');
        assert.strictEqual(items[0].item_type, 'optimization_item');
    });

    test('TreeView shows "No optimizations" when empty', async () => {
        const provider = new cost_tree_provider();
        provider.update_suggestions([]);

        const roots = await provider.getChildren();
        const optSection = roots.find(r => r.label && r.label.toString().includes('Optimization & Infra'));
        
        const items = await provider.getChildren(optSection);
        assert.strictEqual(items.length, 1);
        assert.strictEqual(items[0].label, 'No optimizations found');
    });
});
