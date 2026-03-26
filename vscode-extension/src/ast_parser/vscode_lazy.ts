/** lazy vscode — only available in extension host */

let vscode: unknown = null;
try {
  vscode = require('vscode');
} catch {
  vscode = null;
}

export function getVscode(): typeof import('vscode') | null {
  return vscode as typeof import('vscode') | null;
}
