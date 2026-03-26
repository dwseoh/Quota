import * as fs from 'fs';
import * as path from 'path';
import { execFile } from 'child_process';
import { CodeUnit } from '../types';
import { extractImports } from './imports';

const PYTHON_EXTRACT_SCRIPT = path.join(__dirname, '../../../scripts/python_extract.py');

let cachedPythonBin: string | null | undefined = undefined;

export async function findPythonBin(): Promise<string | null> {
  if (cachedPythonBin !== undefined) {
    return cachedPythonBin;
  }
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
  if (!bin) {
    throw new Error('python not found');
  }

  const imports = extractImports(fs.readFileSync(filePath, 'utf-8'), '.py');

  const stdout = await new Promise<string>((resolve, reject) => {
    execFile(bin, [PYTHON_EXTRACT_SCRIPT, filePath], {
      timeout: 10000,
      maxBuffer: 10 * 1024 * 1024,
    }, (err, out) => {
      if (err) {
        reject(err);
      } else {
        resolve(out);
      }
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
          if (lines[j].trim() && lines[j].search(/\S/) <= indent) {
            endLine = j;
            break;
          }
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
          if (lines[j].trim() && lines[j].search(/\S/) <= indent) {
            endLine = j;
            break;
          }
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

export async function parsePythonFile(filePath: string): Promise<CodeUnit[]> {
  try {
    return await parsePythonWithSubprocess(filePath);
  } catch {
    return parsePythonFileBasic(filePath);
  }
}
