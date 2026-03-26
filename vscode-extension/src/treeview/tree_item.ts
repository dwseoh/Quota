/**
 * sidebar tree rows: icons, commands, context values.
 */

import * as vscode from 'vscode';
import { llm_call } from '../types';
import { OptimizationSuggestion } from '../optimization/types';

export type tree_item_type =
  | 'root'
  | 'summary'
  | 'calls_section'
  | 'call_item'
  | 'simulator_section'
  | 'simulator_item'
  | 'action_button'
  | 'project_section'
  | 'file_item'
  | 'optimization_section'
  | 'optimization_item';

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

    switch (item_type) {
      case 'summary':
        this.iconPath = new vscode.ThemeIcon('symbol-number', new vscode.ThemeColor('charts.green'));
        break;
      case 'calls_section':
        this.iconPath = new vscode.ThemeIcon('list-unordered');
        break;
      case 'call_item':
        this.iconPath = new vscode.ThemeIcon('symbol-method', new vscode.ThemeColor('quota.icon.normal'));
        this.description = call_data ? `line ${call_data.line}` : '';
        this.command = {
          command: 'quota.jumpToCall',
          title: 'Jump to Call',
          arguments: [call_data]
        };
        break;
      case 'simulator_section':
        this.iconPath = new vscode.ThemeIcon('graph');
        break;
      case 'simulator_item':
        if (label.includes('daily') || label.includes('monthly') || label.includes('yearly')) {
          this.iconPath = new vscode.ThemeIcon('calendar');
        } else if (label.toLowerCase().includes('bankrupt') || label.toLowerCase().includes('budget')) {
          if (label.includes('🔥') || label.includes('💸')) {
            this.iconPath = new vscode.ThemeIcon('clock', new vscode.ThemeColor('charts.red'));
          } else if (label.includes('⚠️')) {
            this.iconPath = new vscode.ThemeIcon('clock', new vscode.ThemeColor('charts.yellow'));
          } else if (label.includes('✅')) {
            this.iconPath = new vscode.ThemeIcon('clock', new vscode.ThemeColor('charts.green'));
          } else {
            this.iconPath = new vscode.ThemeIcon('clock');
          }
        } else {
          this.iconPath = new vscode.ThemeIcon('dashboard');
        }
        break;
      case 'action_button':
        this.iconPath = new vscode.ThemeIcon('edit');
        this.command = {
          command: 'quota.updateUserCount',
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
      case 'optimization_item': {
        const impact = optimization_data?.costImpact;
        if (impact === 'Critical') {
          this.iconPath = new vscode.ThemeIcon('warning', new vscode.ThemeColor('quota.icon.critical'));
        } else if (impact === 'High') {
          this.iconPath = new vscode.ThemeIcon('warning', new vscode.ThemeColor('quota.icon.high'));
        } else {
          this.iconPath = new vscode.ThemeIcon('info', new vscode.ThemeColor('quota.icon.normal'));
        }
        this.description = optimization_data?.costImpact ? `${optimization_data.costImpact} Impact` : '';
        this.command = {
          command: 'quota.jumpToSuggestion',
          title: 'Jump to Code',
          arguments: [optimization_data]
        };
        this.tooltip = `${optimization_data?.title}\n${optimization_data?.description}`;
        break;
      }
    }

    this.contextValue = item_type;
  }
}
