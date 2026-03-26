import * as fs from 'fs';
import * as path from 'path';
import { execFile } from 'child_process';
import { CodeUnit } from '../types';
import { extractImports } from './imports';

const GO_EXTRACT_SCRIPT = path.join(__dirname, '../../../scripts/go_extract.go');

let cachedGoBin: string | null | undefined = undefined;

export async function findGoBin(): Promise<string | null> {
  if (cachedGoBin !== undefined) {
    return cachedGoBin;
  }
  const found = await new Promise<boolean>(resolve => {
    execFile('go', ['version'], { timeout: 3000 }, (err) => resolve(!err));
  });
  cachedGoBin = found ? 'go' : null;
  return cachedGoBin;
}

async function parseGoWithSubprocess(filePath: string): Promise<CodeUnit[]> {
  const bin = await findGoBin();
  if (!bin) {
    throw new Error('go not found');
  }

  const stdout = await new Promise<string>((resolve, reject) => {
    execFile(
      bin,
      ['run', GO_EXTRACT_SCRIPT, filePath],
      {
        timeout: 15000,
        maxBuffer: 10 * 1024 * 1024,
        // run from the script's own directory to avoid interference from user's go.mod
        cwd: path.dirname(GO_EXTRACT_SCRIPT),
      },
      (err, out) => {
        if (err) { reject(err); }
        else { resolve(out); }
      },
    );
  });

  const result: {
    units: Array<{ type: string; name: string; startLine: number; endLine: number; body: string }>;
    imports: string[];
  } = JSON.parse(stdout);

  const basename = path.basename(filePath);

  return result.units.map(u => ({
    id: `${basename}:${u.startLine}:${u.name}`,
    type: u.type as 'function' | 'class' | 'method',
    name: u.name,
    body: u.body,
    dependencies: result.imports,
    location: {
      fileUri: filePath,
      startLine: u.startLine,
      startColumn: 0,
      endLine: u.endLine,
      endColumn: 0,
    },
  }));
}

// regex fallback for when go is not available.
// gofmt guarantees `{` is always on the func declaration line, making brace counting reliable.
function parseGoFileBasic(filePath: string): CodeUnit[] {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const units: CodeUnit[] = [];
    const imports = extractImports(content, '.go');

    // matches: func Name(  or  func (recv Type) Name(
    const funcRegex = /^func\s+(?:\(\s*\w+\s+\*?\w+\s*\)\s+)?(\w+)\s*\(/;

    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(funcRegex);
      if (!m) { continue; }

      const name = m[1];
      const startLine = i + 1;

      // count braces to find end
      let depth = 0;
      let endLine = startLine;
      for (let j = i; j < lines.length; j++) {
        for (const ch of lines[j]) {
          if (ch === '{') { depth++; }
          if (ch === '}') { depth--; }
        }
        if (depth === 0 && j >= i) {
          endLine = j + 1;
          break;
        }
      }

      units.push({
        id: `${path.basename(filePath)}:${startLine}:${name}`,
        type: 'function',
        name,
        body: lines.slice(i, endLine).join('\n'),
        dependencies: imports,
        location: {
          fileUri: filePath,
          startLine,
          startColumn: 0,
          endLine,
          endColumn: lines[endLine - 1]?.length || 0,
        },
      });
    }

    return units;
  } catch {
    return [];
  }
}

export async function parseGoFile(filePath: string): Promise<CodeUnit[]> {
  try {
    return await parseGoWithSubprocess(filePath);
  } catch {
    return parseGoFileBasic(filePath);
  }
}
