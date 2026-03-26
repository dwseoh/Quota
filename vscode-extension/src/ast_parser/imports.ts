export function extractImports(content: string, ext: string): string[] {
  const imports: string[] = [];

  if (ext === '.cs') {
    // c#: using OpenAI; or using Azure.AI.OpenAI;
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      const m = trimmed.match(/^using\s+([\w.]+)\s*;/);
      if (m) { imports.push(m[1]); }
    }
    return imports;
  }

  if (ext === '.java') {
    // java: import com.openai.OpenAIClient; or import com.openai.*;
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      const m = trimmed.match(/^import\s+(?:static\s+)?([\w.]+(?:\.\*)?)\s*;/);
      if (m) { imports.push(m[1]); }
    }
    return imports;
  }

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
