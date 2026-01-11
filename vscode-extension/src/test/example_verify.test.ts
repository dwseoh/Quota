import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { OptimizationManager } from '../optimization/manager';
import { LoopDetector } from '../optimization/detectors/loop_detector';
import { PatternDetector } from '../optimization/detectors/pattern_detector';

suite('Example Project Verification', () => {
    let manager: OptimizationManager;

    suiteSetup(() => {
        manager = OptimizationManager.getInstance();
        manager.registerDetector(new LoopDetector());
        manager.registerDetector(new PatternDetector());
    });

    test('Verify flawed_logic.ts detection', async () => {
        // Path to the example/src/flawed_logic.ts
        // Assuming test is running from vscode-extension folder
        const workspaceRoot = path.resolve(__dirname, '../../../example');
        const fileUri = vscode.Uri.file(path.join(workspaceRoot, 'src/flawed_logic.ts'));
        
        const document = await vscode.workspace.openTextDocument(fileUri);
        const suggestions = await manager.analyze(document);

        // Expected detections:
        // 1. Loop > openai.chat.completions.create
        // 2. legacy-gpt4 > "gpt-4-32k"
        // 3. Loop > dynamodb.scan (Wait, scan is top level function call in example?, no it is inside badDatabasePractices, not loop)
        //    Actually LoopDetector detects calls INSIDE loops. PatternDetector detects specific calls ANYWHERE.
        //    dynamodb.scan is a PatternDetector rule.
        // 4. sql-select-all > "SELECT * FROM"
        // 5. Loop > fetch (in nestedLoops)

        const loopCosts = suggestions.filter(s => s.title === 'Costly Operation in Loop');
        const patterns = suggestions.filter(s => s.id !== undefined && s.id.startsWith('loop-cost') === false);

        // Debug output
        console.log('Suggestions found:', suggestions.map(s => `${s.id}: ${s.title}`));

        // We expect at least:
        // - openai loop
        // - fetch loop
        assert.ok(loopCosts.length >= 2, `Expected at least 2 loop costs, found ${loopCosts.length}`);

        // We expect patterns:
        // - dynamodb-scan
        // - legacy-gpt4
        // - sql-select-all
        const hasScan = patterns.some(s => s.id === 'dynamodb-scan');
        const hasGPT4 = patterns.some(s => s.id === 'legacy-gpt4');
        const hasSelectAll = patterns.some(s => s.id === 'sql-select-all');

        assert.ok(hasScan, 'Should detect DynamoDB scan');
        assert.ok(hasGPT4, 'Should detect legacy GPT-4');
        assert.ok(hasSelectAll, 'Should detect SELECT *');
    });

    test('Verify deploy.yml detection', async () => {
        const workspaceRoot = path.resolve(__dirname, '../../../example');
        const fileUri = vscode.Uri.file(path.join(workspaceRoot, '.github/workflows/deploy.yml'));
        
        const document = await vscode.workspace.openTextDocument(fileUri);
        const suggestions = await manager.analyze(document);

        const hasRunner = suggestions.some(s => s.id === 'github-large-runner');
        assert.ok(hasRunner, 'Should detect expensive Github runner');
    });

    test('Verify main.tf detection', async () => {
        const workspaceRoot = path.resolve(__dirname, '../../../example');
        const fileUri = vscode.Uri.file(path.join(workspaceRoot, 'infra/main.tf'));
        
        const document = await vscode.workspace.openTextDocument(fileUri);
        const suggestions = await manager.analyze(document);

        const hasGPU = suggestions.some(s => s.id === 'aws-gpu-instance');
        assert.ok(hasGPU, 'Should detect expensive AWS GPU instance');
    });
});
