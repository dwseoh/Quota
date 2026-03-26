import { ContextBundle, ApiClassification } from '../types';
import { extractPackageFromImport, lookupProvider } from '../data/provider_registry';
import { getGenAI } from './gemini_client';

export async function classifyApiUsage(
  bundle: ContextBundle,
  useQuickDetection: boolean = true
): Promise<ApiClassification> {
  if (useQuickDetection) {
    const result = detectProvidersQuick(bundle);
    if (result) {
      return result;
    }
  }

  const genAI = getGenAI();
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

    const classification = parseClassificationResponse(response);
    return classification;
  } catch {
    return {
      role: 'none',
      category: 'other',
      provider: 'unknown',
      confidence: 0
    };
  }
}

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
2. Identify the API category: "llm", "payment", "database", "cloud", "communication", "auth", "monitoring", "search", "maps", or "other".
3. Identify the specific provider (e.g., "openai", "anthropic", "stripe", "aws", "mongodb").
4. Provide a confidence score between 0 and 1.

Return ONLY a JSON object in this exact format (no markdown, no explanation):
{
  "role": "consumer|provider|none",
  "category": "llm|payment|database|cloud|communication|auth|monitoring|search|maps|other",
  "provider": "provider_name",
  "confidence": 0.95
}`;
}

function parseClassificationResponse(response: string): ApiClassification {
  try {
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
  } catch {
    return {
      role: 'none',
      category: 'other',
      provider: 'unknown',
      confidence: 0
    };
  }
}

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

  patterns.imports = bundle.imports.split('\n').filter(i => i.trim());

  const apiCallPatterns = [
    /(\w+)\.(\w+)\([^)]*\)/g,
    /await\s+(\w+)\([^)]*\)/g,
    /fetch\s*\([^)]*\)/g,
    /axios\.\w+\([^)]*\)/g,
    /client\.\w+\([^)]*\)/g,
    /api\.\w+\([^)]*\)/g,
    /new\s+(\w+)\([^)]*\)/g
  ];

  for (const pattern of apiCallPatterns) {
    const matches = bundle.code.match(pattern);
    if (matches) {
      patterns.apiCalls.push(...matches.slice(0, 10));
    }
  }

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

export async function batchClassifyApis(
  bundles: ContextBundle[],
  useQuickDetection: boolean = true
): Promise<ApiClassification[]> {
  if (bundles.length === 0) {
    return [];
  }

  if (useQuickDetection) {
    return bundles.map(bundle => {
      const result = detectProvidersQuick(bundle);
      return result ?? { role: 'none', category: 'other', provider: 'unknown', confidence: 0 };
    });
  }

  const genAI = getGenAI();
  if (!genAI) {
    return bundles.map(() => ({
      role: 'none',
      category: 'other',
      provider: 'unknown',
      confidence: 0
    }));
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const allPatterns = bundles.map((bundle, idx) => ({
      index: idx,
      patterns: extractApiPatterns(bundle)
    }));

    const prompt = buildBatchClassificationPrompt(allPatterns);

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    const classifications = parseBatchResponse(response, bundles.length);
    return classifications;

  } catch {
    return bundles.map(() => ({
      role: 'none',
      category: 'other',
      provider: 'unknown',
      confidence: 0
    }));
  }
}

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

function parseBatchResponse(
  response: string,
  expectedCount: number
): ApiClassification[] {
  try {
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

    const results: ApiClassification[] = [];
    for (let i = 0; i < expectedCount; i++) {
      const item = parsed.find((p: { unit: number }) => p.unit === i);

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

  } catch {
    return Array(expectedCount).fill({
      role: 'none',
      category: 'other',
      provider: 'unknown',
      confidence: 0
    });
  }
}

export function detectProvidersQuick(bundle: ContextBundle): ApiClassification | null {
  const importLines = bundle.imports.split('\n').filter(l => l.trim());

  for (const line of importLines) {
    const pkg = extractPackageFromImport(line);
    if (!pkg) {
      continue;
    }
    const info = lookupProvider(pkg);
    if (info) {
      return {
        role: 'consumer',
        category: info.category,
        provider: info.provider,
        confidence: 0.9,
      };
    }
  }

  return null;
}
