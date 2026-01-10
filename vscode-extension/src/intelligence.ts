/**
 * intelligence.ts - Intelligence Module
 * LLM-driven API classification using Gemini
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { ContextBundle, ApiClassification } from './types';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Gemini API client
let genAI: GoogleGenerativeAI | null = null;

/**
 * Initialize Gemini API client
 * @param apiKey - Gemini API key (optional, will use env var if not provided)
 */
export function initializeGemini(apiKey?: string): void {
    const key = apiKey || process.env.GEMINI_API_KEY;

    if (!key) {
        console.warn('GEMINI_API_KEY not found. API classification will be disabled.');
        return;
    }

    genAI = new GoogleGenerativeAI(key);
    console.log('Gemini API initialized successfully');
}

/**
 * Classify API usage using Gemini
 * @param bundle - context bundle with code and imports
 * @param useQuickDetection - if true, use regex-based detection (fast, no API calls)
 * @returns API classification
 */
export async function classifyApiUsage(
    bundle: ContextBundle,
    useQuickDetection: boolean = true
): Promise<ApiClassification> {
    // Fast path: use regex-based detection
    if (useQuickDetection) {
        const providers = detectProvidersQuick(bundle);

        if (providers.length > 0) {
            // Determine category based on provider
            let category: 'llm' | 'payment' | 'database' | 'other' = 'other';
            const provider = providers[0]; // Use first detected provider

            if (['openai', 'anthropic', 'gemini'].includes(provider)) {
                category = 'llm';
            } else if (['stripe', 'paypal'].includes(provider)) {
                category = 'payment';
            } else if (['mongodb', 'postgresql', 'mysql'].includes(provider)) {
                category = 'database';
            }

            return {
                role: 'consumer',
                category: category,
                provider: provider,
                confidence: 0.85 // High confidence for regex matches
            };
        }
    }

    // Return default if Gemini not initialized
    if (!genAI) {
        return {
            role: 'none',
            category: 'other',
            provider: 'unknown',
            confidence: 0
        };
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = buildClassificationPrompt(bundle);
        const result = await model.generateContent(prompt);
        const response = result.response.text();

        // Parse JSON response
        const classification = parseClassificationResponse(response);
        return classification;
    } catch (error) {
        console.error('Error classifying API usage:', error);
        return {
            role: 'none',
            category: 'other',
            provider: 'unknown',
            confidence: 0
        };
    }
}

/**
 * Build classification prompt for Gemini
 * @param bundle - context bundle
 * @returns formatted prompt
 */
function buildClassificationPrompt(bundle: ContextBundle): string {
    return `Analyze this code and classify its API usage.

Code:
\`\`\`
${bundle.code}
\`\`\`

Dependencies:
\`\`\`
${bundle.imports}
\`\`\`

Tasks:
1. Determine if this code is a "consumer" (calls external APIs), "provider" (defines API endpoints), or "none" (neither).
2. Identify the API category: "llm", "payment", "weather", "database", or "other".
3. Identify the specific provider (e.g., "openai", "anthropic", "stripe", "aws", "mongodb").
4. Provide a confidence score between 0 and 1.

Return ONLY a JSON object in this exact format (no markdown, no explanation):
{
  "role": "consumer|provider|none",
  "category": "llm|payment|weather|database|other",
  "provider": "provider_name",
  "confidence": 0.95
}`;
}

/**
 * Parse Gemini response into ApiClassification
 * @param response - raw response text
 * @returns parsed classification
 */
function parseClassificationResponse(response: string): ApiClassification {
    try {
        // Remove markdown code blocks if present
        let cleaned = response.trim();
        if (cleaned.startsWith('```json')) {
            cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/```\n?/g, '');
        }

        const parsed = JSON.parse(cleaned);

        return {
            role: parsed.role || 'none',
            category: parsed.category || 'other',
            provider: parsed.provider || 'unknown',
            confidence: parsed.confidence || 0
        };
    } catch (error) {
        console.error('Error parsing classification response:', error);
        return {
            role: 'none',
            category: 'other',
            provider: 'unknown',
            confidence: 0
        };
    }
}

/**
 * Detect specific providers from code (fallback/fast path)
 * @param bundle - context bundle
 * @returns array of detected provider names
 */
/**
 * Extract API-related patterns from code (smart regex extraction)
 * @param bundle - context bundle
 * @returns extracted patterns for Gemini analysis
 */
export function extractApiPatterns(bundle: ContextBundle): {
    imports: string[];
    apiCalls: string[];
    keywords: string[];
} {
    const patterns = {
        imports: [] as string[],
        apiCalls: [] as string[],
        keywords: [] as string[]
    };

    // Extract import statements (already have these)
    patterns.imports = bundle.imports.split('\n').filter(i => i.trim());

    // Extract potential API calls (function calls that look like API usage)
    const apiCallPatterns = [
        /(\w+)\.(\w+)\([^)]*\)/g,           // object.method()
        /await\s+(\w+)\([^)]*\)/g,          // await someCall()
        /fetch\s*\([^)]*\)/g,               // fetch()
        /axios\.\w+\([^)]*\)/g,             // axios.get/post()
        /client\.\w+\([^)]*\)/g,            // client.method()
        /api\.\w+\([^)]*\)/g,               // api.method()
        /new\s+(\w+)\([^)]*\)/g             // new SomeClient()
    ];

    for (const pattern of apiCallPatterns) {
        const matches = bundle.code.match(pattern);
        if (matches) {
            patterns.apiCalls.push(...matches.slice(0, 10)); // Limit to 10 per pattern
        }
    }

    // Extract API-related keywords
    const keywordPatterns = [
        /\b(api|client|service|provider|sdk)\b/gi,
        /\b(http|https|request|response)\b/gi,
        /\b(auth|token|key|secret)\b/gi,
        /\b(database|db|query|collection)\b/gi,
        /\b(payment|charge|subscription)\b/gi
    ];

    for (const pattern of keywordPatterns) {
        const matches = bundle.code.match(pattern);
        if (matches) {
            patterns.keywords.push(...new Set(matches.map(m => m.toLowerCase())));
        }
    }

    return patterns;
}

/**
 * Batch classify multiple code units with Gemini (optimized)
 * @param bundles - array of context bundles to classify
 * @returns array of classifications
 */
export async function batchClassifyApis(
    bundles: ContextBundle[]
): Promise<ApiClassification[]> {
    if (!genAI || bundles.length === 0) {
        return bundles.map(() => ({
            role: 'none',
            category: 'other',
            provider: 'unknown',
            confidence: 0
        }));
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        // Extract patterns from all bundles
        const allPatterns = bundles.map((bundle, idx) => ({
            index: idx,
            patterns: extractApiPatterns(bundle)
        }));

        // Build batch prompt
        const prompt = buildBatchClassificationPrompt(allPatterns);

        console.log(`Analyzing ${bundles.length} code units in one batch...`);
        const result = await model.generateContent(prompt);
        const response = result.response.text();

        // Parse batch response
        const classifications = parseBatchResponse(response, bundles.length);
        return classifications;

    } catch (error) {
        console.error('Error in batch classification:', error);
        // Return default classifications
        return bundles.map(() => ({
            role: 'none',
            category: 'other',
            provider: 'unknown',
            confidence: 0
        }));
    }
}

/**
 * Build batch classification prompt
 */
function buildBatchClassificationPrompt(
    patterns: Array<{ index: number; patterns: ReturnType<typeof extractApiPatterns> }>
): string {
    const unitsData = patterns.map(p => `
Unit ${p.index}:
Imports: ${p.patterns.imports.slice(0, 5).join(', ')}
API Calls: ${p.patterns.apiCalls.slice(0, 5).join(', ')}
Keywords: ${p.patterns.keywords.slice(0, 10).join(', ')}
`).join('\n');

    return `Analyze these code units and identify if they use paid APIs or services.

${unitsData}

For each unit, determine:
1. Is it a "consumer" (calls external APIs), "provider" (defines endpoints), or "none"
2. Category: "llm", "payment", "database", "cloud", "analytics", "email", "storage", "other"
3. Specific provider name (e.g., "openai", "stripe", "aws", "mongodb")
4. Is it a PAID service? (true/false)
5. Confidence (0-1)

Return ONLY a JSON array (no markdown):
[
  {
    "unit": 0,
    "role": "consumer",
    "category": "llm",
    "provider": "openai",
    "isPaid": true,
    "confidence": 0.95
  },
  ...
]`;
}

/**
 * Parse batch classification response
 */
function parseBatchResponse(
    response: string,
    expectedCount: number
): ApiClassification[] {
    try {
        // Remove markdown if present
        let cleaned = response.trim();
        if (cleaned.startsWith('```json')) {
            cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/```\n?/g, '');
        }

        const parsed = JSON.parse(cleaned);

        if (!Array.isArray(parsed)) {
            throw new Error('Response is not an array');
        }

        // Convert to ApiClassification format
        const results: ApiClassification[] = [];
        for (let i = 0; i < expectedCount; i++) {
            const item = parsed.find((p: any) => p.unit === i);

            if (item) {
                results.push({
                    role: item.role || 'none',
                    category: item.category || 'other',
                    provider: item.provider || 'unknown',
                    confidence: item.confidence || 0
                });
            } else {
                results.push({
                    role: 'none',
                    category: 'other',
                    provider: 'unknown',
                    confidence: 0
                });
            }
        }

        return results;

    } catch (error) {
        console.error('Error parsing batch response:', error);
        // Return defaults
        return Array(expectedCount).fill({
            role: 'none',
            category: 'other',
            provider: 'unknown',
            confidence: 0
        });
    }
}

/**
 * Quick detection for common patterns (fallback/fast path)
 * Now simplified - just checks for obvious cases
 */
export function detectProvidersQuick(bundle: ContextBundle): string[] {
    const providers: string[] = [];
    const imports = bundle.imports.toLowerCase();

    // Only check most common/obvious ones
    const quickChecks: Record<string, string> = {
        'openai': 'openai',
        'anthropic': 'anthropic',
        '@google/generative': 'gemini',
        'stripe': 'stripe',
        'aws-sdk': 'aws',
        '@aws-sdk': 'aws',
        'mongodb': 'mongodb',
        'axios': 'axios',
        'firebase': 'firebase'
    };

    for (const [pattern, provider] of Object.entries(quickChecks)) {
        if (imports.includes(pattern)) {
            providers.push(provider);
        }
    }

    return [...new Set(providers)];
}

