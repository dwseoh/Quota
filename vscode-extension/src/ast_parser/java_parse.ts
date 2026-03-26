import * as fs from 'fs';
import * as path from 'path';
import { Parser, Language, Node as TSNode } from 'web-tree-sitter';
import { CodeUnit } from '../types';
import { extractImports } from './imports';
import { initTreeSitter } from './treesitter_runtime';

const JAVA_WASM = path.join(__dirname, '../../wasm/tree-sitter-java.wasm');

// scan nearest pom.xml or build.gradle for dependency group ids.
// walks up from the .java file's directory — group ids match JAVA_PACKAGES prefix keys.
function scanJavaManifest(fromDir: string): string[] {
  let dir = fromDir;
  for (let i = 0; i < 8; i++) {
    try {
      const entries = fs.readdirSync(dir);

      if (entries.includes('pom.xml')) {
        const xml = fs.readFileSync(path.join(dir, 'pom.xml'), 'utf-8');
        // extract all <groupId> values — project's own groupId won't match any provider
        const matches = [...xml.matchAll(/<groupId>([^<]+)<\/groupId>/g)];
        return matches.map(m => m[1].trim());
      }

      const gradle = entries.find(e => e === 'build.gradle' || e === 'build.gradle.kts');
      if (gradle) {
        const src = fs.readFileSync(path.join(dir, gradle), 'utf-8');
        // matches: 'com.openai:openai-java:2.1.0' or "com.openai:openai-java:2.1.0"
        const matches = [...src.matchAll(/['"]([a-zA-Z][\w.-]+:[^'"]+)['"]/g)];
        // return only the group id (part before first colon)
        return matches.map(m => m[1].split(':')[0]);
      }
    } catch { /* skip unreadable dirs */ }

    const parent = path.dirname(dir);
    if (parent === dir) { break; }
    dir = parent;
  }
  return [];
}

let parser: Parser | null = null;
let initPromise: Promise<void> | null = null;

async function initParser(): Promise<void> {
  if (parser) { return; }
  if (initPromise) { return initPromise; }

  initPromise = (async () => {
    await initTreeSitter();
    const Java = await Language.load(JAVA_WASM);
    parser = new Parser();
    parser.setLanguage(Java);
  })();

  return initPromise;
}

function nodeText(node: TSNode, lines: string[]): string {
  return lines.slice(node.startPosition.row, node.endPosition.row + 1).join('\n');
}

export async function getJavaParser(): Promise<Parser | null> {
  try {
    await initParser();
    return parser;
  } catch {
    return null;
  }
}

export async function parseJavaFile(filePath: string): Promise<CodeUnit[]> {
  try {
    await initParser();
  } catch {
    return parseJavaFileBasic(filePath);
  }

  if (!parser) { return parseJavaFileBasic(filePath); }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const imports = [...extractImports(content, '.java'), ...scanJavaManifest(path.dirname(filePath))];
    const tree = parser.parse(content);
    if (!tree) { return parseJavaFileBasic(filePath); }
    const units: CodeUnit[] = [];
    const basename = path.basename(filePath);

    function walk(node: TSNode, className?: string) {
      if (node.type === 'class_declaration' || node.type === 'interface_declaration' || node.type === 'enum_declaration') {
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

        // walk methods inside the class
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

      for (const child of node.children) {
        walk(child, className);
      }
    }

    walk(tree.rootNode);
    return units;
  } catch {
    return parseJavaFileBasic(filePath);
  }
}

// regex fallback — handles simple cases when tree-sitter wasm is unavailable
function parseJavaFileBasic(filePath: string): CodeUnit[] {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const imports = [...extractImports(content, '.java'), ...scanJavaManifest(path.dirname(filePath))];
    const units: CodeUnit[] = [];
    const basename = path.basename(filePath);

    const classRegex = /^\s*(?:public|private|protected|abstract|final|\s)*class\s+(\w+)/;
    const methodRegex = /^\s*(?:public|private|protected|static|final|synchronized|abstract|\s)*[\w<>\[\]]+\s+(\w+)\s*\(/;

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
        if (['if', 'for', 'while', 'switch', 'catch'].includes(name)) { continue; }
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
