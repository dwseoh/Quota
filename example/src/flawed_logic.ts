
import { OpenAI } from 'openai';
import { DynamoDB } from 'aws-sdk';
import { Client } from 'pg';

const openai = new OpenAI();
const dynamodb = new DynamoDB();
const dbString = "postgres://user:pass@localhost:5432/db";

async function expensiveLoop() {
    const users = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    
    // FLAW 1: API Call inside loop (N+1)
    for (const user of users) {
        console.log(`Processing user ${user}`);
        await openai.chat.completions.create({
            messages: [{ role: 'user', content: 'hello' }],
            model: 'gpt-3.5-turbo'
        });
    }
}

async function legacyModelUsage() {
    // FLAW 2: Expensive Legacy Model
    const response = await openai.chat.completions.create({
        messages: [{ role: 'user', content: 'analyze this' }],
        model: "gpt-4-32k" // Should trigger warning
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
