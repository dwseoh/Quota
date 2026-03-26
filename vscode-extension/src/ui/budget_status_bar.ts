/**
 * status bar: projected monthly cost vs budget + throttled warning near/over budget.
 */

import * as vscode from 'vscode';

export interface BudgetStatusBarController {
  update: (totalCost: number, userCount: number) => void;
}

export function createBudgetStatusBar(context: vscode.ExtensionContext): BudgetStatusBarController {
  let lastBudgetWarnMs = 0;
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  context.subscriptions.push(statusBarItem);

  const update = (totalCost: number, userCount: number) => {
    const config = vscode.workspace.getConfiguration('cost-tracker');
    const budget = config.get<number>('monthlyBudget') || 500;

    const dailyCost = totalCost * userCount;
    const monthlyCost = dailyCost * 30;

    statusBarItem.text = `$(graph) $${monthlyCost.toFixed(2)} / $${budget}`;
    statusBarItem.tooltip = `Projected Monthly Cost: $${monthlyCost.toFixed(2)}\nBudget: $${budget}`;

    if (monthlyCost >= budget) {
      statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
    } else if (monthlyCost >= budget * 0.8) {
      statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    } else {
      statusBarItem.backgroundColor = undefined;
    }

    statusBarItem.show();

    if (monthlyCost >= budget * 0.8) {
      const now = Date.now();
      if (now - lastBudgetWarnMs > 10 * 60 * 1000) {
        lastBudgetWarnMs = now;
        vscode.window.showWarningMessage(
          `Budget Alert: You've reached over 80% of your $${budget} monthly budget!`
        );
      }
    }
  };

  return { update };
}
