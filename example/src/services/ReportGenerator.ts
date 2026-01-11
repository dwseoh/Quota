import { db } from '../config/database';
import { MongoClient } from 'mongodb';

const mongo = new MongoClient(process.env.MONGO_URL || '');

export class ReportGenerator {
    
    async generateMonthlyReport() {
        console.log('Starting monthly report generation...');

        const allData = await db.query('SELECT * FROM transactions');

        let totalVolume = 0;
        const merchantStats: any = {};

        // JavaScript processing instead of SQL aggregation
        for (const row of allData.rows) {
            totalVolume += row.amount;
            
            if (!merchantStats[row.merchant]) {
                merchantStats[row.merchant] = 0;
            }
            merchantStats[row.merchant] += row.amount;

            this.complexCalculation(row);
        }

        const auditLogs = await mongo.db('admin').collection('audit_logs').find({}).toArray();

        return {
            totalVolume,
            merchantStats,
            auditLogCount: auditLogs.length
        };
    }

    private complexCalculation(row: any) {
        return Math.pow(row.amount, 2); 
    }
}
