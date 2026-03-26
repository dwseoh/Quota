import * as path from 'path';
import { CodeUnit } from '../types';
import { extractImports } from './imports';
import { parseTypeScriptFile } from './typescript_parse';
import { getVscode } from './vscode_lazy';

export async function parseFileWithVSCode(filePath: string): Promise<CodeUnit[]> {
  const vscode = getVscode();
  if (!vscode) {
    throw new Error('vscode unavailable');
  }

  const uri = vscode.Uri.file(filePath);
  const document = await vscode.workspace.openTextDocument(uri);

  const symbols = await vscode.commands.executeCommand(
    'vscode.executeDocumentSymbolProvider',
    uri
  ) as unknown[];

  if (!symbols || symbols.length === 0) {
    const ext = path.extname(filePath);
    if (ext === '.ts' || ext === '.js' || ext === '.tsx' || ext === '.jsx') {
      return parseTypeScriptFile(filePath);
    }
    return [];
  }

  const content = document.getText();
  const imports = extractImports(content, path.extname(filePath));
  const units: CodeUnit[] = [];

  for (const symbol of symbols) {
    units.push(...extractUnitsFromSymbol(symbol, document, filePath, imports));
  }

  return units;
}

function extractUnitsFromSymbol(symbol: any, document: any, filePath: string, imports: string[]): CodeUnit[] {
  const vscode = getVscode();
  if (!vscode) {
    return [];
  }

  const units: CodeUnit[] = [];
  const SymbolKind = vscode.SymbolKind;

  const isFunction = symbol.kind === SymbolKind.Function;
  const isMethod = symbol.kind === SymbolKind.Method;
  const isClass = symbol.kind === SymbolKind.Class;

  if (isFunction || isMethod) {
    const unit = createCodeUnitFromSymbol(symbol, document, filePath, imports, 'function');
    if (unit) {
      units.push(unit);
    }
  } else if (isClass) {
    const classUnit = createCodeUnitFromSymbol(symbol, document, filePath, imports, 'class');
    if (classUnit) {
      units.push(classUnit);
    }

    if (symbol.children) {
      for (const child of symbol.children) {
        if (child.kind === SymbolKind.Method) {
          const methodUnit = createCodeUnitFromSymbol(child, document, filePath, imports, 'method', symbol.name);
          if (methodUnit) {
            units.push(methodUnit);
          }
        }
      }
    }
  }

  if (symbol.children) {
    for (const child of symbol.children) {
      if (isClass && child.kind === SymbolKind.Method) {
        continue;
      }
      units.push(...extractUnitsFromSymbol(child, document, filePath, imports));
    }
  }

  return units;
}

function createCodeUnitFromSymbol(
  symbol: any,
  document: any,
  filePath: string,
  imports: string[],
  type: 'function' | 'class' | 'method',
  className?: string
): CodeUnit | null {
  try {
    const range = symbol.range;
    const body = document.getText(range);
    const name = className ? `${className}.${symbol.name}` : symbol.name;
    const id = `${path.basename(filePath)}:${range.start.line + 1}:${name}`;

    return {
      id,
      type,
      name,
      body,
      dependencies: imports,
      location: {
        fileUri: filePath,
        startLine: range.start.line + 1,
        startColumn: range.start.character,
        endLine: range.end.line + 1,
        endColumn: range.end.character,
      },
    };
  } catch {
    return null;
  }
}
