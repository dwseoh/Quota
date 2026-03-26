export function extractImports(content: string, ext: string): string[] {
  const imports: string[] = [];

  if (ext === '.go') {
    // go imports are inside `import (...)` blocks or single `import "..."` lines.
    // gofmt guarantees consistent formatting so this scan is reliable.
    let inBlock = false;
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed === 'import (') { inBlock = true; continue; }
      if (inBlock && trimmed === ')') { inBlock = false; continue; }
      if (inBlock) {
        // strip optional alias: `alias "path"` or just `"path"`
        const m = trimmed.match(/"([^"]+)"/);
        if (m) { imports.push(m[1]); }
      } else {
        // single-line: import "path"
        const m = trimmed.match(/^import\s+"([^"]+)"/);
        if (m) { imports.push(m[1]); }
      }
    }
    return imports;
  }

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
