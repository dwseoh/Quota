import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { OptimizationManager } from '../optimization/manager';
import { LoopDetector } from '../optimization/detectors/loop_detector';
import { PatternDetector } from '../optimization/detectors/pattern_detector';
import { IacDetector } from '../iac/detector';

suite('Example Project Verification', () => {
  let manager: OptimizationManager;

  suiteSetup(() => {
    manager = OptimizationManager.getInstance();
    manager.registerDetector(new LoopDetector());
    manager.registerDetector(new PatternDetector());
    manager.registerDetector(new IacDetector());
  });

  test('Verify flawed_logic.ts detection', async () => {
    const workspaceRoot = path.resolve(__dirname, '../../../example');
    const fileUri = vscode.Uri.file(path.join(workspaceRoot, 'src/flawed_logic.ts'));
    const document = await vscode.workspace.openTextDocument(fileUri);
    const suggestions = await manager.analyze(document);

    const loopCosts = suggestions.filter(s => s.id?.startsWith('loop-cost'));
    const patterns = suggestions.filter(s => s.id !== undefined && !s.id.startsWith('loop-cost'));

    assert.ok(loopCosts.length >= 2, `expected at least 2 loop-cost suggestions, found ${loopCosts.length}`);

    const hasScan = patterns.some(s => s.id === 'dynamodb-scan');
    const hasGpt4 = patterns.some(s => s.id === 'legacy-gpt4');
    const hasSelectAll = patterns.some(s => s.id === 'sql-select-all');
    assert.ok(hasScan, 'should detect dynamodb scan');
    assert.ok(hasGpt4, 'should detect legacy gpt-4');
    assert.ok(hasSelectAll, 'should detect select *');
  });

  test('Verify deploy.yml detection', async () => {
    const workspaceRoot = path.resolve(__dirname, '../../../example');
    const fileUri = vscode.Uri.file(path.join(workspaceRoot, '.github/workflows/deploy.yml'));
    const document = await vscode.workspace.openTextDocument(fileUri);
    const suggestions = await manager.analyze(document);
    const hasRunner = suggestions.some(s => s.id === 'github-large-runner');
    assert.ok(hasRunner, 'should detect expensive github runner');
  });

  test('Verify main.tf detection', async () => {
    const workspaceRoot = path.resolve(__dirname, '../../../example');
    const fileUri = vscode.Uri.file(path.join(workspaceRoot, 'infra/main.tf'));
    const document = await vscode.workspace.openTextDocument(fileUri);
    const suggestions = await manager.analyze(document);
    const hasGpu = suggestions.some(s => s.id === 'tf-gpu-instance');
    assert.ok(hasGpu, 'should detect expensive gpu instance_type in terraform');
  });
});
