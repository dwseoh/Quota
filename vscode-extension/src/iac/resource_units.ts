export function parseCpuVcpu(s: string): number {
  const t = s.trim().replace(/"/g, '');
  if (t.endsWith('m')) {
    return parseInt(t, 10) / 1000;
  }
  return parseFloat(t) || 0;
}

export function parseMemGb(s: string): number {
  const t = s.trim().replace(/"/g, '');
  if (t.endsWith('Gi')) {
    return parseFloat(t);
  }
  if (t.endsWith('Mi')) {
    return parseFloat(t) / 1024;
  }
  if (t.endsWith('G')) {
    return parseFloat(t);
  }
  if (t.endsWith('M')) {
    return parseFloat(t) / 1024;
  }
  if (t.endsWith('Ki')) {
    return parseFloat(t) / (1024 * 1024);
  }
  return parseFloat(t) / (1024 ** 3);
}
