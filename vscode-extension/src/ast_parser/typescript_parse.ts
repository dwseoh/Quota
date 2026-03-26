import * as fs from 'fs';
import * as path from 'path';
import { parse as parseTypeScript } from '@typescript-eslint/parser';
import { CodeUnit } from '../types';
import { extractImports } from './imports';

export function parseTypeScriptFile(filePath: string): CodeUnit[] {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const ast = parseTypeScript(content, {
      ecmaVersion: 2020,
      sourceType: 'module',
      loc: true,
      range: true,
    });

    const units: CodeUnit[] = [];
    const imports = extractImports(content, path.extname(filePath));

    if (ast.body) {
      for (const node of ast.body) {
        if (node.type === 'FunctionDeclaration' && node.id) {
          const unit = extractFunctionFromNode(node, content, filePath, imports);
          if (unit) {
            units.push(unit);
          }
        } else if (node.type === 'ClassDeclaration' && node.id) {
          units.push(...extractClassFromNode(node, content, filePath, imports));
        } else if (node.type === 'ExportNamedDeclaration' && node.declaration) {
          if (node.declaration.type === 'FunctionDeclaration' && node.declaration.id) {
            const unit = extractFunctionFromNode(node.declaration, content, filePath, imports);
            if (unit) {
              units.push(unit);
            }
          } else if (node.declaration.type === 'ClassDeclaration' && node.declaration.id) {
            units.push(...extractClassFromNode(node.declaration, content, filePath, imports));
          }
        }
      }
    }

    return units;
  } catch {
    return [];
  }
}

function extractFunctionFromNode(node: any, content: string, filePath: string, imports: string[]): CodeUnit | null {
  if (!node.loc || !node.id) {
    return null;
  }

  const lines = content.split('\n');
  const body = lines.slice(node.loc.start.line - 1, node.loc.end.line).join('\n');
  const name = node.id.name;

  return {
    id: `${path.basename(filePath)}:${node.loc.start.line}:${name}`,
    type: 'function',
    name,
    body,
    dependencies: imports,
    location: {
      fileUri: filePath,
      startLine: node.loc.start.line,
      startColumn: node.loc.start.column,
      endLine: node.loc.end.line,
      endColumn: node.loc.end.column,
    },
  };
}

function extractClassFromNode(node: any, content: string, filePath: string, imports: string[]): CodeUnit[] {
  const units: CodeUnit[] = [];
  if (!node.loc || !node.id) {
    return units;
  }

  const lines = content.split('\n');
  const className = node.id.name;

  units.push({
    id: `${path.basename(filePath)}:${node.loc.start.line}:${className}`,
    type: 'class',
    name: className,
    body: lines.slice(node.loc.start.line - 1, node.loc.end.line).join('\n'),
    dependencies: imports,
    location: {
      fileUri: filePath,
      startLine: node.loc.start.line,
      startColumn: node.loc.start.column,
      endLine: node.loc.end.line,
      endColumn: node.loc.end.column,
    },
  });

  if (node.body?.body) {
    for (const member of node.body.body) {
      if (member.type === 'MethodDefinition' && member.key && member.value?.loc) {
        const methodName = member.key.name || member.key.value;
        units.push({
          id: `${path.basename(filePath)}:${member.value.loc.start.line}:${className}.${methodName}`,
          type: 'method',
          name: `${className}.${methodName}`,
          body: lines.slice(member.value.loc.start.line - 1, member.value.loc.end.line).join('\n'),
          dependencies: imports,
          location: {
            fileUri: filePath,
            startLine: member.value.loc.start.line,
            startColumn: member.value.loc.start.column,
            endLine: member.value.loc.end.line,
            endColumn: member.value.loc.end.column,
          },
        });
      }
    }
  }

  return units;
}
