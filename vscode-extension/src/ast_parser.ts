/**
 * ast_parser.ts - AST Parser Module
 * ts/js: vscode symbol provider → @typescript-eslint/parser fallback
 * python: subprocess ast parser → regex fallback
 */

import * as fs from 'fs';
import * as path from 'path';
import { execFile } from 'child_process';
import { parse as parseTypeScript } from '@typescript-eslint/parser';
import { CodeUnit, ContextBundle } from './types';

// try to import vscode (only available in extension context)
let vscode: any = null;
try {
    vscode = require('vscode');
} catch {
    vscode = null;
}

// python script passed via -c; uses ast module (python 3.8+).
// chr(10) is used for newline joins to avoid string escaping issues in the template literal.
const PYTHON_EXTRACT_SCRIPT = `import ast, json, sys

def extract(fp):
    with open(fp, 'r', encoding='utf-8', errors='replace') as f:
        src = f.read()
    lines = src.splitlines()
    try:
        tree = ast.parse(src, filename=fp)
    except SyntaxError:
        print(json.dumps({'units': [], 'imports': []}))
        return
    imps = []
    for n in ast.walk(tree):
        if isinstance(n, (ast.Import, ast.ImportFrom)):
            seg = ast.get_source_segment(src, n)
            if seg:
                imps.append(seg)
    units = []
    for n in tree.body:
        if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef)):
            body = chr(10).join(lines[n.lineno - 1:n.end_lineno])
            units.append({'type': 'function', 'name': n.name, 'startLine': n.lineno, 'endLine': n.end_lineno, 'body': body})
        elif isinstance(n, ast.ClassDef):
            body = chr(10).join(lines[n.lineno - 1:n.end_lineno])
            units.append({'type': 'class', 'name': n.name, 'startLine': n.lineno, 'endLine': n.end_lineno, 'body': body})
            for m in n.body:
                if isinstance(m, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    body = chr(10).join(lines[m.lineno - 1:m.end_lineno])
                    units.append({'type': 'method', 'name': n.name + '.' + m.name, 'startLine': m.lineno, 'endLine': m.end_lineno, 'body': body})
    print(json.dumps({'units': units, 'imports': imps}))

extract(sys.argv[1])`;

// cached python binary name — undefined = not yet tested, null = not available
let cachedPythonBin: string | null | undefined = undefined;

async function findPythonBin(): Promise<string | null> {
    if (cachedPythonBin !== undefined) return cachedPythonBin;
    for (const bin of ['python3', 'python']) {
        const found = await new Promise<boolean>(resolve => {
            execFile(bin, ['--version'], { timeout: 3000 }, (err) => resolve(!err));
        });
        if (found) {
            cachedPythonBin = bin;
            return bin;
        }
    }
    cachedPythonBin = null;
    return null;
}

async function parsePythonWithSubprocess(filePath: string): Promise<CodeUnit[]> {
    const bin = await findPythonBin();
    if (!bin) throw new Error('python not found');

    const imports = extractImports(fs.readFileSync(filePath, 'utf-8'), '.py');

    const stdout = await new Promise<string>((resolve, reject) => {
        execFile(bin, ['-c', PYTHON_EXTRACT_SCRIPT, filePath], {
            timeout: 10000,
            maxBuffer: 10 * 1024 * 1024,
        }, (err, out) => {
            if (err) reject(err);
            else resolve(out);
        });
    });

    const result: { units: Array<{ type: string; name: string; startLine: number; endLine: number; body: string }>, imports: string[] } = JSON.parse(stdout);
    const basename = path.basename(filePath);

    return result.units.map(u => ({
        id: `${basename}:${u.startLine}:${u.name}`,
        type: u.type as 'function' | 'class' | 'method',
        name: u.name,
        body: u.body,
        dependencies: result.imports.length > 0 ? result.imports : imports,
        location: {
            fileUri: filePath,
            startLine: u.startLine,
            startColumn: 0,
            endLine: u.endLine,
            endColumn: 0,
        },
    }));
}

async function parsePythonFile(filePath: string): Promise<CodeUnit[]> {
    try {
        return await parsePythonWithSubprocess(filePath);
    } catch {
        return parsePythonFileBasic(filePath);
    }
}

/**
 * parse a file and extract code units
 */
export async function parseFile(filePath: string): Promise<CodeUnit[]> {
    const ext = path.extname(filePath);

    if (ext === '.py') {
        return parsePythonFile(filePath);
    }

    // ts/js: try vscode symbol provider, fall back to typescript-eslint
    if (vscode) {
        try {
            return await parseFileWithVSCode(filePath);
        } catch {
            // silently fall through
        }
    }

    if (ext === '.ts' || ext === '.js' || ext === '.tsx' || ext === '.jsx') {
        return parseTypeScriptFile(filePath);
    }

    return [];
}

/**
 * parse file using vscode's DocumentSymbolProvider
 */
async function parseFileWithVSCode(filePath: string): Promise<CodeUnit[]> {
    const uri = vscode.Uri.file(filePath);
    const document = await vscode.workspace.openTextDocument(uri);

    const symbols = await vscode.commands.executeCommand(
        'vscode.executeDocumentSymbolProvider',
        uri
    ) as any[];

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
    const units: CodeUnit[] = [];
    const SymbolKind = vscode.SymbolKind;

    const isFunction = symbol.kind === SymbolKind.Function;
    const isMethod   = symbol.kind === SymbolKind.Method;
    const isClass    = symbol.kind === SymbolKind.Class;

    if (isFunction || isMethod) {
        const unit = createCodeUnitFromSymbol(symbol, document, filePath, imports, 'function');
        if (unit) units.push(unit);
    } else if (isClass) {
        const classUnit = createCodeUnitFromSymbol(symbol, document, filePath, imports, 'class');
        if (classUnit) units.push(classUnit);

        if (symbol.children) {
            for (const child of symbol.children) {
                if (child.kind === SymbolKind.Method) {
                    const methodUnit = createCodeUnitFromSymbol(child, document, filePath, imports, 'method', symbol.name);
                    if (methodUnit) units.push(methodUnit);
                }
            }
        }
    }

    if (symbol.children) {
        for (const child of symbol.children) {
            if (isClass && child.kind === SymbolKind.Method) continue;
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

function parseTypeScriptFile(filePath: string): CodeUnit[] {
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
                    if (unit) units.push(unit);
                } else if (node.type === 'ClassDeclaration' && node.id) {
                    units.push(...extractClassFromNode(node, content, filePath, imports));
                } else if (node.type === 'ExportNamedDeclaration' && node.declaration) {
                    if (node.declaration.type === 'FunctionDeclaration' && node.declaration.id) {
                        const unit = extractFunctionFromNode(node.declaration, content, filePath, imports);
                        if (unit) units.push(unit);
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
    if (!node.loc || !node.id) return null;

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
    if (!node.loc || !node.id) return units;

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

// regex-based python fallback — used when python3 is not available
function parsePythonFileBasic(filePath: string): CodeUnit[] {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        const units: CodeUnit[] = [];
        const imports = extractImports(content, '.py');
        const defRegex = /^(async\s+)?def\s+(\w+)\s*\(/;
        const classRegex = /^class\s+(\w+)/;

        for (let i = 0; i < lines.length; i++) {
            const trimmed = lines[i].trim();
            const indent = lines[i].search(/\S/);

            const funcMatch = trimmed.match(defRegex);
            if (funcMatch) {
                const name = funcMatch[2];
                const startLine = i + 1;
                let endLine = startLine;
                for (let j = i + 1; j < lines.length; j++) {
                    if (lines[j].trim() && lines[j].search(/\S/) <= indent) { endLine = j; break; }
                    endLine = j + 1;
                }
                units.push({
                    id: `${path.basename(filePath)}:${startLine}:${name}`,
                    type: 'function',
                    name,
                    body: lines.slice(i, endLine).join('\n'),
                    dependencies: imports,
                    location: { fileUri: filePath, startLine, startColumn: 0, endLine, endColumn: lines[endLine - 1]?.length || 0 },
                });
            }

            const classMatch = trimmed.match(classRegex);
            if (classMatch) {
                const name = classMatch[1];
                const startLine = i + 1;
                let endLine = startLine;
                for (let j = i + 1; j < lines.length; j++) {
                    if (lines[j].trim() && lines[j].search(/\S/) <= indent) { endLine = j; break; }
                    endLine = j + 1;
                }
                units.push({
                    id: `${path.basename(filePath)}:${startLine}:${name}`,
                    type: 'class',
                    name,
                    body: lines.slice(i, endLine).join('\n'),
                    dependencies: imports,
                    location: { fileUri: filePath, startLine, startColumn: 0, endLine, endColumn: lines[endLine - 1]?.length || 0 },
                });
            }
        }

        return units;
    } catch {
        return [];
    }
}

function extractImports(content: string, ext: string): string[] {
    const imports: string[] = [];
    for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (ext === '.py') {
            if (trimmed.startsWith('import ') || trimmed.startsWith('from ')) {
                imports.push(trimmed);
            }
        } else {
            if (trimmed.startsWith('import ') || trimmed.startsWith('export ') || trimmed.includes('require(')) {
                imports.push(trimmed);
            }
        }
    }
    return imports;
}

/**
 * bundle code unit with context
 */
export function bundleContext(unit: CodeUnit): ContextBundle {
    return {
        code: unit.body,
        imports: unit.dependencies.join('\n'),
        location: unit.location,
    };
}
