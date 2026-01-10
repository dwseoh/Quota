/**
 * treeview_provider.ts - person 3's work area
 * provides sidebar panel for cost tracking and simulation
 */

import * as vscode from 'vscode';
import { llm_call } from './types';

/**
 * tree item types for different sections
 */
type tree_item_type = 'root' | 'summary' | 'calls_section' | 'call_item' | 'simulator_section' | 'simulator_item' | 'action_button';

export class cost_tree_item extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None,
    public readonly item_type: tree_item_type = 'root',
    public readonly call_data?: llm_call
  ) {
    super(label, collapsibleState);
    
    // set icons based on item type
    switch (item_type) {
      case 'summary':
        this.iconPath = new vscode.ThemeIcon('symbol-number');
        break;
      case 'calls_section':
        this.iconPath = new vscode.ThemeIcon('list-unordered');
        break;
      case 'call_item':
        this.iconPath = new vscode.ThemeIcon('symbol-method');
        this.description = call_data ? `line ${call_data.line}` : '';
        // make call items clickable to show details
        this.command = {
          command: 'cost-tracker.showCallDetails',
          title: 'Show Call Details',
          arguments: [this]
        };
        break;
      case 'simulator_section':
        this.iconPath = new vscode.ThemeIcon('graph');
        break;
      case 'simulator_item':
        this.iconPath = new vscode.ThemeIcon('dashboard');
        break;
      case 'action_button':
        this.iconPath = new vscode.ThemeIcon('edit');
        this.command = {
          command: 'cost-tracker.updateUserCount',
          title: 'Update User Count'
        };
        break;
    }
    
    // add context value for right-click menus
    this.contextValue = item_type;
  }
}

export class cost_tree_provider implements vscode.TreeDataProvider<cost_tree_item> {
  private _onDidChangeTreeData: vscode.EventEmitter<cost_tree_item | undefined | null | void> = 
    new vscode.EventEmitter<cost_tree_item | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<cost_tree_item | undefined | null | void> = 
    this._onDidChangeTreeData.event;

  private detected_calls: llm_call[] = [];
  private user_count: number = 100;
  private use_mock_data: boolean = true; // for testing before parser is ready

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
    // if no element, return root level items
    if (!element) {
      return Promise.resolve(this.get_root_items());
    }
    
    // handle children for expandable sections
    switch (element.item_type) {
      case 'calls_section':
        return Promise.resolve(this.get_call_items());
      case 'simulator_section':
        return Promise.resolve(this.get_simulator_items());
      default:
        return Promise.resolve([]);
    }
  }

  /**
   * get root level items (main sections)
   */
  private get_root_items(): cost_tree_item[] {
    const items: cost_tree_item[] = [];
    
    // use mock data if parser isn't ready yet
    const calls = this.use_mock_data ? this.get_mock_data() : this.detected_calls;
    const total_cost = calls.reduce((sum, call) => sum + call.estimated_cost, 0);
    const call_count = calls.length;
    
    // summary section
    items.push(new cost_tree_item(
      `💰 Total: $${total_cost.toFixed(4)} (${call_count} call${call_count !== 1 ? 's' : ''})`,
      vscode.TreeItemCollapsibleState.None,
      'summary'
    ));
    
    // calls section (collapsible)
    if (call_count > 0) {
      items.push(new cost_tree_item(
        `API Calls (${call_count})`,
        vscode.TreeItemCollapsibleState.Expanded,
        'calls_section'
      ));
    } else {
      items.push(new cost_tree_item(
        'No API calls detected',
        vscode.TreeItemCollapsibleState.None,
        'calls_section'
      ));
    }
    
    // scale simulator section (collapsible)
    items.push(new cost_tree_item(
      'Scale Simulator',
      vscode.TreeItemCollapsibleState.Expanded,
      'simulator_section'
    ));
    
    return items;
  }

  /**
   * get individual call items
   */
  private get_call_items(): cost_tree_item[] {
    const calls = this.use_mock_data ? this.get_mock_data() : this.detected_calls;
    
    return calls.map(call => {
      const label = `${call.provider} • ${call.model}: $${call.estimated_cost.toFixed(4)}`;
      return new cost_tree_item(
        label,
        vscode.TreeItemCollapsibleState.None,
        'call_item',
        call
      );
    });
  }

  /**
   * get simulator items
   */
  private get_simulator_items(): cost_tree_item[] {
    const items: cost_tree_item[] = [];
    const calls = this.use_mock_data ? this.get_mock_data() : this.detected_calls;
    const total_cost = calls.reduce((sum, call) => sum + call.estimated_cost, 0);
    
    // current settings
    items.push(new cost_tree_item(
      `Users/day: ${this.user_count}`,
      vscode.TreeItemCollapsibleState.None,
      'simulator_item'
    ));
    
    // projections
    const daily_cost = total_cost * this.user_count;
    const monthly_cost = daily_cost * 30;
    const yearly_cost = daily_cost * 365;
    
    items.push(new cost_tree_item(
      `Daily: $${daily_cost.toFixed(2)}`,
      vscode.TreeItemCollapsibleState.None,
      'simulator_item'
    ));
    
    items.push(new cost_tree_item(
      `Monthly: $${monthly_cost.toFixed(2)}`,
      vscode.TreeItemCollapsibleState.None,
      'simulator_item'
    ));
    
    items.push(new cost_tree_item(
      `Yearly: $${yearly_cost.toFixed(2)}`,
      vscode.TreeItemCollapsibleState.None,
      'simulator_item'
    ));
    
    // action button to update user count
    items.push(new cost_tree_item(
      'Update User Count',
      vscode.TreeItemCollapsibleState.None,
      'action_button'
    ));
    
    return items;
  }

  /**
   * get mock data for testing (remove when parser is ready)
   */
  private get_mock_data(): llm_call[] {
    return [
      {
        line: 5,
        provider: 'openai',
        model: 'gpt-4',
        prompt_text: 'hello world this is a test prompt',
        estimated_tokens: 8,
        estimated_cost: 0.00024
      },
      {
        line: 12,
        provider: 'anthropic',
        model: 'claude-sonnet-4',
        prompt_text: 'another test prompt for anthropic',
        estimated_tokens: 8,
        estimated_cost: 0.000024
      },
      {
        line: 20,
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        prompt_text: 'cheaper model test',
        estimated_tokens: 4,
        estimated_cost: 0.000002
      }
    ];
  }

  /**
   * update detected calls
   */
  update_calls(calls: llm_call[]): void {
    this.detected_calls = calls;
    this.use_mock_data = false; // switch to real data
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
   * toggle mock data (for testing)
   */
  toggle_mock_data(): void {
    this.use_mock_data = !this.use_mock_data;
    this.refresh();
  }

  /**
   * refresh tree view
   */
  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
}
