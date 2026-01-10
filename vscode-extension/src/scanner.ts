/**
 * scanner.ts - Scanner Module
 * Handles file system traversal and change detection
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { FileEntry } from './types';

/**
 * Scan workspace for relevant files
 * @param rootPath - workspace root directory
 * @returns array of file entries
 */
export async function scanWorkspace(rootPath: string): Promise<FileEntry[]> {
    const files: FileEntry[] = [];
    const extensions = ['.py', '.ts', '.js'];
    const ignorePatterns = ['node_modules', '.git', 'dist', 'out', 'build', '__pycache__', '.venv'];

    async function traverse(dir: string): Promise<void> {
        try {
            const entries = await fs.promises.readdir(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);

                // Skip ignored directories
                if (entry.isDirectory()) {
                    if (!ignorePatterns.includes(entry.name)) {
                        await traverse(fullPath);
                    }
                    continue;
                }

                // Check if file has relevant extension
                if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
                    const stats = await fs.promises.stat(fullPath);
                    const hash = await computeFileHash(fullPath);

                    files.push({
                        path: fullPath,
                        hash: hash,
                        lastModified: stats.mtimeMs
                    });
                }
            }
        } catch (error) {
            console.error(`Error scanning directory ${dir}:`, error);
        }
    }

    await traverse(rootPath);
    return files;
}

/**
 * Compute MD5 hash of file contents
 * @param filePath - path to file
 * @returns MD5 hash string
 */
export async function computeFileHash(filePath: string): Promise<string> {
    try {
        const content = await fs.promises.readFile(filePath, 'utf-8');
        return crypto.createHash('md5').update(content).digest('hex');
    } catch (error) {
        console.error(`Error hashing file ${filePath}:`, error);
        return '';
    }
}

/**
 * Identify files that have changed since last scan
 * @param currentHashes - current file hash map
 * @param previousHashes - previous file hash map
 * @returns array of changed file paths
 */
export function getModifiedFiles(
    currentHashes: Map<string, string>,
    previousHashes: Map<string, string>
): string[] {
    const modified: string[] = [];

    // Check for new or modified files
    for (const [filePath, currentHash] of currentHashes.entries()) {
        const previousHash = previousHashes.get(filePath);
        if (!previousHash || previousHash !== currentHash) {
            modified.push(filePath);
        }
    }

    return modified;
}

/**
 * Convert FileEntry array to hash map
 * @param files - array of file entries
 * @returns map of file path to hash
 */
export function createHashMap(files: FileEntry[]): Map<string, string> {
    const map = new Map<string, string>();
    for (const file of files) {
        map.set(file.path, file.hash);
    }
    return map;
}
