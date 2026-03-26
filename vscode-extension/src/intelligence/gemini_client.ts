import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

dotenv.config();

let genAI: GoogleGenerativeAI | null = null;

export function initializeGemini(apiKey?: string): void {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    return;
  }
  genAI = new GoogleGenerativeAI(key);
}

export function getGenAI(): GoogleGenerativeAI | null {
  return genAI;
}
