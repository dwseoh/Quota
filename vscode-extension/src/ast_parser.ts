/**
 * ast_parser.ts - AST Parser Module (Hybrid Version)
 * Works both in VSCode extension and standalone scripts
 * Uses VSCode API when available, falls back to @typescript-eslint/parser
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse as parseTypeScript } from '@typescript-eslint/parser';
import { CodeUnit, LocationMetadata, ContextBundle } from './types';

// Try to import vscode (only available in extension context)
let vscode: any = null;
try {
    vscode = require('vscode');
} catch {
    // VSCode not available - we're running standalone
    vscode = null;
}

/**
 * Parse a file and extract code units
 * @param filePath - path to file
 * @returns array of code units
 */
export async function parseFile(filePath: string): Promise<CodeUnit[]> {
    const ext = path.extname(filePath);

    // Use VSCode API if available (best option)
    if (vscode) {
        try {
            return await parseFileWithVSCode(filePath);
        } catch (error) {
            console.warn(`VSCode API failed, falling back to TypeScript parser:`, error);
        }
    }

    // Fallback to TypeScript parser (works for .ts, .js, .py with limited support)
    if (ext === '.ts' || ext === '.js' || ext === '.tsx' || ext === '.jsx') {
        return parseTypeScriptFile(filePath);
    } else if (ext === '.py') {
        // For Python, we can only do basic regex extraction without tree-sitter
        return parsePythonFileBasic(filePath);
    }

    return [];
}

/**
 * Parse file using VSCode's DocumentSymbolProvider
 */
async function parseFileWithVSCode(filePath: string): Promise<CodeUnit[]> {
    const uri = vscode.Uri.file(filePath);
    const document = await vscode.workspace.openTextDocument(uri);

    const symbols = await vscode.commands.executeCommand(
        'vscode.executeDocumentSymbolProvider',
        uri
    ) as any[];

    if (!symbols || symbols.length === 0) {
        // VSCode symbol provider returned nothing - fallback to language-specific parsers
        const ext = path.extname(filePath);
        console.log(`⚠️ VSCode returned no symbols for ${path.basename(filePath)}, using fallback parser`);
        
        if (ext === '.py') {
            return parsePythonFileBasic(filePath);
        } else if (ext === '.ts' || ext === '.js' || ext === '.tsx' || ext === '.jsx') {
            return parseTypeScriptFile(filePath);
        }
        
        return [];
    }

    const content = document.getText();
    const imports = extractImports(content, path.extname(filePath));
    const units: CodeUnit[] = [];

    for (const symbol of symbols) {
        const symbolUnits = extractUnitsFromSymbol(symbol, document, filePath, imports);
        units.push(...symbolUnits);
    }

    return units;
}

/**
 * Extract units from VSCode DocumentSymbol
 */
function extractUnitsFromSymbol(
    symbol: any,
    document: any,
    filePath: string,
    imports: string[]
): CodeUnit[] {
    const units: CodeUnit[] = [];
    const SymbolKind = vscode.SymbolKind;

    const isFunction = symbol.kind === SymbolKind.Function;
    const isMethod = symbol.kind === SymbolKind.Method;
    const isClass = symbol.kind === SymbolKind.Class;

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
            const childUnits = extractUnitsFromSymbol(child, document, filePath, imports);
            units.push(...childUnits);
        }
    }

    return units;
}

/**
 * Create CodeUnit from VSCode symbol
 */
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
                endColumn: range.end.character
            }
        };
    } catch (error) {
        return null;
    }
}

/**
 * Parse TypeScript/JavaScript file using @typescript-eslint/parser
 */
function parseTypeScriptFile(filePath: string): CodeUnit[] {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const ast = parseTypeScript(content, {
            ecmaVersion: 2020,
            sourceType: 'module',
            loc: true,
            range: true
        });

        const units: CodeUnit[] = [];
        const imports = extractImports(content, path.extname(filePath));

        if (ast.body) {
            for (const node of ast.body) {
                if (node.type === 'FunctionDeclaration' && node.id) {
                    const unit = extractFunctionFromNode(node, content, filePath, imports);
                    if (unit) units.push(unit);
                } else if (node.type === 'ClassDeclaration' && node.id) {
                    const classUnits = extractClassFromNode(node, content, filePath, imports);
                    units.push(...classUnits);
                } else if (node.type === 'ExportNamedDeclaration' && node.declaration) {
                    if (node.declaration.type === 'FunctionDeclaration' && node.declaration.id) {
                        const unit = extractFunctionFromNode(node.declaration, content, filePath, imports);
                        if (unit) units.push(unit);
                    } else if (node.declaration.type === 'ClassDeclaration' && node.declaration.id) {
                        const classUnits = extractClassFromNode(node.declaration, content, filePath, imports);
                        units.push(...classUnits);
                    }
                }
            }
        }

        return units;
    } catch (error) {
        console.error(`Error parsing TypeScript file ${filePath}:`, error);
        return [];
    }
}

/**
 * Extract function from AST node
 */
function extractFunctionFromNode(node: any, content: string, filePath: string, imports: string[]): CodeUnit | null {
    if (!node.loc || !node.id) return null;

    const lines = content.split('\n');
    const body = lines.slice(node.loc.start.line - 1, node.loc.end.line).join('\n');
    const name = node.id.name;
    const id = `${path.basename(filePath)}:${node.loc.start.line}:${name}`;

    return {
        id,
        type: 'function',
        name,
        body,
        dependencies: imports,
        location: {
            fileUri: filePath,
            startLine: node.loc.start.line,
            startColumn: node.loc.start.column,
            endLine: node.loc.end.line,
            endColumn: node.loc.end.column
        }
    };
}

/**
 * Extract class and methods from AST node
 */
function extractClassFromNode(node: any, content: string, filePath: string, imports: string[]): CodeUnit[] {
    const units: CodeUnit[] = [];
    if (!node.loc || !node.id) return units;

    const lines = content.split('\n');
    const className = node.id.name;

    // Extract class itself
    const classBody = lines.slice(node.loc.start.line - 1, node.loc.end.line).join('\n');
    units.push({
        id: `${path.basename(filePath)}:${node.loc.start.line}:${className}`,
        type: 'class',
        name: className,
        body: classBody,
        dependencies: imports,
        location: {
            fileUri: filePath,
            startLine: node.loc.start.line,
            startColumn: node.loc.start.column,
            endLine: node.loc.end.line,
            endColumn: node.loc.end.column
        }
    });

    // Extract methods
    if (node.body && node.body.body) {
        for (const member of node.body.body) {
            if (member.type === 'MethodDefinition' && member.key && member.value.loc) {
                const methodName = member.key.name || member.key.value;
                const methodBody = lines.slice(member.value.loc.start.line - 1, member.value.loc.end.line).join('\n');

                units.push({
                    id: `${path.basename(filePath)}:${member.value.loc.start.line}:${className}.${methodName}`,
                    type: 'method',
                    name: `${className}.${methodName}`,
                    body: methodBody,
                    dependencies: imports,
                    location: {
                        fileUri: filePath,
                        startLine: member.value.loc.start.line,
                        startColumn: member.value.loc.start.column,
                        endLine: member.value.loc.end.line,
                        endColumn: member.value.loc.end.column
                    }
                });
            }
        }
    }

    return units;
}

/**
 * Parse Python file using basic regex (fallback when tree-sitter not available)
 */
function parsePythonFileBasic(filePath: string): CodeUnit[] {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        const units: CodeUnit[] = [];
        const imports = extractImports(content, '.py');

        console.log(`🐍 Python parsing: ${path.basename(filePath)} (${lines.length} lines)`);
        console.log(`   Imports found: ${imports.length}`);

        // Match function definitions: def function_name(
        const functionRegex = /^(async\s+)?def\s+(\w+)\s*\(/;
        // Match class definitions: class ClassName
        const classRegex = /^class\s+(\w+)/;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            // Function
            const funcMatch = trimmed.match(functionRegex);
            if (funcMatch) {
                console.log(`   ✅ Found function: ${funcMatch[2]} at line ${i + 1}`);
                const name = funcMatch[2];
                const startLine = i + 1;
                // Find end of function (next def/class or dedent)
                let endLine = startLine;
                const indent = line.search(/\S/);
                for (let j = i + 1; j < lines.length; j++) {
                    const nextLine = lines[j];
                    if (nextLine.trim() && nextLine.search(/\S/) <= indent) {
                        endLine = j;
                        break;
                    }
                    endLine = j + 1;
                }

                const body = lines.slice(i, endLine).join('\n');
                units.push({
                    id: `${path.basename(filePath)}:${startLine}:${name}`,
                    type: 'function',
                    name,
                    body,
                    dependencies: imports,
                    location: {
                        fileUri: filePath,
                        startLine,
                        startColumn: 0,
                        endLine,
                        endColumn: lines[endLine - 1]?.length || 0
                    }
                });
            }

            // Class
            const classMatch = trimmed.match(classRegex);
            if (classMatch) {
                console.log(`   ✅ Found class: ${classMatch[1]} at line ${i + 1}`);
                const name = classMatch[1];
                const startLine = i + 1;
                let endLine = startLine;
                const indent = line.search(/\S/);
                for (let j = i + 1; j < lines.length; j++) {
                    const nextLine = lines[j];
                    if (nextLine.trim() && nextLine.search(/\S/) <= indent) {
                        endLine = j;
                        break;
                    }
                    endLine = j + 1;
                }

                const body = lines.slice(i, endLine).join('\n');
                units.push({
                    id: `${path.basename(filePath)}:${startLine}:${name}`,
                    type: 'class',
                    name,
                    body,
                    dependencies: imports,
                    location: {
                        fileUri: filePath,
                        startLine,
                        startColumn: 0,
                        endLine,
                        endColumn: lines[endLine - 1]?.length || 0
                    }
                });
            }
        }

        console.log(`   📦 Total units extracted: ${units.length}`);
        return units;
    } catch (error) {
        console.error(`❌ Error parsing Python file ${filePath}:`, error);
        return [];
    }
}

/**
 * Extract import statements
 */
function extractImports(content: string, ext: string): string[] {
    const imports: string[] = [];
    const lines = content.split('\n');

    if (ext === '.py') {
        for (const line of lines) {
            if (line.trim().startsWith('import ') || line.trim().startsWith('from ')) {
                imports.push(line.trim());
            }
        }
    } else {
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('import ') || 
                trimmed.startsWith('export ') ||
                trimmed.includes('require(')) {  // Handle CommonJS require()
                imports.push(trimmed);
            }
        }
    }

    return imports;
}

/**
 * Bundle code unit with context
 */
export function bundleContext(unit: CodeUnit): ContextBundle {
    return {
        code: unit.body,
        imports: unit.dependencies.join('\n'),
        location: unit.location
    };
}
