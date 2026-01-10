/**
 * treeview_provider.ts - person 3's work area
 * provides sidebar panel for cost tracking and simulation
 */

import * as vscode from 'vscode';
import { llm_call } from './types';

export class cost_tree_item extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None
  ) {
    super(label, collapsibleState);
  }
}

export class cost_tree_provider implements vscode.TreeDataProvider<cost_tree_item> {
  private _onDidChangeTreeData: vscode.EventEmitter<cost_tree_item | undefined | null | void> = 
    new vscode.EventEmitter<cost_tree_item | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<cost_tree_item | undefined | null | void> = 
    this._onDidChangeTreeData.event;

  private detected_calls: llm_call[] = [];
  private user_count: number = 100;

  /**
   * get tree item
   */
  getTreeItem(element: cost_tree_item): vscode.TreeItem {
    return element;
  }

  /**
   * get children for tree view
   */
  getChildren(element?: cost_tree_item): Thenable<cost_tree_item[]> {
    // TODO: implement tree structure
    // 1. show total cost at top
    // 2. list each detected call with model and cost
    // 3. add scale simulator section
    // 4. show projected monthly cost based on user_count
    
    const items: cost_tree_item[] = [];
    
    // calculate total
    const total_cost = this.detected_calls.reduce((sum, call) => sum + call.estimated_cost, 0);
    items.push(new cost_tree_item(`total: $${total_cost.toFixed(4)}`));
    
    // list calls
    for (const call of this.detected_calls) {
      items.push(new cost_tree_item(`${call.model}: $${call.estimated_cost.toFixed(4)}`));
    }
    
    // simulator section
    items.push(new cost_tree_item('--- scale simulator ---'));
    const monthly_cost = total_cost * this.user_count * 30;
    items.push(new cost_tree_item(`at ${this.user_count} users/day: $${monthly_cost.toFixed(2)}/month`));
    
    return Promise.resolve(items);
  }

  /**
   * update detected calls
   */
  update_calls(calls: llm_call[]): void {
    this.detected_calls = calls;
    this.refresh();
  }

  /**
   * update user count for simulation
   */
  update_user_count(count: number): void {
    this.user_count = count;
    this.refresh();
  }

  /**
   * refresh tree view
   */
  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
}
