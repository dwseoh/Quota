/**
 * TreeDataProvider for the quota sidebar: calls, simulator, project stats, optimizations.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { llm_call, CodespaceGraph } from '../types';
import { OptimizationSuggestion } from '../optimization/types';
import { cost_tree_item } from './tree_item';

export class cost_tree_provider implements vscode.TreeDataProvider<cost_tree_item> {
  private _onDidChangeTreeData: vscode.EventEmitter<cost_tree_item | undefined | null | void> =
    new vscode.EventEmitter<cost_tree_item | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<cost_tree_item | undefined | null | void> =
    this._onDidChangeTreeData.event;

  private detected_calls: llm_call[] = [];
  private suggestions: OptimizationSuggestion[] = [];
  private project_graph: CodespaceGraph | null = null;
  private user_count: number = 100;

  private top_expensive_files: { path: string; cost: number }[] = [];
  private total_cost_cache: number = 0;

  getTreeItem(element: cost_tree_item): vscode.TreeItem {
    return element;
  }

  getChildren(element?: cost_tree_item): Thenable<cost_tree_item[]> {
    try {
      if (!element) {
        return Promise.resolve(this.get_root_items());
      }

      switch (element.item_type) {
        case 'calls_section':
          return Promise.resolve(this.get_call_items());
        case 'simulator_section':
          return Promise.resolve(this.get_simulator_items());
        case 'project_section':
          return Promise.resolve(this.get_project_items());
        case 'optimization_section':
          return Promise.resolve(this.get_optimization_items());
        default:
          return Promise.resolve([]);
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Tree Error: ${error}`);
      return Promise.resolve([]);
    }
  }

  private get_root_items(): cost_tree_item[] {
    const items: cost_tree_item[] = [];

    const calls = this.detected_calls;
    const total_cost = this.total_cost_cache;
    const call_count = calls.length;

    items.push(new cost_tree_item(
      `💰 total (per run): $${total_cost.toFixed(4)}`,
      vscode.TreeItemCollapsibleState.None,
      'summary'
    ));

    items.push(new cost_tree_item(
      `API Calls (${call_count})`,
      call_count > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
      'calls_section'
    ));

    const optCount = this.suggestions.length;
    items.push(new cost_tree_item(
      `Optimization & Infra (${optCount})`,
      optCount > 0 ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None,
      'optimization_section'
    ));

    items.push(new cost_tree_item(
      'Project Analysis',
      vscode.TreeItemCollapsibleState.Collapsed,
      'project_section'
    ));

    items.push(new cost_tree_item(
      'Scale Simulator',
      vscode.TreeItemCollapsibleState.Collapsed,
      'simulator_section'
    ));

    return items;
  }

  private get_call_items(): cost_tree_item[] {
    const calls = this.detected_calls;

    calls.sort((a, b) => (b.estimated_cost ?? -1) - (a.estimated_cost ?? -1));

    return calls.map(call => {
      const costStr = call.estimated_cost !== null ? `$${call.estimated_cost.toFixed(4)}` : 'unknown model';
      const modelStr = call.model ?? 'model not specified';
      const label = `${modelStr} • ${costStr}`;
      return new cost_tree_item(
        label,
        vscode.TreeItemCollapsibleState.None,
        'call_item',
        call
      );
    });
  }

  private get_optimization_items(): cost_tree_item[] {
    if (this.suggestions.length === 0) {
      return [new cost_tree_item('No optimizations found', vscode.TreeItemCollapsibleState.None, 'optimization_item')];
    }

    return this.suggestions.map(suggestion => {
      return new cost_tree_item(
        suggestion.title,
        vscode.TreeItemCollapsibleState.None,
        'optimization_item',
        undefined,
        undefined,
        suggestion
      );
    });
  }

  private get_simulator_items(): cost_tree_item[] {
    const items: cost_tree_item[] = [];
    const total_cost = this.total_cost_cache;

    items.push(new cost_tree_item(
      `users/day: ${this.user_count}`,
      vscode.TreeItemCollapsibleState.None,
      'simulator_item'
    ));

    const daily_cost = total_cost * this.user_count;
    const monthly_cost = daily_cost * 30;
    const yearly_cost = daily_cost * 365;

    items.push(new cost_tree_item(
      `daily projected: $${daily_cost.toFixed(2)}`,
      vscode.TreeItemCollapsibleState.None,
      'simulator_item'
    ));

    items.push(new cost_tree_item(
      `monthly projected: $${monthly_cost.toFixed(2)}`,
      vscode.TreeItemCollapsibleState.None,
      'simulator_item'
    ));

    items.push(new cost_tree_item(
      `yearly projected: $${yearly_cost.toFixed(2)}`,
      vscode.TreeItemCollapsibleState.None,
      'simulator_item'
    ));

    const config = vscode.workspace.getConfiguration('quota');
    const budget = config.get<number>('monthlyBudget') || 500;

    let bankruptcyText = '';

    if (daily_cost === 0) {
      bankruptcyText = 'Time to Bankruptcy: ∞ (Safe)';
    } else {
      const days_remaining = budget / daily_cost;
      const days_rounded = Math.floor(days_remaining);

      if (days_rounded < 1) {
        bankruptcyText = 'budget drained in < 1 day!';
      } else if (days_rounded < 7) {
        bankruptcyText = `budget drains in: ${days_rounded} days`;
      } else if (days_rounded < 30) {
        bankruptcyText = `budget drains in: ${days_rounded} days`;
      } else {
        bankruptcyText = 'budget safe (>30 days)';
      }
    }

    items.push(new cost_tree_item(
      bankruptcyText,
      vscode.TreeItemCollapsibleState.None,
      'simulator_item'
    ));

    items.push(new cost_tree_item(
      'update user count',
      vscode.TreeItemCollapsibleState.None,
      'action_button'
    ));

    return items;
  }

  private get_project_items(): cost_tree_item[] {
    if (!this.project_graph) {
      return [new cost_tree_item(
        'No analysis data available',
        vscode.TreeItemCollapsibleState.None,
        'summary'
      )];
    }

    const items: cost_tree_item[] = [];

    items.push(new cost_tree_item(
      `files indexed: ${this.project_graph.files.length}`,
      vscode.TreeItemCollapsibleState.None,
      'summary'
    ));

    if (this.top_expensive_files.length === 0) {
      items.push(new cost_tree_item(
        'no cost data yet',
        vscode.TreeItemCollapsibleState.None,
        'summary'
      ));
    }

    for (const file of this.top_expensive_files) {
      items.push(new cost_tree_item(
        `${path.basename(file.path)} ($${file.cost.toFixed(3)})`,
        vscode.TreeItemCollapsibleState.None,
        'file_item',
        undefined,
        file.path
      ));
    }

    return items;
  }

  update_all_data(calls: llm_call[], graph: CodespaceGraph, suggestions: OptimizationSuggestion[]) {
    this.detected_calls = calls;
    this.project_graph = graph;
    this.suggestions = suggestions;

    this.recalculate_stats();
    this.refresh();
  }

  private recalculate_stats() {
    this.total_cost_cache = this.detected_calls.reduce((sum, call) => sum + (call.estimated_cost ?? 0), 0);

    if (!this.project_graph) {
      return;
    }

    const fileCosts = new Map<string, number>();
    for (const call of this.detected_calls) {
      if (call.file_path) {
        fileCosts.set(call.file_path, (fileCosts.get(call.file_path) || 0) + (call.estimated_cost ?? 0));
      }
    }

    this.top_expensive_files = Array.from(fileCosts.entries())
      .sort(([, costA], [, costB]) => costB - costA)
      .slice(0, 5)
      .map(([p, cost]) => ({ path: p, cost }));

    const severityWeight = {
      critical: 5,
      warning: 4,
      info: 1
    };

    const impactWeight = {
      Critical: 4,
      High: 3,
      Medium: 2,
      Low: 1
    };

    this.suggestions.sort((a, b) => {
      const sevA = severityWeight[a.severity as keyof typeof severityWeight] || 0;
      const sevB = severityWeight[b.severity as keyof typeof severityWeight] || 0;

      if (sevA !== sevB) {
        return sevB - sevA;
      }

      const impA = impactWeight[a.costImpact as keyof typeof impactWeight] || 0;
      const impB = impactWeight[b.costImpact as keyof typeof impactWeight] || 0;

      return impB - impA;
    });
  }

  update_calls(calls: llm_call[]): void {
    this.detected_calls = calls;
    this.recalculate_stats();
    this.refresh();
  }

  update_suggestions(suggestions: OptimizationSuggestion[]) {
    this.suggestions = suggestions;
    this.refresh();
  }

  update_project(graph: CodespaceGraph): void {
    this.project_graph = graph;
    this.recalculate_stats();
    this.refresh();
  }

  update_user_count(count: number): void {
    this.user_count = count;
    this.refresh();
  }

  get_user_count(): number {
    return this.user_count;
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
}
