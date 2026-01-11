import { pricing_table } from '../types';

export const pricing: pricing_table = {
  // --- OpenAI ---
  'gpt-5': { input: 0.00125, output: 0.01 },
  'gpt-5-mini': { input: 0.00025, output: 0.002 },
  'gpt-5-pro': { input: 0.015, output: 0.12 },
  'o1': { input: 0.015, output: 0.06 },
  'o1-mini': { input: 0.0011, output: 0.0044 },
  'o3-mini': { input: 0.0011, output: 0.0044 },
  'gpt-4.1': { input: 0.002, output: 0.008 },
  'gpt-4o': { input: 0.0025, output: 0.01 },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-4-32k': { input: 0.06, output: 0.12 }, // Legacy High Cost
  'text-embedding-3-small': { input: 0.00002, output: 0 },
  'text-embedding-3-large': { input: 0.00013, output: 0 },
  'dall-e-3': { input: 0.08, output: 0.08 }, // Standard 1024x1024

  // --- Anthropic ---
  'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
  'claude-3-5-sonnet-latest': { input: 0.003, output: 0.015 },
  'claude-3-5-haiku-latest': { input: 0.0008, output: 0.004 },
  'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },

  // --- Google Gemini ---
  'gemini-3-pro': { input: 0.002, output: 0.012 },
  'gemini-2.5-pro': { input: 0.00125, output: 0.01 },
  'gemini-2.5-flash': { input: 0.00015, output: 0.0006 },
  'gemini-2.5-flash-lite': { input: 0.0001, output: 0.0004 },
  'gemini-1.5-pro': { input: 0.0035, output: 0.0105 },
  'gemini-1.5-flash': { input: 0.00035, output: 0.00105 },

  // --- Mistral AI ---
  'mistral-large-latest': { input: 0.002, output: 0.006 },
  'mistral-medium-latest': { input: 0.0004, output: 0.002 },
  'mistral-small-latest': { input: 0.0001, output: 0.0003 },
  'codestral-latest': { input: 0.0003, output: 0.0009 },

  // --- Cohere ---
  'command-r-plus': { input: 0.0025, output: 0.01 },
  'command-r': { input: 0.00015, output: 0.0006 },
  'embed-english-v3.0': { input: 0.0001, output: 0 },

  // --- AWS Bedrock ---
  'anthropic.claude-3-5-sonnet-v2': { input: 0.003, output: 0.015 },
  'meta.llama-3.3-70b-instruct': { input: 0.00059, output: 0.00079 },
  'amazon.titan-text-express-v1': { input: 0.0008, output: 0.0016 },

  // --- Maps & Location ---
  'mapbox-geocoding': { input: 0.50, output: 0 }, 
  'google-maps-places': { input: 17.00, output: 0 }, 
  'google-maps-directions': { input: 5.00, output: 0 },

  // --- Payments & Finance ---
  'stripe-tax-api': { input: 0.05, output: 0 }, // per calculation
  'plaid-auth': { input: 1.50, output: 0 }, // per auth session
  'plaid-balance': { input: 0.30, output: 0 },

  // --- Communication ---
  'twilio-sms': { input: 0.0083, output: 0 }, // per msg
  'twilio-voice': { input: 0.014, output: 0 }, // per min
  'sendgrid-email': { input: 0.0004, output: 0 }, // ~Essentials tier 50k/mo

  // --- Search & Data ---
  'algolia-search': { input: 0.50, output: 0 }, // Grow plan per 1k
  'pinecone-read': { input: 0.016, output: 0 }, // per 1k Read Units ($16/M)
  'pinecone-write': { input: 0.004, output: 0 }, // per 1k Write Units ($4/M)

  // --- Auth & Monitoring ---
  'clerk-monthly-user': { input: 0.02, output: 0 }, // post-10k MAU rate
  'auth0-m2m-token': { input: 0.001, output: 0 }, // estimated per token fetch
  'datadog-log-ingest': { input: 0.10, output: 0 }, // per GB (mapped to 1 unit)
  'sentry-errors': { input: 0.00052, output: 0 }, // based on $26/50k plan

  // --- Infrastructure ---
  'vercel-invocation': { input: 0.0006, output: 0 }, // per 1k ($0.60/M)
  'vercel-gb-hour': { input: 0.18, output: 0 },
  'lambda-gb-second': { input: 0.0000166667, output: 0 },
  
  // --- Groq (Inference as a Service) ---
  'llama-3.3-70b-groq': { input: 0.00059, output: 0.00079 },
  'llama-3.1-8b-groq': { input: 0.00005, output: 0.00008 }
};