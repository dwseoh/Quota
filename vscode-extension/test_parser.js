"use strict";
/**
 * test_parser.ts - Test script for advanced parser
 * Run with: npx ts-node test_parser.ts
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
const parser_1 = require("./src/parser");
const dotenv = __importStar(require("dotenv"));
// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });
async function runTest() {
    console.log('=== Advanced Parser Test ===\n');
    // Check API key
    if (!process.env.GEMINI_API_KEY) {
        console.error('❌ GEMINI_API_KEY not found in .env file');
        process.exit(1);
    }
    console.log('✅ Gemini API key found\n');
    // Initialize parser
    const workspaceRoot = __dirname;
    console.log(`📁 Workspace root: ${workspaceRoot}\n`);
    try {
        console.log('🔧 Initializing parser...');
        await (0, parser_1.initializeParser)(workspaceRoot, process.env.GEMINI_API_KEY);
        console.log('✅ Parser initialized\n');
        // Index workspace
        console.log('📊 Starting workspace indexing...');
        const startTime = Date.now();
        const graph = await (0, parser_1.indexWorkspace)(workspaceRoot);
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ Indexing complete in ${duration}s\n`);
        // Display results
        console.log('=== Results ===\n');
        console.log(`📄 Files indexed: ${graph.files.length}`);
        console.log(`🔍 Code units found: ${graph.units.length}`);
        console.log(`🤖 Classifications: ${Object.keys(graph.classifications).length}\n`);
        // Show sample units
        console.log('=== Sample Code Units ===\n');
        const sampleUnits = graph.units.slice(0, 5);
        for (const unit of sampleUnits) {
            console.log(`📌 ${unit.type}: ${unit.name}`);
            console.log(`   Location: ${path.basename(unit.location.fileUri)}:${unit.location.startLine}`);
            const classification = graph.classifications[unit.id];
            if (classification) {
                console.log(`   Classification: ${classification.role} | ${classification.category} | ${classification.provider}`);
                console.log(`   Confidence: ${(classification.confidence * 100).toFixed(0)}%`);
            }
            console.log('');
        }
        // Show LLM API consumers
        console.log('=== LLM API Consumers ===\n');
        const llmConsumers = graph.units.filter(unit => {
            const classification = graph.classifications[unit.id];
            return classification && classification.role === 'consumer' && classification.category === 'llm';
        });
        if (llmConsumers.length > 0) {
            console.log(`Found ${llmConsumers.length} LLM API consumer(s):\n`);
            for (const unit of llmConsumers) {
                const classification = graph.classifications[unit.id];
                console.log(`✨ ${unit.name}`);
                console.log(`   Provider: ${classification.provider}`);
                console.log(`   File: ${path.basename(unit.location.fileUri)}:${unit.location.startLine}`);
                console.log(`   Confidence: ${(classification.confidence * 100).toFixed(0)}%`);
                console.log('');
            }
        }
        else {
            console.log('⚠️  No LLM API consumers detected');
            console.log('   This might be expected if test files don\'t contain API calls\n');
        }
        // Show storage location
        console.log('=== Storage ===\n');
        console.log(`📁 Analytics directory: ${workspaceRoot}/.delta-analytics-config/`);
        console.log(`   - index.json (${JSON.stringify(graph).length} bytes)`);
        console.log(`   - file-map.hash\n`);
        console.log('✅ Test completed successfully!\n');
    }
    catch (error) {
        console.error('❌ Test failed:', error);
        if (error instanceof Error) {
            console.error('Stack trace:', error.stack);
        }
        process.exit(1);
    }
}
// Run test
runTest();
//# sourceMappingURL=test_parser.js.map