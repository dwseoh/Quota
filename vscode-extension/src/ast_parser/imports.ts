export function extractImports(content: string, ext: string): string[] {
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
