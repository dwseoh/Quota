// static fallback pricing — only used when litellm fetch fails and no disk cache exists.
// do not add models here manually; the live table from pricing_fetcher.ts is the source of truth.
// last verified: 2026-03-25

import { pricing_table } from '../types';

export const pricing: pricing_table = {
    'gpt-4o':                   { input: 0.0025,  output: 0.01   },
    'gpt-4o-mini':              { input: 0.00015, output: 0.0006 },
    'claude-3-5-sonnet-latest': { input: 0.003,   output: 0.015  },
    'claude-3-5-haiku-latest':  { input: 0.0008,  output: 0.004  },
    'gemini-2.0-flash':         { input: 0.0001,  output: 0.0004 },
    'gemini-1.5-pro':           { input: 0.00125, output: 0.005  },
};
