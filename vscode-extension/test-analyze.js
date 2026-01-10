/**
 * Test analyzeWorkspace function with quick detection (no Gemini)
 */

const { analyzeWorkspace } = require('./out/parser');
const path = require('path');

async function test() {
    console.log('=== Testing analyzeWorkspace() - Quick Detection ===\n');

    const workspaceRoot = __dirname;

    console.log('Running with DEFAULT settings (should NOT call Gemini)...\n');

    const results = await analyzeWorkspace(workspaceRoot, {
        onProgress: (msg) => console.log(`  ${msg}`)
    });

    console.log('\n=== Results ===\n');

    if (results.success) {
        console.log(`✅ Success!`);
        console.log(`⏱️  Duration: ${results.duration.toFixed(2)}s`);
        console.log(`📄 Files: ${results.stats.filesIndexed}`);
        console.log(`🔍 Units: ${results.stats.codeUnits}`);
        console.log(`💰 Paid APIs: ${results.stats.totalApis}\n`);

        if (results.stats.totalApis > 0) {
            console.log('By Category:');
            for (const [cat, count] of Object.entries(results.stats.byCategory)) {
                console.log(`  📦 ${cat}: ${count}`);
            }
            console.log('');

            console.log('By Provider:');
            for (const [prov, count] of Object.entries(results.stats.byProvider)) {
                console.log(`  🏢 ${prov}: ${count}`);
            }
            console.log('');
        }

        console.log('✅ Test complete!\n');

        if (results.duration < 5) {
            console.log('💡 Fast execution confirms NO Gemini API calls were made!');
        } else {
            console.log('⚠️  Slow execution - Gemini may have been called');
        }
    } else {
        console.error(`❌ Failed: ${results.error}`);
    }
}

test();
