// maps sdk/package names to provider and category.
// used for import-only detection — no body scanning.
// add entries here to expand detection coverage.

export type ProviderCategory =
    | 'llm'
    | 'payment'
    | 'database'
    | 'communication'
    | 'cloud'
    | 'search'
    | 'auth'
    | 'monitoring'
    | 'maps'
    | 'other';

export interface ProviderInfo {
    provider: string;
    category: ProviderCategory;
}

// npm package names → provider info
// prefix entries (e.g. '@aws-sdk') match any package starting with that string
export const JS_PACKAGES: Record<string, ProviderInfo> = {
    // llm
    'openai':                       { provider: 'openai',      category: 'llm' },
    '@anthropic-ai/sdk':            { provider: 'anthropic',   category: 'llm' },
    'anthropic':                    { provider: 'anthropic',   category: 'llm' },
    '@google/generative-ai':        { provider: 'gemini',      category: 'llm' },
    '@google-cloud/aiplatform':     { provider: 'vertex-ai',   category: 'llm' },
    'mistralai':                    { provider: 'mistral',     category: 'llm' },
    '@mistralai/mistral':           { provider: 'mistral',     category: 'llm' },
    'cohere-ai':                    { provider: 'cohere',      category: 'llm' },
    'groq-sdk':                     { provider: 'groq',        category: 'llm' },
    '@langchain/openai':            { provider: 'openai',      category: 'llm' },
    '@langchain/anthropic':         { provider: 'anthropic',   category: 'llm' },
    '@langchain/google-genai':      { provider: 'gemini',      category: 'llm' },
    '@langchain/mistralai':         { provider: 'mistral',     category: 'llm' },
    '@langchain/cohere':            { provider: 'cohere',      category: 'llm' },
    '@langchain/groq':              { provider: 'groq',        category: 'llm' },
    'langchain':                    { provider: 'langchain',   category: 'llm' },
    'ai':                           { provider: 'vercel-ai',   category: 'llm' }, // vercel ai sdk
    '@ai-sdk/openai':               { provider: 'openai',      category: 'llm' },
    '@ai-sdk/anthropic':            { provider: 'anthropic',   category: 'llm' },
    '@ai-sdk/google':               { provider: 'gemini',      category: 'llm' },

    // payment
    'stripe':                       { provider: 'stripe',      category: 'payment' },
    '@stripe/stripe-js':            { provider: 'stripe',      category: 'payment' },
    'braintree':                    { provider: 'braintree',   category: 'payment' },
    'paypal-rest-sdk':              { provider: 'paypal',      category: 'payment' },
    '@paypal/checkout-server-sdk':  { provider: 'paypal',      category: 'payment' },
    'plaid':                        { provider: 'plaid',       category: 'payment' },

    // database
    'mongodb':                      { provider: 'mongodb',     category: 'database' },
    'mongoose':                     { provider: 'mongodb',     category: 'database' },
    '@supabase/supabase-js':        { provider: 'supabase',    category: 'database' },
    'firebase':                     { provider: 'firebase',    category: 'database' },
    'firebase-admin':               { provider: 'firebase',    category: 'database' },
    '@firebase/app':                { provider: 'firebase',    category: 'database' },
    '@planetscale/database':        { provider: 'planetscale', category: 'database' },
    '@neondatabase/serverless':     { provider: 'neon',        category: 'database' },
    '@upstash/redis':               { provider: 'upstash',     category: 'database' },
    'redis':                        { provider: 'redis',       category: 'database' },
    'ioredis':                      { provider: 'redis',       category: 'database' },
    'pg':                           { provider: 'postgres',    category: 'database' },
    'mysql2':                       { provider: 'mysql',       category: 'database' },

    // communication
    'twilio':                       { provider: 'twilio',      category: 'communication' },
    '@sendgrid/mail':               { provider: 'sendgrid',    category: 'communication' },
    'postmark':                     { provider: 'postmark',    category: 'communication' },
    '@mailchimp/mailchimp_marketing': { provider: 'mailchimp', category: 'communication' },
    'resend':                       { provider: 'resend',      category: 'communication' },

    // cloud — prefix match handles @aws-sdk/client-*, @google-cloud/*
    'aws-sdk':                      { provider: 'aws',         category: 'cloud' },
    '@aws-sdk':                     { provider: 'aws',         category: 'cloud' },
    '@google-cloud':                { provider: 'gcp',         category: 'cloud' },
    '@azure/identity':              { provider: 'azure',       category: 'cloud' },
    '@azure/storage-blob':          { provider: 'azure',       category: 'cloud' },
    'cloudinary':                   { provider: 'cloudinary',  category: 'cloud' },

    // search / vector
    '@pinecone-database/pinecone':  { provider: 'pinecone',    category: 'search' },
    'pinecone-client':              { provider: 'pinecone',    category: 'search' },
    '@qdrant/js-client-rest':       { provider: 'qdrant',      category: 'search' },
    'weaviate-client':              { provider: 'weaviate',    category: 'search' },
    'algoliasearch':                { provider: 'algolia',     category: 'search' },
    '@elastic/elasticsearch':       { provider: 'elasticsearch', category: 'search' },

    // auth
    '@clerk/nextjs':                { provider: 'clerk',       category: 'auth' },
    '@clerk/clerk-sdk-node':        { provider: 'clerk',       category: 'auth' },
    '@clerk/express':               { provider: 'clerk',       category: 'auth' },
    'auth0':                        { provider: 'auth0',       category: 'auth' },
    '@auth0/nextjs-auth0':          { provider: 'auth0',       category: 'auth' },
    'next-auth':                    { provider: 'next-auth',   category: 'auth' },

    // monitoring
    '@sentry/node':                 { provider: 'sentry',      category: 'monitoring' },
    '@sentry/nextjs':               { provider: 'sentry',      category: 'monitoring' },
    '@sentry/react':                { provider: 'sentry',      category: 'monitoring' },
    'dd-trace':                     { provider: 'datadog',     category: 'monitoring' },
    '@datadog/datadog-api-client':  { provider: 'datadog',     category: 'monitoring' },
    '@posthog/node':                { provider: 'posthog',     category: 'monitoring' },
    'posthog-js':                   { provider: 'posthog',     category: 'monitoring' },
    'mixpanel':                     { provider: 'mixpanel',    category: 'monitoring' },

    // maps
    '@mapbox/mapbox-sdk':           { provider: 'mapbox',      category: 'maps' },
    '@googlemaps/google-maps-services-js': { provider: 'google-maps', category: 'maps' },
};

// python module names → provider info
// supports both root module (e.g. 'openai') and dotted names (e.g. 'google.generativeai')
export const PYTHON_MODULES: Record<string, ProviderInfo> = {
    // llm
    'openai':                   { provider: 'openai',    category: 'llm' },
    'anthropic':                { provider: 'anthropic', category: 'llm' },
    'google.generativeai':      { provider: 'gemini',    category: 'llm' },
    'vertexai':                 { provider: 'vertex-ai', category: 'llm' },
    'mistralai':                { provider: 'mistral',   category: 'llm' },
    'cohere':                   { provider: 'cohere',    category: 'llm' },
    'groq':                     { provider: 'groq',      category: 'llm' },
    'langchain_openai':         { provider: 'openai',    category: 'llm' },
    'langchain_anthropic':      { provider: 'anthropic', category: 'llm' },
    'langchain_google_genai':   { provider: 'gemini',    category: 'llm' },
    'langchain_mistralai':      { provider: 'mistral',   category: 'llm' },
    'langchain_cohere':         { provider: 'cohere',    category: 'llm' },
    'langchain_groq':           { provider: 'groq',      category: 'llm' },
    'langchain':                { provider: 'langchain', category: 'llm' },

    // payment
    'stripe':                   { provider: 'stripe',      category: 'payment' },
    'braintree':                { provider: 'braintree',   category: 'payment' },
    'plaid':                    { provider: 'plaid',       category: 'payment' },
    'paypalrestsdk':            { provider: 'paypal',      category: 'payment' },

    // database
    'pymongo':                  { provider: 'mongodb',     category: 'database' },
    'motor':                    { provider: 'mongodb',     category: 'database' },
    'supabase':                 { provider: 'supabase',    category: 'database' },
    'firebase_admin':           { provider: 'firebase',    category: 'database' },
    'redis':                    { provider: 'redis',       category: 'database' },
    'psycopg2':                 { provider: 'postgres',    category: 'database' },
    'asyncpg':                  { provider: 'postgres',    category: 'database' },
    'pymysql':                  { provider: 'mysql',       category: 'database' },
    'upstash_redis':            { provider: 'upstash',     category: 'database' },

    // communication
    'twilio':                   { provider: 'twilio',      category: 'communication' },
    'sendgrid':                 { provider: 'sendgrid',    category: 'communication' },
    'resend':                   { provider: 'resend',      category: 'communication' },

    // cloud
    'boto3':                    { provider: 'aws',         category: 'cloud' },
    'botocore':                 { provider: 'aws',         category: 'cloud' },
    'google.cloud':             { provider: 'gcp',         category: 'cloud' },
    'azure':                    { provider: 'azure',       category: 'cloud' },
    'cloudinary':               { provider: 'cloudinary',  category: 'cloud' },

    // search / vector
    'pinecone':                 { provider: 'pinecone',    category: 'search' },
    'qdrant_client':            { provider: 'qdrant',      category: 'search' },
    'weaviate':                 { provider: 'weaviate',    category: 'search' },
    'algoliasearch':            { provider: 'algolia',     category: 'search' },
    'elasticsearch':            { provider: 'elasticsearch', category: 'search' },

    // auth
    'auth0':                    { provider: 'auth0',       category: 'auth' },

    // monitoring
    'sentry_sdk':               { provider: 'sentry',      category: 'monitoring' },
    'datadog':                  { provider: 'datadog',     category: 'monitoring' },
    'ddtrace':                  { provider: 'datadog',     category: 'monitoring' },
    'posthog':                  { provider: 'posthog',     category: 'monitoring' },
    'mixpanel':                 { provider: 'mixpanel',    category: 'monitoring' },

    // maps
    'googlemaps':               { provider: 'google-maps', category: 'maps' },
    'mapbox':                   { provider: 'mapbox',      category: 'maps' },
};

// extracts the package/module name from a single import statement line
export function extractPackageFromImport(line: string): string | null {
    const trimmed = line.trim();

    // ts/js: import ... from 'pkg' or require('pkg') or import('pkg')
    const quotedMatch = trimmed.match(/['"]([^'"]+)['"]/);
    if (quotedMatch) return quotedMatch[1];

    // python: from pkg.sub import ... or import pkg.sub
    const fromMatch = trimmed.match(/^from\s+([\w.]+)/);
    if (fromMatch) return fromMatch[1];

    const importMatch = trimmed.match(/^import\s+([\w.]+)/);
    if (importMatch) return importMatch[1];

    return null;
}

// known api call site patterns per llm provider.
// used to verify a function actually calls the api, not just lives in a file that imports the sdk.
// patterns work for both ts/js and python since most sdk method names are identical.
const LLM_CALL_PATTERNS: Record<string, RegExp[]> = {
    'openai': [
        /\.chat\.completions\.create\s*\(/,
        /\.completions\.create\s*\(/,
        /\.embeddings\.create\s*\(/,
        /\.images\.generate\s*\(/,
        // python: old openai sdk (< 1.0)
        /openai\.ChatCompletion\.create\s*\(/,
        /openai\.Completion\.create\s*\(/,
        /openai\.Embedding\.create\s*\(/,
    ],
    'anthropic': [
        /\.messages\.create\s*\(/,
        /\.messages\.stream\s*\(/,
    ],
    'gemini': [
        /\.generateContent\s*\(/,
        /getGenerativeModel\s*\(/,
        /\.startChat\s*\(/,
        /genai\.GenerativeModel\s*\(/,      // python
        /model\.generate_content\s*\(/,     // python
    ],
    'mistral': [
        /\.chat\.complete\s*\(/,
        /mistral\.chat\s*\(/,
    ],
    'groq': [
        /\.chat\.completions\.create\s*\(/,
    ],
    'cohere': [
        /\.generate\s*\(/,
        /co\.generate\s*\(/,
        /\.chat\s*\(/,
        /co\.embed\s*\(/,
    ],
    'vertex-ai': [
        /\.predict\s*\(/,
        /\.predict_async\s*\(/,
        /\.generateContent\s*\(/,
    ],
    'langchain': [
        /new\s+Chat(?:OpenAI|Anthropic|Google|Mistral|Groq|Cohere)\s*\(/,
        /Chat(?:OpenAI|Anthropic|Google|Mistral|Groq|Cohere)\s*\(/,  // python
        /\.invoke\s*\(/,
        /\.stream\s*\(/,
        /\.batch\s*\(/,
    ],
    'vercel-ai': [
        /generateText\s*\(/,
        /streamText\s*\(/,
        /generateObject\s*\(/,
        /streamObject\s*\(/,
    ],
};

// fallback for providers not specifically listed — broad enough to catch most sdks
const GENERIC_LLM_CALL_PATTERNS = [
    /\.create\s*\(/,
    /\.complete\s*\(/,
    /\.generate\s*\(/,
    /\.invoke\s*\(/,
];

// returns true if the function body contains an actual api call for the given provider.
// prevents over-classification of utility functions that happen to live in a file
// that imports an llm sdk but don't themselves make any api calls.
export function hasLlmCallSite(body: string, provider: string): boolean {
    const patterns = LLM_CALL_PATTERNS[provider] ?? GENERIC_LLM_CALL_PATTERNS;
    return patterns.some(p => p.test(body));
}

// catch-all prefixes for known llm sdk families — any package under these namespaces is llm.
// avoids needing individual entries for every @langchain/x, @ai-sdk/x, etc.
const LLM_FAMILY_PREFIXES = ['@langchain/', '@ai-sdk/', '@llamaindex/'];

// looks up a package/module name in the registry.
// for js: tries exact match, then llm family prefixes, then registry prefix match.
// for python: tries full dotted name, then root module.
export function lookupProvider(pkg: string): ProviderInfo | null {
    const lower = pkg.toLowerCase();

    // js exact match
    if (JS_PACKAGES[lower]) return JS_PACKAGES[lower];

    // catch-all for known llm sdk families
    for (const prefix of LLM_FAMILY_PREFIXES) {
        if (lower.startsWith(prefix)) return { provider: lower, category: 'llm' };
    }

    // js prefix match (handles @aws-sdk/client-s3, @google-cloud/storage, etc.)
    for (const key of Object.keys(JS_PACKAGES)) {
        if (lower.startsWith(key)) return JS_PACKAGES[key];
    }

    // python full dotted name (e.g. google.generativeai)
    if (PYTHON_MODULES[lower]) return PYTHON_MODULES[lower];

    // python root module fallback
    const root = lower.split('.')[0];
    if (PYTHON_MODULES[root]) return PYTHON_MODULES[root];

    return null;
}
