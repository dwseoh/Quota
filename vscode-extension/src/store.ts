/**
 * store.ts - Store Module
 * Handles persistent analytics storage and cache management
 */

import * as fs from 'fs';
import * as path from 'path';
import { CodespaceGraph, FileNode } from './types';

const ANALYTICS_DIR = '.delta-analytics-config';
const INDEX_FILE = 'index.json';
const HASH_FILE = 'file-map.hash';

/**
 * Initialize analytics storage directory
 * @param workspaceRoot - workspace root path
 */
export async function initializeStore(workspaceRoot: string): Promise<void> {
    const analyticsPath = path.join(workspaceRoot, ANALYTICS_DIR);

    try {
        // Create directory if it doesn't exist
        if (!fs.existsSync(analyticsPath)) {
            await fs.promises.mkdir(analyticsPath, { recursive: true });
            console.log(`Created analytics directory: ${analyticsPath}`);
        }

        // Create cache subdirectory
        const cachePath = path.join(analyticsPath, 'cache');
        if (!fs.existsSync(cachePath)) {
            await fs.promises.mkdir(cachePath, { recursive: true });
        }
    } catch (error) {
        console.error('Error initializing store:', error);
        throw error;
    }
}

/**
 * Save CodespaceGraph to index.json
 * @param workspaceRoot - workspace root path
 * @param graph - codespace graph to save
 */
export async function saveIndex(
    workspaceRoot: string,
    graph: CodespaceGraph
): Promise<void> {
    const indexPath = path.join(workspaceRoot, ANALYTICS_DIR, INDEX_FILE);

    try {
        await fs.promises.writeFile(
            indexPath,
            JSON.stringify(graph, null, 2),
            'utf-8'
        );
        console.log(`Saved index to ${indexPath}`);
    } catch (error) {
        console.error('Error saving index:', error);
        throw error;
    }
}

/**
 * Load CodespaceGraph from index.json
 * @param workspaceRoot - workspace root path
 * @returns codespace graph or null if not found
 */
export async function loadIndex(
    workspaceRoot: string
): Promise<CodespaceGraph | null> {
    const indexPath = path.join(workspaceRoot, ANALYTICS_DIR, INDEX_FILE);

    try {
        if (!fs.existsSync(indexPath)) {
            return null;
        }

        const content = await fs.promises.readFile(indexPath, 'utf-8');
        return JSON.parse(content) as CodespaceGraph;
    } catch (error) {
        console.error('Error loading index:', error);
        return null;
    }
}

/**
 * Save file hash map
 * @param workspaceRoot - workspace root path
 * @param hashes - map of file path to hash
 */
export async function saveFileHashes(
    workspaceRoot: string,
    hashes: Map<string, string>
): Promise<void> {
    const hashPath = path.join(workspaceRoot, ANALYTICS_DIR, HASH_FILE);

    try {
        const hashObj = Object.fromEntries(hashes);
        await fs.promises.writeFile(
            hashPath,
            JSON.stringify(hashObj, null, 2),
            'utf-8'
        );
    } catch (error) {
        console.error('Error saving file hashes:', error);
        throw error;
    }
}

/**
 * Load file hash map
 * @param workspaceRoot - workspace root path
 * @returns map of file path to hash
 */
export async function loadFileHashes(
    workspaceRoot: string
): Promise<Map<string, string>> {
    const hashPath = path.join(workspaceRoot, ANALYTICS_DIR, HASH_FILE);

    try {
        if (!fs.existsSync(hashPath)) {
            return new Map();
        }

        const content = await fs.promises.readFile(hashPath, 'utf-8');
        const hashObj = JSON.parse(content);
        return new Map(Object.entries(hashObj));
    } catch (error) {
        console.error('Error loading file hashes:', error);
        return new Map();
    }
}

/**
 * Get analytics directory path
 * @param workspaceRoot - workspace root path
 * @returns analytics directory path
 */
export function getAnalyticsPath(workspaceRoot: string): string {
    return path.join(workspaceRoot, ANALYTICS_DIR);
}
