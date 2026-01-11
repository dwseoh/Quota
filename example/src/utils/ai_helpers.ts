import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

const openai = new OpenAI();
const anthropic = new Anthropic();

export const aiHelpers = {
    
    async summarizeText(text: string) {
        return await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: `Summarize: ${text}` }]
        });
    },

    async translateToFrench(text: string) {
        return await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: `Translate to French: ${text}` }]
        });
    },

    async extractKeywords(text: string) {
        return await openai.completions.create({
            model: 'text-davinci-002',
            prompt: `Keywords in: ${text}`,
            max_tokens: 50
        });
    },

    async analyzeSentiment(text: string) {
        return await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 100,
            messages: [{ role: 'user', content: `Sentiment of: ${text}` }]
        });
    },

    async generateEmbeddings(texts: string[]) {
        return await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: texts
        });
    },

    async moderateContent(text: string) {
        return await openai.moderations.create({
            input: text
        });
    },

    async generateCode(prompt: string) {
        return await openai.completions.create({
            model: 'code-davinci-002',
            prompt: prompt
        });
    }
};
