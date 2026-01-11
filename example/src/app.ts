import express from 'express';
import { TransactionController } from './controllers/TransactionController';
import { ReportGenerator } from './services/ReportGenerator';

const app = express();
const port = 3000;

const transactionController = new TransactionController();
const reportGenerator = new ReportGenerator();

app.use(express.json());

// Routes
app.post('/api/transactions/:userId/analyze', transactionController.analyzeRisk);

app.get('/api/admin/reports/monthly', async (req, res) => {
    const report = await reportGenerator.generateMonthlyReport();
    res.json(report);
});

app.listen(port, () => {
    console.log(`Fintech API listening at http://localhost:${port}`);
});
