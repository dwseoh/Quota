import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class MerchantService {
    
    async categorizeMerchant(merchantName: string): Promise<string> {
        
        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                { role: 'system', content: 'Classify this merchant into a category (Food, Travel, Retail, etc).' },
                { role: 'user', content: merchantName }
            ]
        });

        return response.choices[0].message.content || 'Unknown';
    }

    async categorizeLegacy(merchantName: string) {
        const response = await openai.completions.create({
            model: 'text-davinci-003',
            prompt: `Classify: ${merchantName}`,
            max_tokens: 10
        });
        return response.choices[0].text;
    }
}
