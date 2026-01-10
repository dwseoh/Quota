/**
 * ast_parser.ts - AST Parser Module
 * Handles AST-based code analysis and logical unit extraction
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse as parseTypeScript } from '@typescript-eslint/parser';
import Parser from 'tree-sitter';
import Python from 'tree-sitter-python';
import { CodeUnit, LocationMetadata, ContextBundle } from './types';

/**
 * Parse a file and extract code units
 * @param filePath - path to file
 * @returns array of code units
 */
export async function parseFile(filePath: string): Promise<CodeUnit[]> {
    const ext = path.extname(filePath);

    if (ext === '.ts' || ext === '.js') {
        return parseTypeScriptFile(filePath);
    } else if (ext === '.py') {
        return parsePythonFile(filePath);
    }

    return [];
}

/**
 * Parse TypeScript/JavaScript file using @typescript-eslint/parser
 * @param filePath - path to file
 * @returns array of code units
 */
async function parseTypeScriptFile(filePath: string): Promise<CodeUnit[]> {
    try {
        const content = await fs.promises.readFile(filePath, 'utf-8');
        const ast = parseTypeScript(content, {
            ecmaVersion: 2020,
            sourceType: 'module',
            loc: true,
            range: true
        });

        const units: CodeUnit[] = [];
        const imports = extractImports(content);

        // Extract functions and classes
        if (ast.body) {
            for (const node of ast.body) {
                if (node.type === 'FunctionDeclaration' && node.id) {
                    const unit = extractFunctionUnit(node, content, filePath, imports);
                    if (unit) units.push(unit);
                } else if (node.type === 'ClassDeclaration' && node.id) {
                    const classUnits = extractClassUnits(node, content, filePath, imports);
                    units.push(...classUnits);
                } else if (node.type === 'ExportNamedDeclaration' && node.declaration) {
                    if (node.declaration.type === 'FunctionDeclaration' && node.declaration.id) {
                        const unit = extractFunctionUnit(node.declaration, content, filePath, imports);
                        if (unit) units.push(unit);
                    } else if (node.declaration.type === 'ClassDeclaration' && node.declaration.id) {
                        const classUnits = extractClassUnits(node.declaration, content, filePath, imports);
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
 * Parse Python file using tree-sitter
 * @param filePath - path to file
 * @returns array of code units
 */
async function parsePythonFile(filePath: string): Promise<CodeUnit[]> {
    try {
        const content = await fs.promises.readFile(filePath, 'utf-8');
        const parser = new Parser();
        // Type assertion to handle version compatibility
        parser.setLanguage(Python as any);

        const tree = parser.parse(content);
        const units: CodeUnit[] = [];
        const imports = extractPythonImports(content);

        // Traverse AST to find functions and classes
        const cursor = tree.walk();

        function traverse(): void {
            const node = cursor.currentNode;

            if (node.type === 'function_definition') {
                const unit = extractPythonFunction(node, content, filePath, imports);
                if (unit) units.push(unit);
            } else if (node.type === 'class_definition') {
                const classUnits = extractPythonClass(node, content, filePath, imports);
                units.push(...classUnits);
            }

            if (cursor.gotoFirstChild()) {
                do {
                    traverse();
                } while (cursor.gotoNextSibling());
                cursor.gotoParent();
            }
        }

        traverse();
        return units;
    } catch (error) {
        console.error(`Error parsing Python file ${filePath}:`, error);
        return [];
    }
}

/**
 * Extract imports from TypeScript/JavaScript content
 * @param content - file content
 * @returns array of import statements
 */
function extractImports(content: string): string[] {
    const imports: string[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('import ') || trimmed.startsWith('require(')) {
            imports.push(trimmed);
        }
    }

    return imports;
}

/**
 * Extract imports from Python content
 * @param content - file content
 * @returns array of import statements
 */
function extractPythonImports(content: string): string[] {
    const imports: string[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('import ') || trimmed.startsWith('from ')) {
            imports.push(trimmed);
        }
    }

    return imports;
}

/**
 * Extract function unit from AST node
 */
function extractFunctionUnit(
    node: any,
    content: string,
    filePath: string,
    imports: string[]
): CodeUnit | null {
    if (!node.loc || !node.id) return null;

    const name = node.id.name;
    const body = content.substring(node.range[0], node.range[1]);

    return {
        id: `${filePath}:${node.loc.start.line}:${name}`,
        type: 'function',
        name: name,
        body: body,
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
 * Extract class and its methods
 */
function extractClassUnits(
    node: any,
    content: string,
    filePath: string,
    imports: string[]
): CodeUnit[] {
    const units: CodeUnit[] = [];

    if (!node.loc || !node.id) return units;

    const className = node.id.name;
    const classBody = content.substring(node.range[0], node.range[1]);

    // Add class itself
    units.push({
        id: `${filePath}:${node.loc.start.line}:${className}`,
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
            if (member.type === 'MethodDefinition' && member.key) {
                const methodName = member.key.name || member.key.value;
                const methodBody = content.substring(member.range[0], member.range[1]);

                units.push({
                    id: `${filePath}:${member.loc.start.line}:${className}.${methodName}`,
                    type: 'method',
                    name: `${className}.${methodName}`,
                    body: methodBody,
                    dependencies: imports,
                    location: {
                        fileUri: filePath,
                        startLine: member.loc.start.line,
                        startColumn: member.loc.start.column,
                        endLine: member.loc.end.line,
                        endColumn: member.loc.end.column
                    }
                });
            }
        }
    }

    return units;
}

/**
 * Extract Python function from tree-sitter node
 */
function extractPythonFunction(
    node: any,
    content: string,
    filePath: string,
    imports: string[]
): CodeUnit | null {
    const nameNode = node.childForFieldName('name');
    if (!nameNode) return null;

    const name = content.substring(nameNode.startIndex, nameNode.endIndex);
    const body = content.substring(node.startIndex, node.endIndex);

    return {
        id: `${filePath}:${node.startPosition.row + 1}:${name}`,
        type: 'function',
        name: name,
        body: body,
        dependencies: imports,
        location: {
            fileUri: filePath,
            startLine: node.startPosition.row + 1,
            startColumn: node.startPosition.column,
            endLine: node.endPosition.row + 1,
            endColumn: node.endPosition.column
        }
    };
}

/**
 * Extract Python class and methods from tree-sitter node
 */
function extractPythonClass(
    node: any,
    content: string,
    filePath: string,
    imports: string[]
): CodeUnit[] {
    const units: CodeUnit[] = [];
    const nameNode = node.childForFieldName('name');
    if (!nameNode) return units;

    const className = content.substring(nameNode.startIndex, nameNode.endIndex);
    const classBody = content.substring(node.startIndex, node.endIndex);

    // Add class
    units.push({
        id: `${filePath}:${node.startPosition.row + 1}:${className}`,
        type: 'class',
        name: className,
        body: classBody,
        dependencies: imports,
        location: {
            fileUri: filePath,
            startLine: node.startPosition.row + 1,
            startColumn: node.startPosition.column,
            endLine: node.endPosition.row + 1,
            endColumn: node.endPosition.column
        }
    });

    // Extract methods
    const bodyNode = node.childForFieldName('body');
    if (bodyNode) {
        for (let i = 0; i < bodyNode.childCount; i++) {
            const child = bodyNode.child(i);
            if (child && child.type === 'function_definition') {
                const methodNameNode = child.childForFieldName('name');
                if (methodNameNode) {
                    const methodName = content.substring(methodNameNode.startIndex, methodNameNode.endIndex);
                    const methodBody = content.substring(child.startIndex, child.endIndex);

                    units.push({
                        id: `${filePath}:${child.startPosition.row + 1}:${className}.${methodName}`,
                        type: 'method',
                        name: `${className}.${methodName}`,
                        body: methodBody,
                        dependencies: imports,
                        location: {
                            fileUri: filePath,
                            startLine: child.startPosition.row + 1,
                            startColumn: child.startPosition.column,
                            endLine: child.endPosition.row + 1,
                            endColumn: child.endPosition.column
                        }
                    });
                }
            }
        }
    }

    return units;
}

/**
 * Bundle code unit with dependencies into context
 * @param unit - code unit
 * @returns context bundle
 */
export function bundleContext(unit: CodeUnit): ContextBundle {
    return {
        code: unit.body,
        imports: unit.dependencies.join('\n'),
        location: unit.location
    };
}
