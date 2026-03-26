/**
 * parse source files into CodeUnit[] — python subprocess / vscode symbols / typescript-eslint
 */

import * as path from 'path';
import { CodeUnit, ContextBundle } from '../types';
import { parsePythonFile, findPythonBin } from './python_parse';
import { parseTypeScriptFile } from './typescript_parse';
import { parseFileWithVSCode } from './vscode_symbols';
import { getVscode } from './vscode_lazy';

export { findPythonBin } from './python_parse';

export async function parseFile(filePath: string): Promise<CodeUnit[]> {
  const ext = path.extname(filePath);

  if (ext === '.py') {
    return parsePythonFile(filePath);
  }

  if (getVscode()) {
    try {
      return await parseFileWithVSCode(filePath);
    } catch {
      // fall through
    }
  }

  if (ext === '.ts' || ext === '.js' || ext === '.tsx' || ext === '.jsx') {
    return parseTypeScriptFile(filePath);
  }

  return [];
}

export function bundleContext(unit: CodeUnit): ContextBundle {
  return {
    code: unit.body,
    imports: unit.dependencies.join('\n'),
    location: unit.location,
  };
}
