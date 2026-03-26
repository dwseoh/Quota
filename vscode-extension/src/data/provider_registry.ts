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

// c# namespace prefixes and nuget package ids → provider info
// matches both `using` statement namespaces and .csproj PackageReference Include values
export const CSHARP_PACKAGES: Record<string, ProviderInfo> = {
    // llm
    'OpenAI':                       { provider: 'openai',      category: 'llm' },
    'Azure.AI.OpenAI':              { provider: 'openai',      category: 'llm' },
    'Anthropic':                    { provider: 'anthropic',   category: 'llm' },
    'Anthropic.SDK':                { provider: 'anthropic',   category: 'llm' },
    'Microsoft.SemanticKernel':     { provider: 'langchain',   category: 'llm' },
    'LangChain':                    { provider: 'langchain',   category: 'llm' },
    'Betalgo.Ranul.OpenAI':         { provider: 'openai',      category: 'llm' },

    // payment
    'Stripe':                       { provider: 'stripe',      category: 'payment' },
    'Braintree':                    { provider: 'braintree',   category: 'payment' },
    'PayPalCheckoutSdk':            { provider: 'paypal',      category: 'payment' },

    // database
    'MongoDB':                      { provider: 'mongodb',     category: 'database' },
    'Supabase':                     { provider: 'supabase',    category: 'database' },
    'StackExchange.Redis':          { provider: 'redis',       category: 'database' },
    'Npgsql':                       { provider: 'postgres',    category: 'database' },
    'MySql.Data':                   { provider: 'mysql',       category: 'database' },
    'MySqlConnector':               { provider: 'mysql',       category: 'database' },

    // communication
    'Twilio':                       { provider: 'twilio',      category: 'communication' },
    'SendGrid':                     { provider: 'sendgrid',    category: 'communication' },
    'Resend':                       { provider: 'resend',      category: 'communication' },

    // cloud
    'Amazon':                       { provider: 'aws',         category: 'cloud' },
    'AWSSDK':                       { provider: 'aws',         category: 'cloud' },
    'Google.Cloud':                 { provider: 'gcp',         category: 'cloud' },
    'Azure':                        { provider: 'azure',       category: 'cloud' },
    'Cloudinary':                   { provider: 'cloudinary',  category: 'cloud' },

    // search / vector
    'Pinecone':                     { provider: 'pinecone',    category: 'search' },
    'Elastic':                      { provider: 'elasticsearch', category: 'search' },
    'Algolia':                      { provider: 'algolia',     category: 'search' },

    // monitoring
    'Sentry':                       { provider: 'sentry',      category: 'monitoring' },
    'Datadog':                      { provider: 'datadog',     category: 'monitoring' },
    'PostHog':                      { provider: 'posthog',     category: 'monitoring' },

    // auth
    'Auth0':                        { provider: 'auth0',       category: 'auth' },
};

// java package prefixes → provider info
// java imports are dotted class paths (e.g. com.openai.OpenAIClient) — prefix match on root package
export const JAVA_PACKAGES: Record<string, ProviderInfo> = {
    // llm
    'com.openai':                   { provider: 'openai',      category: 'llm' },
    'com.anthropic':                { provider: 'anthropic',   category: 'llm' },
    'dev.langchain4j':              { provider: 'langchain',   category: 'llm' },
    'com.google.cloud.vertexai':    { provider: 'vertex-ai',   category: 'llm' },

    // payment
    'com.stripe':                   { provider: 'stripe',      category: 'payment' },
    'com.braintreegateway':         { provider: 'braintree',   category: 'payment' },
    'com.paypal':                   { provider: 'paypal',      category: 'payment' },

    // database
    'com.mongodb':                  { provider: 'mongodb',     category: 'database' },
    'org.springframework.data':     { provider: 'mongodb',     category: 'database' },
    'io.github.jan-tennant.supabase': { provider: 'supabase',  category: 'database' },
    'redis.clients':                { provider: 'redis',       category: 'database' },
    'io.lettuce':                   { provider: 'redis',       category: 'database' },
    'org.postgresql':               { provider: 'postgres',    category: 'database' },
    'com.mysql':                    { provider: 'mysql',       category: 'database' },

    // communication
    'com.twilio':                   { provider: 'twilio',      category: 'communication' },
    'com.sendgrid':                 { provider: 'sendgrid',    category: 'communication' },

    // cloud
    'software.amazon.awssdk':       { provider: 'aws',         category: 'cloud' },
    'com.amazonaws':                { provider: 'aws',         category: 'cloud' },
    'com.google.cloud':             { provider: 'gcp',         category: 'cloud' },
    'com.azure':                    { provider: 'azure',       category: 'cloud' },

    // search / vector
    'io.pinecone':                  { provider: 'pinecone',    category: 'search' },
    'co.elastic.clients':           { provider: 'elasticsearch', category: 'search' },
    'org.elasticsearch.client':     { provider: 'elasticsearch', category: 'search' },

    // monitoring
    'io.sentry':                    { provider: 'sentry',      category: 'monitoring' },
    'com.datadoghq':                { provider: 'datadog',     category: 'monitoring' },

    // auth
    'com.auth0':                    { provider: 'auth0',       category: 'auth' },
};

// go module paths → provider info
// prefix entries (e.g. 'github.com/aws/aws-sdk-go') match any subpackage import
export const GO_PACKAGES: Record<string, ProviderInfo> = {
    // llm
    'github.com/openai/openai-go':              { provider: 'openai',      category: 'llm' },
    'github.com/sashabaranov/go-openai':        { provider: 'openai',      category: 'llm' },
    'github.com/anthropics/anthropic-sdk-go':   { provider: 'anthropic',   category: 'llm' },
    'github.com/google/generative-ai-go':       { provider: 'gemini',      category: 'llm' },
    'github.com/tmc/langchaingo':               { provider: 'langchain',   category: 'llm' },

    // payment
    'github.com/stripe/stripe-go':              { provider: 'stripe',      category: 'payment' },

    // database
    'go.mongodb.org/mongo-driver':              { provider: 'mongodb',     category: 'database' },
    'github.com/supabase-community/supabase-go': { provider: 'supabase',   category: 'database' },
    'github.com/redis/go-redis':                { provider: 'redis',       category: 'database' },
    'github.com/go-redis/redis':                { provider: 'redis',       category: 'database' },

    // cloud — prefix match handles subpackage imports like aws-sdk-go-v2/service/s3
    'github.com/aws/aws-sdk-go-v2':             { provider: 'aws',         category: 'cloud' },
    'github.com/aws/aws-sdk-go':                { provider: 'aws',         category: 'cloud' },
    'cloud.google.com/go':                      { provider: 'gcp',         category: 'cloud' },
    'github.com/Azure/azure-sdk-for-go':        { provider: 'azure',       category: 'cloud' },

    // communication
    'github.com/twilio/twilio-go':              { provider: 'twilio',      category: 'communication' },
    'github.com/sendgrid/sendgrid-go':          { provider: 'sendgrid',    category: 'communication' },

    // search / vector
    'github.com/pinecone-io/go-pinecone':       { provider: 'pinecone',    category: 'search' },
    'github.com/elastic/go-elasticsearch':      { provider: 'elasticsearch', category: 'search' },

    // monitoring
    'github.com/getsentry/sentry-go':           { provider: 'sentry',      category: 'monitoring' },
    'github.com/DataDog/datadog-go':            { provider: 'datadog',     category: 'monitoring' },
    'github.com/posthog/posthog-go':            { provider: 'posthog',     category: 'monitoring' },
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
    if (quotedMatch) {return quotedMatch[1];}

    // python: from pkg.sub import ... or import pkg.sub
    const fromMatch = trimmed.match(/^from\s+([\w.]+)/);
    if (fromMatch) {return fromMatch[1];}

    const importMatch = trimmed.match(/^import\s+([\w.]+)/);
    if (importMatch) {return importMatch[1];}

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
    if (JS_PACKAGES[lower]) {return JS_PACKAGES[lower];}

    // catch-all for known llm sdk families
    for (const prefix of LLM_FAMILY_PREFIXES) {
        if (lower.startsWith(prefix)) {return { provider: lower, category: 'llm' };}
    }

    // js prefix match (handles @aws-sdk/client-s3, @google-cloud/storage, etc.)
    for (const key of Object.keys(JS_PACKAGES)) {
        if (lower.startsWith(key)) {return JS_PACKAGES[key];}
    }

    // python full dotted name (e.g. google.generativeai)
    if (PYTHON_MODULES[lower]) {return PYTHON_MODULES[lower];}

    // python root module fallback
    const root = lower.split('.')[0];
    if (PYTHON_MODULES[root]) {return PYTHON_MODULES[root];}

    // java prefix match (e.g. com.openai.OpenAIClient → com.openai)
    for (const key of Object.keys(JAVA_PACKAGES)) {
        if (pkg.startsWith(key)) {return JAVA_PACKAGES[key];}
    }

    // go exact match
    if (GO_PACKAGES[pkg]) {return GO_PACKAGES[pkg];}

    // go prefix match (handles subpackage imports like github.com/aws/aws-sdk-go-v2/service/s3)
    for (const key of Object.keys(GO_PACKAGES)) {
        if (pkg.startsWith(key)) {return GO_PACKAGES[key];}
    }

    return null;
}
