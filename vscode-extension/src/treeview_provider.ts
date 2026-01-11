/**
 * treeview_provider.ts - person 3's work area
 * provides sidebar panel for cost tracking and simulation
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { llm_call, CodespaceGraph } from './types';

/**
 * tree item types for different sections
 */
type tree_item_type = 'root' | 'summary' | 'calls_section' | 'call_item' | 'simulator_section' | 'simulator_item' | 'action_button' | 'project_section' | 'file_item';

export class cost_tree_item extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None,
    public readonly item_type: tree_item_type = 'root',
    public readonly call_data?: llm_call,
    public readonly file_path?: string
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
        // make call items clickable to jump to code location
        this.command = {
          command: 'cost-tracker.jumpToCall',
          title: 'Jump to Call',
          arguments: [call_data]
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
      case 'project_section':
        this.iconPath = new vscode.ThemeIcon('project');
        break;
      case 'file_item':
        this.iconPath = new vscode.ThemeIcon('file-code');
        this.command = {
             command: 'vscode.open',
             title: 'Open File',
             arguments: [vscode.Uri.file(file_path || '')]
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
  private project_graph: CodespaceGraph | null = null;
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
      case 'project_section':
        return Promise.resolve(this.get_project_items());
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

    // Project Analysis Section
    // Always show it to verify UI, even if data is missing
    items.push(new cost_tree_item(
        'Project Analysis',
        vscode.TreeItemCollapsibleState.Expanded,
        'project_section'
    ));
    
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
   * get project analysis items
   */
  private get_project_items(): cost_tree_item[] {
      if (!this.project_graph) { 
          return [new cost_tree_item(
              'No analysis data available',
              vscode.TreeItemCollapsibleState.None,
              'summary'
          )]; 
      }

      const items: cost_tree_item[] = [];
      const fileCosts = new Map<string, number>();

      // Aggregate costs per file
      // In a real implementation we would iterate through all units and classifications
      // For now, we'll just look at the units in the graph that are classified as paid APIs
      
      for (const unit of this.project_graph.units) {
          const classification = this.project_graph.classifications[unit.id];
          if (classification && classification.role === 'consumer' && classification.category === 'llm') {
              // Quick cost estimation (simplistic for demo)
              const cost = 0.001; // Placeholder cost per call
              const filePath = unit.location.fileUri;
              fileCosts.set(filePath, (fileCosts.get(filePath) || 0) + cost);
          }
      }

      // Sort files by cost
      const sortedFiles = Array.from(fileCosts.entries())
          .sort(([, costA], [, costB]) => costB - costA)
          .slice(0, 5); // Top 5

      items.push(new cost_tree_item(
          `Files Indexed: ${this.project_graph.files.length}`,
          vscode.TreeItemCollapsibleState.None,
          'summary'
      ));

      for (const [filePath, cost] of sortedFiles) {
          items.push(new cost_tree_item(
              `${path.basename(filePath)} ($${cost.toFixed(3)})`,
              vscode.TreeItemCollapsibleState.None,
              'file_item',
              undefined,
              filePath
          ));
      }

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
   * update project graph
   */
  update_project(graph: CodespaceGraph): void {
      // console.log(`🌲 TreeProvider: Received graph with ${graph.files.length} files and ${graph.units.length} units`);
      this.project_graph = graph;
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
   * get current user count
   */
  get_user_count(): number {
    return this.user_count;
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
