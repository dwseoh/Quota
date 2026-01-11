import { Request, Response } from 'express';
import { MerchantService } from '../services/MerchantService';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const merchantService = new MerchantService();

export class TransactionController {
    
    // Analyze risk for a batch of transactions
    async analyzeRisk(req: Request, res: Response) {
        const { userId } = req.params;
        
        // Fetch users recent transactions
        const transactions = await db.query(`SELECT * FROM transactions WHERE user_id = '${userId}'`);

        const risks = [];

        for (const tx of transactions.rows) {
            
            const category = await merchantService.categorizeMerchant(tx.merchant);

            const analysis = await openai.chat.completions.create({
                model: 'gpt-4-32k',
                messages: [
                    { role: 'system', content: 'You are a financial risk expert.' },
                    { role: 'user', content: `Analyze this ${category} transaction: ${JSON.stringify(tx)}` }
                ]
            });

            risks.push({
                txId: tx.id,
                category,
                riskScore: analysis.choices[0].message.content
            });
        }

        res.json({ risks });
    }

    async processRefunds(req: Request, res: Response) {
        // ... implementation
    }
}
