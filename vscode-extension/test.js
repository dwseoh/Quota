/**
 * Test batch classification with Gemini
 */

const { initializeParser, indexWorkspace } = require('./out/parser');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function test() {
    console.log('=== Testing Batch Classification ===\n');

    if (!process.env.GEMINI_API_KEY) {
        console.error('❌ No API key');
        process.exit(1);
    }

    const workspaceRoot = __dirname;

    try {
        console.log('✅ API key loaded');
        console.log('🔧 Initializing parser...\n');
        await initializeParser(workspaceRoot, process.env.GEMINI_API_KEY);

        console.log('📊 Starting workspace indexing with BATCH classification...');
        console.log('   This should be MUCH faster (1-2 API calls instead of 50+)\n');

        const start = Date.now();
        const graph = await indexWorkspace(workspaceRoot);
        const duration = ((Date.now() - start) / 1000).toFixed(2);

        console.log(`\n✅ Complete in ${duration}s!\n`);
        console.log(`📄 Files: ${graph.files.length}`);
        console.log(`🔍 Units: ${graph.units.length}`);
        console.log(`🤖 Classifications: ${Object.keys(graph.classifications).length}\n`);

        // Show paid API usage
        const paidApis = graph.units.filter(u => {
            const c = graph.classifications[u.id];
            return c && c.role === 'consumer' && c.category !== 'other';
        });

        console.log(`💰 Potential Paid API Usage: ${paidApis.length} locations\n`);

        if (paidApis.length > 0) {
            const byProvider = {};
            paidApis.forEach(u => {
                const provider = graph.classifications[u.id].provider;
                if (!byProvider[provider]) byProvider[provider] = [];
                byProvider[provider].push(u.name);
            });

            for (const [provider, units] of Object.entries(byProvider)) {
                console.log(`  📦 ${provider}: ${units.length} usage(s)`);
            }
        }

        console.log('\n✅ Test complete!\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

test();
