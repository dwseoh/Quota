import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import { pricing_table } from './types';

const LITELLM_URL = 'https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json';
const CACHE_FILENAME = 'pricing_cache.json';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// minimal offline fallback for when network is unavailable
const FALLBACK_PRICING: pricing_table = {
    'gpt-4o': { input: 0.0025, output: 0.01 },
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
    'claude-3-5-sonnet-latest': { input: 0.003, output: 0.015 },
    'claude-3-5-haiku-latest': { input: 0.0008, output: 0.004 },
    'gemini-2.0-flash': { input: 0.0001, output: 0.0004 },
    'gemini-1.5-pro': { input: 0.00125, output: 0.005 },
};

let cachedPricing: pricing_table | null = null;

// fetches litellm's community-maintained pricing json and converts to our format
// litellm stores cost per token; we store cost per 1k tokens
function fetchFromNetwork(): Promise<pricing_table> {
    return new Promise((resolve, reject) => {
        https.get(LITELLM_URL, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const raw = JSON.parse(data);
                    const table: pricing_table = {};
                    for (const [model, info] of Object.entries(raw as Record<string, any>)) {
                        if (
                            typeof info.input_cost_per_token === 'number' &&
                            typeof info.output_cost_per_token === 'number'
                        ) {
                            table[model] = {
                                input: info.input_cost_per_token * 1000,
                                output: info.output_cost_per_token * 1000,
                            };
                        }
                    }
                    resolve(table);
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

// loads pricing from disk cache if fresh, otherwise fetches from network.
// falls back to stale cache or hardcoded fallback if network fails.
export async function loadPricing(globalStoragePath: string): Promise<pricing_table> {
    if (cachedPricing) return cachedPricing;

    const cachePath = path.join(globalStoragePath, CACHE_FILENAME);

    let diskCache: { timestamp: number; pricing: pricing_table } | null = null;
    try {
        if (fs.existsSync(cachePath)) {
            diskCache = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
        }
    } catch { /* ignore corrupt cache */ }

    const isFresh = diskCache && (Date.now() - diskCache.timestamp) < CACHE_TTL_MS;

    if (isFresh && diskCache) {
        cachedPricing = diskCache.pricing;
        return cachedPricing;
    }

    try {
        const fetched = await fetchFromNetwork();
        try {
            fs.mkdirSync(globalStoragePath, { recursive: true });
            fs.writeFileSync(cachePath, JSON.stringify({ timestamp: Date.now(), pricing: fetched }));
        } catch { /* ignore write failure */ }
        cachedPricing = fetched;
        return cachedPricing;
    } catch {
        if (diskCache) {
            cachedPricing = diskCache.pricing;
            return cachedPricing;
        }
        cachedPricing = { ...FALLBACK_PRICING };
        return cachedPricing;
    }
}

export function getPricing(): pricing_table {
    return cachedPricing ?? { ...FALLBACK_PRICING };
}
