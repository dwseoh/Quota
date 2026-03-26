/**
 * barrel — gemini client + classification api (import from here for stable paths)
 */

export { initializeGemini, getGenAI } from './intelligence/gemini_client';
export {
  classifyApiUsage,
  batchClassifyApis,
  detectProvidersQuick,
  extractApiPatterns,
} from './intelligence/classification';
