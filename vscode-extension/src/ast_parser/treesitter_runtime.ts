import { Parser } from 'web-tree-sitter';
import * as path from 'path';

const RUNTIME_WASM = path.join(__dirname, '../../node_modules/web-tree-sitter/web-tree-sitter.wasm');

let initPromise: Promise<void> | null = null;

// initializes the web-tree-sitter wasm runtime once — safe to call from multiple parsers.
export function initTreeSitter(): Promise<void> {
  if (initPromise) { return initPromise; }
  initPromise = Parser.init({
    locateFile: () => RUNTIME_WASM,
  });
  return initPromise;
}
