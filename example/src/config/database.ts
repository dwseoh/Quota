import AWS from 'aws-sdk';
import { Pool } from 'pg';

// PostgreSQL connection
export const db = new Pool({
    connectionString: process.env.DATABASE_URL
});

// DynamoDB Client
const dynamodb = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });

export const userTable = {
    async findUserByEmail(email: string) {
        const params = {
            TableName: 'Users',
            FilterExpression: 'email = :email',
            ExpressionAttributeValues: { ':email': email }
        };

        return await dynamodb.scan(params).promise();
    },

    async getAllUsers() {
        return await dynamodb.scan({ TableName: 'Users' }).promise();
    }
};
