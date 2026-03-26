import * as fs from 'fs';
import * as path from 'path';
import { Parser, Language, Node as TSNode } from 'web-tree-sitter';
import { CodeUnit } from '../types';
import { extractImports } from './imports';
import { initTreeSitter } from './treesitter_runtime';

const CSHARP_WASM = path.join(__dirname, '../../wasm/tree-sitter-csharp.wasm');

let parser: Parser | null = null;
let initPromise: Promise<void> | null = null;

async function initParser(): Promise<void> {
  if (parser) { return; }
  if (initPromise) { return initPromise; }

  initPromise = (async () => {
    await initTreeSitter();
    const CSharp = await Language.load(CSHARP_WASM);
    parser = new Parser();
    parser.setLanguage(CSharp);
  })();

  return initPromise;
}

export async function getCSharpParser(): Promise<Parser | null> {
  try {
    await initParser();
    return parser;
  } catch {
    return null;
  }
}

// scan nearest .csproj for <PackageReference Include="..." /> entries.
// walks up from the .cs file's directory until a .csproj is found or root is reached.
function scanCsproj(fromDir: string): string[] {
  let dir = fromDir;
  for (let i = 0; i < 8; i++) {
    try {
      const entries = fs.readdirSync(dir);
      const csproj = entries.find(e => e.endsWith('.csproj'));
      if (csproj) {
        const xml = fs.readFileSync(path.join(dir, csproj), 'utf-8');
        const matches = [...xml.matchAll(/<PackageReference\s+Include="([^"]+)"/g)];
        return matches.map(m => m[1]);
      }
    } catch { /* skip unreadable dirs */ }
    const parent = path.dirname(dir);
    if (parent === dir) { break; }
    dir = parent;
  }
  return [];
}

function nodeText(node: TSNode, lines: string[]): string {
  return lines.slice(node.startPosition.row, node.endPosition.row + 1).join('\n');
}

export async function parseCSharpFile(filePath: string): Promise<CodeUnit[]> {
  try {
    await initParser();
  } catch {
    return parseCSharpFileBasic(filePath);
  }

  if (!parser) { return parseCSharpFileBasic(filePath); }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const usingImports = extractImports(content, '.cs');
    const csprojPackages = scanCsproj(path.dirname(filePath));
    const imports = [...usingImports, ...csprojPackages];

    const tree = parser.parse(content);
    if (!tree) { return parseCSharpFileBasic(filePath); }

    const units: CodeUnit[] = [];
    const basename = path.basename(filePath);

    function walk(node: TSNode, className?: string) {
      if (
        node.type === 'class_declaration' ||
        node.type === 'interface_declaration' ||
        node.type === 'struct_declaration' ||
        node.type === 'record_declaration'
      ) {
        const nameNode = node.childForFieldName('name');
        const name = nameNode?.text ?? 'Unknown';
        const startLine = node.startPosition.row + 1;
        const endLine = node.endPosition.row + 1;

        units.push({
          id: `${basename}:${startLine}:${name}`,
          type: 'class',
          name,
          body: nodeText(node, lines),
          dependencies: imports,
          location: { fileUri: filePath, startLine, startColumn: node.startPosition.column, endLine, endColumn: node.endPosition.column },
        });

        for (const child of node.children) {
          walk(child, name);
        }
        return;
      }

      if (node.type === 'method_declaration' || node.type === 'constructor_declaration') {
        const nameNode = node.childForFieldName('name');
        const name = nameNode?.text ?? 'unknown';
        const qualifiedName = className ? `${className}.${name}` : name;
        const startLine = node.startPosition.row + 1;
        const endLine = node.endPosition.row + 1;

        units.push({
          id: `${basename}:${startLine}:${qualifiedName}`,
          type: 'method',
          name: qualifiedName,
          body: nodeText(node, lines),
          dependencies: imports,
          location: { fileUri: filePath, startLine, startColumn: node.startPosition.column, endLine, endColumn: node.endPosition.column },
        });
        return;
      }

      // recurse into namespaces and other containers
      for (const child of node.children) {
        walk(child, className);
      }
    }

    walk(tree.rootNode);
    return units;
  } catch {
    return parseCSharpFileBasic(filePath);
  }
}

// regex fallback for when tree-sitter wasm is unavailable
function parseCSharpFileBasic(filePath: string): CodeUnit[] {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const usingImports = extractImports(content, '.cs');
    const csprojPackages = scanCsproj(path.dirname(filePath));
    const imports = [...usingImports, ...csprojPackages];
    const units: CodeUnit[] = [];
    const basename = path.basename(filePath);

    const classRegex = /^\s*(?:public|private|protected|internal|abstract|sealed|static|\s)*class\s+(\w+)/;
    const methodRegex = /^\s*(?:public|private|protected|internal|static|async|virtual|override|abstract|\s)*[\w<>\[\]?]+\s+(\w+)\s*\(/;

    let currentClass = '';

    for (let i = 0; i < lines.length; i++) {
      const classMatch = lines[i].match(classRegex);
      if (classMatch) {
        currentClass = classMatch[1];
        const startLine = i + 1;
        let depth = 0, endLine = startLine;
        for (let j = i; j < lines.length; j++) {
          for (const ch of lines[j]) {
            if (ch === '{') { depth++; }
            if (ch === '}') { depth--; }
          }
          if (depth === 0 && j > i) { endLine = j + 1; break; }
        }
        units.push({
          id: `${basename}:${startLine}:${currentClass}`,
          type: 'class',
          name: currentClass,
          body: lines.slice(i, endLine).join('\n'),
          dependencies: imports,
          location: { fileUri: filePath, startLine, startColumn: 0, endLine, endColumn: 0 },
        });
        continue;
      }

      const methodMatch = lines[i].match(methodRegex);
      if (methodMatch && currentClass) {
        const name = methodMatch[1];
        if (['if', 'for', 'while', 'foreach', 'switch', 'catch', 'using'].includes(name)) { continue; }
        const startLine = i + 1;
        let depth = 0, endLine = startLine;
        for (let j = i; j < lines.length; j++) {
          for (const ch of lines[j]) {
            if (ch === '{') { depth++; }
            if (ch === '}') { depth--; }
          }
          if (depth === 0 && j > i) { endLine = j + 1; break; }
        }
        const qualifiedName = `${currentClass}.${name}`;
        units.push({
          id: `${basename}:${startLine}:${qualifiedName}`,
          type: 'method',
          name: qualifiedName,
          body: lines.slice(i, endLine).join('\n'),
          dependencies: imports,
          location: { fileUri: filePath, startLine, startColumn: 0, endLine, endColumn: 0 },
        });
      }
    }

    return units;
  } catch {
    return [];
  }
}
