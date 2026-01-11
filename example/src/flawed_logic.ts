
import { OpenAI } from 'openai';
import { DynamoDB } from 'aws-sdk';
import { Client } from 'pg';
import Anthropic from '@anthropic-ai/sdk';
import { redis } from './redis-mock'; // Mock

const openai = new OpenAI();
const anthropic = new Anthropic();
const dynamodb = new DynamoDB();

async function expensiveLoop() {
    const users = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    
    // FLAW 1: API Call inside loop (N+1) - Critical Warning
    // Suggestion: Implement Read-Through Cache
    for (const user of users) {
        console.log(`Processing user ${user}`);
        await openai.chat.completions.create({
            messages: [{ role: 'user', content: 'hello' }],
            model: 'gpt-3.5-turbo'
        });
    }
}

async function loopWithCache() {
    const items = [1, 2, 3];
    
    // FLAW 1b: Loop with Cache - Low Severity (Info)
    // Suggestion: Verify Cache Effectiveness
    for (const item of items) {
        if (await redis.get(`item:${item}`)) continue;
        
        await openai.chat.completions.create({
             model: 'gpt-3.5-turbo',
             messages: []
        });
    }
}

async function legacyModelUsage() {
    // FLAW 2: Expensive Legacy Model
    const response = await openai.chat.completions.create({
        messages: [{ role: 'user', content: 'analyze this' }],
        model: "gpt-4-32k" // Should trigger warning
    });

    // FLAW 2b: Deprecated Model
    const oldRes = await openai.completions.create({
        model: "text-davinci-003",
        prompt: "hello"
    });
}

async function promptCachingOpportunity() {
    // FLAW 6: Large Context without Prompt Caching
    // Suggestion: Use Prompt Caching
    const hugeContext = "A".repeat(50000); // 10k+ tokens
    const msg = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        messages: [{ role: 'user', content: hugeContext }]
    });
}

async function badDatabasePractices() {
    // FLAW 3: Full Table Scan
    const result = await dynamodb.scan({
        TableName: 'Orders'
    }).promise();

    // FLAW 4: Unoptimized SQL
    const client = new Client();
    await client.connect();
    // explicit SELECT * in string
    const query = "SELECT * FROM large_audit_logs"; 
    await client.query(query);

    // FLAW 7: Mongo No Projection
    // Suggestion: Use projection
    const db: any = {};
    await db.collection('users').find({});
}

async function nestedLoops() {
    const activeRegions = ['us-east-1', 'eu-west-1'];
    
    while (true) {
        // FLAW 5: DB Query inside nested loop
        for (const region of activeRegions) {
            await fetch(`https://api.my-service.com/${region}/status`);
        }
        await new Promise(r => setTimeout(r, 60000));
    }
}
