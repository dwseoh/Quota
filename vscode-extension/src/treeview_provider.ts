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
import { OptimizationSuggestion } from './optimization/types';

/**
 * tree item types for different sections
 */
type tree_item_type = 'root' | 'summary' | 'calls_section' | 'call_item' | 'simulator_section' | 'simulator_item' | 'action_button' | 'project_section' | 'file_item' | 'optimization_section' | 'optimization_item';

export class cost_tree_item extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None,
    public readonly item_type: tree_item_type = 'root',
    public readonly call_data?: llm_call,
    public readonly file_path?: string,
    public readonly optimization_data?: OptimizationSuggestion
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
      case 'optimization_section':
        this.iconPath = new vscode.ThemeIcon('lightbulb');
        break;
      case 'optimization_item':
        const severity = optimization_data?.severity;
        if (severity === 'critical' || severity === 'warning') {
            this.iconPath = new vscode.ThemeIcon('warning');
        } else {
            this.iconPath = new vscode.ThemeIcon('info');
        }
        this.description = optimization_data?.costImpact ? `${optimization_data.costImpact} Impact` : '';
        this.command = {
            command: 'cost-tracker.jumpToSuggestion',
            title: 'Jump to Code',
            arguments: [optimization_data]
        };
        // Context menu to show details if needed
        this.tooltip = `${optimization_data?.title}\n${optimization_data?.description}`;
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
  private suggestions: OptimizationSuggestion[] = [];
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
    try {
        // if no element, return root level items
        if (!element) {
          // console.log('🌲 getChildren(root)');
          return Promise.resolve(this.get_root_items());
        }
        
        // console.log(`🌲 getChildren(${element.label}, type=${element.item_type})`);

        // handle children for expandable sections
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
        console.error('🔥 Error in getChildren:', error);
        vscode.window.showErrorMessage(`Tree Error: ${error}`);
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
    const total_cost = this.use_mock_data 
        ? calls.reduce((sum, call) => sum + call.estimated_cost, 0) 
        : this.total_cost_cache;
    const call_count = calls.length;
    
    // summary section
    items.push(new cost_tree_item(
      `💰 Total: $${total_cost.toFixed(4)}`,
      vscode.TreeItemCollapsibleState.None,
      'summary'
    ));
    
    // calls section (collapsible)
    items.push(new cost_tree_item(
        `API Calls (${call_count})`,
        call_count > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
        'calls_section'
    ));

    // Optimization & Infra Section
    const optCount = this.suggestions.length;
    items.push(new cost_tree_item(
        `Optimization & Infra (${optCount})`,
        optCount > 0 ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None,
        'optimization_section'
    ));

    // Project Analysis Section
    items.push(new cost_tree_item(
        'Project Analysis',
        vscode.TreeItemCollapsibleState.Collapsed,
        'project_section'
    ));
    
    // scale simulator section (collapsible)
    items.push(new cost_tree_item(
      'Scale Simulator',
      vscode.TreeItemCollapsibleState.Collapsed,
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
    
    items.push(new cost_tree_item(
      `Monthly Projected: $${monthly_cost.toFixed(2)}`,
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

      items.push(new cost_tree_item(
          `Files Indexed: ${this.project_graph.files.length}`,
          vscode.TreeItemCollapsibleState.None,
          'summary'
      ));

      if (this.top_expensive_files.length === 0) {
         items.push(new cost_tree_item(
             'No cost data yet',
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

  // Cached display data
  private top_expensive_files: { path: string; cost: number }[] = [];
  private total_cost_cache: number = 0;

  /**
   * Batch update all data to prevent multiple refreshes
   */
  update_all_data(calls: llm_call[], graph: CodespaceGraph, suggestions: OptimizationSuggestion[]) {
      this.detected_calls = calls;
      this.use_mock_data = false;
      this.project_graph = graph;
      this.suggestions = suggestions;
      
      this.recalculate_stats();
      this.refresh();
  }

  /**
   * Pre-calculate expensive metrics
   */
  private recalculate_stats() {
      // 1. Total Cost
      this.total_cost_cache = this.detected_calls.reduce((sum, call) => sum + call.estimated_cost, 0);

      // 2. Top Files (previously in get_project_items)
      if (!this.project_graph) return;
      
      const fileCosts = new Map<string, number>();
      // Use the pre-calculated calls list instead of re-traversing the graph if possible
      // Or if we want graph-based breadth:
      for (const call of this.detected_calls) {
          if (call.file_path) {
             fileCosts.set(call.file_path, (fileCosts.get(call.file_path) || 0) + call.estimated_cost);
          }
      }

      this.top_expensive_files = Array.from(fileCosts.entries())
          .sort(([, costA], [, costB]) => costB - costA)
          .slice(0, 5) // Top 5
          .map(([path, cost]) => ({ path, cost }));
          
      // 3. Sort Suggestions by Impact
      const severityWeight = {
          'critical': 5,
          'warning': 4,
          'info': 1
      };
      
      const impactWeight = {
          'High': 3,
          'Medium': 2,
          'Low': 1
      };
      
      this.suggestions.sort((a, b) => {
          // Primary sort: Severity (Critical > Warning > Info)
          // Note: OptimizationSuggestion type uses 'severity' field (string)
          const sevA = severityWeight[a.severity as keyof typeof severityWeight] || 0;
          const sevB = severityWeight[b.severity as keyof typeof severityWeight] || 0;
          
          if (sevA !== sevB) return sevB - sevA;
          
          // Secondary sort: Impact (High > Med > Low)
          const impA = impactWeight[a.costImpact as keyof typeof impactWeight] || 0;
          const impB = impactWeight[b.costImpact as keyof typeof impactWeight] || 0;
          
          return impB - impA;
      });
  }

  update_calls(calls: llm_call[]): void {
    this.detected_calls = calls;
    this.use_mock_data = false;
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
