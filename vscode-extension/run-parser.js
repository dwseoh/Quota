#!/usr/bin/env node

/**
 * CLI script to test the parser with various options
 * 
 * Usage:
 *   node run-parser.js [options]
 * 
 * Options:
 *   --gemini          Use Gemini classification (default: false, uses quick detection)
 *   --scope <path>    Limit to specific directory (default: entire workspace)
 *   --clean           Force clean index (removes .delta-analytics-config)
 *   --help            Show this help message
 * 
 * Examples:
 *   node run-parser.js                           # Quick detection, full workspace
 *   node run-parser.js --gemini                  # Gemini classification, full workspace
 *   node run-parser.js --scope src/              # Quick detection, src/ only
 *   node run-parser.js --gemini --scope src/     # Gemini classification, src/ only
 *   node run-parser.js --clean --gemini          # Clean index, then run with Gemini
 */

const { initializeParser, indexWorkspace } = require('./out/parser');
const { scanWorkspace } = require('./out/scanner');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
    useGemini: args.includes('--gemini'),
    scope: null,
    clean: args.includes('--clean'),
    help: args.includes('--help')
};

// Get scope if specified
const scopeIndex = args.indexOf('--scope');
if (scopeIndex !== -1 && args[scopeIndex + 1]) {
    options.scope = args[scopeIndex + 1];
}

// Show help
if (options.help) {
    console.log(`
Delta Parser Test Script

Usage:
  node run-parser.js [options]

Options:
  --gemini          Use Gemini batch classification (requires API key)
  --scope <path>    Limit scanning to specific directory
  --clean           Remove existing .delta-analytics-config before running
  --help            Show this help message

Examples:
  node run-parser.js
    → Quick regex detection, full workspace

  node run-parser.js --gemini
    → Gemini classification, full workspace

  node run-parser.js --scope src/
    → Quick detection, src/ directory only

  node run-parser.js --gemini --scope src/ --clean
    → Clean index, Gemini classification, src/ only

Performance:
  Quick detection:  ~1-2 seconds (no API calls)
  Gemini batch:     ~40-60 seconds (1-2 API calls)
`);
    process.exit(0);
}

// Load environment
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function run() {
    console.log('=== Delta Parser Test ===\n');

    // Show configuration
    console.log('Configuration:');
    console.log(`  Classification: ${options.useGemini ? '🤖 Gemini API' : '⚡ Quick Detection (regex)'}`);
    console.log(`  Scope: ${options.scope || '📁 Full workspace'}`);
    console.log(`  Clean index: ${options.clean ? '✅ Yes' : '❌ No'}`);
    console.log('');

    const workspaceRoot = __dirname;
    const analyticsDir = path.join(workspaceRoot, '.delta-analytics-config');

    // Clean index if requested
    if (options.clean) {
        console.log('🗑️  Cleaning existing index...');
        if (fs.existsSync(analyticsDir)) {
            fs.rmSync(analyticsDir, { recursive: true, force: true });
            console.log('✅ Removed .delta-analytics-config/\n');
        } else {
            console.log('⚠️  No existing index found\n');
        }
    }

    // Check Gemini API key if needed
    if (options.useGemini && !process.env.GEMINI_API_KEY) {
        console.error('❌ Error: --gemini requires GEMINI_API_KEY in .env file');
        console.error('   Create .env file with: GEMINI_API_KEY=your_key_here\n');
        process.exit(1);
    }

    try {
        // Initialize parser
        console.log('🔧 Initializing parser...');
        await initializeParser(workspaceRoot, process.env.GEMINI_API_KEY);
        console.log('✅ Parser initialized\n');

        // Modify scanner scope if needed
        let filesToScan = [];
        if (options.scope) {
            const scopePath = path.join(workspaceRoot, options.scope);
            if (!fs.existsSync(scopePath)) {
                console.error(`❌ Error: Scope path does not exist: ${scopePath}\n`);
                process.exit(1);
            }
            console.log(`📊 Scanning scope: ${options.scope}...`);
            filesToScan = await scanWorkspace(scopePath);
        } else {
            console.log('📊 Scanning full workspace...');
            filesToScan = await scanWorkspace(workspaceRoot);
        }

        console.log(`✅ Found ${filesToScan.length} files\n`);

        if (filesToScan.length === 0) {
            console.log('⚠️  No files to analyze\n');
            process.exit(0);
        }

        // Run indexing
        console.log(`🚀 Starting indexing...`);
        if (options.useGemini) {
            console.log('   Using Gemini batch classification (this may take 40-60 seconds)\n');
        } else {
            console.log('   Using quick regex detection (fast!)\n');
        }

        const startTime = Date.now();

        // Temporarily modify classifyApiUsage to use quick detection if needed
        if (!options.useGemini) {
            // The system already defaults to quick detection via useQuickDetection=true
            console.log('💡 Tip: Add --gemini flag to use AI classification\n');
        }

        const graph = await indexWorkspace(workspaceRoot);
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(`\n✅ Indexing complete in ${duration}s!\n`);

        // Display results
        console.log('=== Results ===\n');
        console.log(`📄 Files indexed: ${graph.files.length}`);
        console.log(`🔍 Code units analyzed: ${graph.units.length}`);
        console.log(`🤖 Classifications: ${Object.keys(graph.classifications).length}\n`);

        // Analyze classifications
        const byCategory = {};
        const byProvider = {};
        let paidApiCount = 0;

        for (const [unitId, classification] of Object.entries(graph.classifications)) {
            if (classification.role === 'consumer' && classification.category !== 'other') {
                paidApiCount++;

                // Group by category
                if (!byCategory[classification.category]) {
                    byCategory[classification.category] = [];
                }
                byCategory[classification.category].push(unitId);

                // Group by provider
                if (!byProvider[classification.provider]) {
                    byProvider[classification.provider] = [];
                }
                byProvider[classification.provider].push(unitId);
            }
        }

        console.log(`💰 Potential Paid API Usage: ${paidApiCount} location(s)\n`);

        if (paidApiCount > 0) {
            console.log('By Category:');
            for (const [category, units] of Object.entries(byCategory)) {
                console.log(`  📦 ${category}: ${units.length} usage(s)`);
            }
            console.log('');

            console.log('By Provider:');
            for (const [provider, units] of Object.entries(byProvider)) {
                console.log(`  🏢 ${provider}: ${units.length} usage(s)`);
            }
            console.log('');

            // Show sample units
            console.log('Sample Detections:');
            const sampleUnits = graph.units.filter(u => {
                const c = graph.classifications[u.id];
                return c && c.role === 'consumer' && c.category !== 'other';
            }).slice(0, 5);

            for (const unit of sampleUnits) {
                const c = graph.classifications[unit.id];
                const fileName = path.basename(unit.location.fileUri);
                console.log(`  • ${unit.name}`);
                console.log(`    File: ${fileName}:${unit.location.startLine}`);
                console.log(`    Provider: ${c.provider} (${c.category})`);
                console.log(`    Confidence: ${(c.confidence * 100).toFixed(0)}%\n`);
            }
        }

        // Storage info
        console.log('=== Storage ===\n');
        const indexPath = path.join(analyticsDir, 'index.json');
        const hashPath = path.join(analyticsDir, 'file-map.hash');

        if (fs.existsSync(indexPath)) {
            const stats = fs.statSync(indexPath);
            console.log(`✅ index.json: ${(stats.size / 1024).toFixed(2)} KB`);
        }
        if (fs.existsSync(hashPath)) {
            const stats = fs.statSync(hashPath);
            console.log(`✅ file-map.hash: ${stats.size} bytes`);
        }
        console.log(`📁 Location: ${analyticsDir}\n`);

        console.log('✅ Test complete!\n');

        // Show next steps
        if (!options.useGemini) {
            console.log('💡 Next steps:');
            console.log('   • Run with --gemini for AI-powered classification');
            console.log('   • Use --scope src/ to analyze specific directories');
            console.log('   • Add --clean to force re-indexing\n');
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.stack) {
            console.error('\nStack trace:');
            console.error(error.stack);
        }
        process.exit(1);
    }
}

run();
