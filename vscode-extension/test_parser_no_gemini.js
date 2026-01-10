"use strict";
/**
 * test_parser_no_gemini.ts - Test AST parsing without Gemini API
 * Run with: npx ts-node test_parser_no_gemini.ts
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
const ast_parser_1 = require("./src/ast_parser");
const scanner_1 = require("./src/scanner");
async function runTest() {
    console.log('=== AST Parser Test (No Gemini) ===\n');
    const workspaceRoot = __dirname;
    console.log(`📁 Workspace root: ${workspaceRoot}\n`);
    try {
        // Scan workspace
        console.log('📊 Scanning workspace...');
        const files = await (0, scanner_1.scanWorkspace)(workspaceRoot);
        console.log(`✅ Found ${files.length} files\n`);
        // Parse test files specifically
        const testFiles = [
            path.join(workspaceRoot, 'test_files', 'test_openai.py'),
            path.join(workspaceRoot, 'test_files', 'test_anthropic.ts')
        ];
        console.log('=== Parsing Test Files ===\n');
        for (const filePath of testFiles) {
            console.log(`📄 ${path.basename(filePath)}`);
            console.log(`   Path: ${filePath}\n`);
            const units = await (0, ast_parser_1.parseFile)(filePath);
            console.log(`   Found ${units.length} code unit(s):\n`);
            for (const unit of units) {
                console.log(`   ✨ ${unit.type}: ${unit.name}`);
                console.log(`      Lines: ${unit.location.startLine}-${unit.location.endLine}`);
                console.log(`      Dependencies: ${unit.dependencies.length} import(s)`);
                // Show first few lines of code
                const codePreview = unit.body.split('\n').slice(0, 3).join('\n');
                console.log(`      Code preview:`);
                console.log(`      ${codePreview.split('\n').join('\n      ')}`);
                console.log('');
            }
            console.log('---\n');
        }
        // Test quick provider detection (regex-based, no API)
        console.log('=== Quick Provider Detection (Regex) ===\n');
        const { detectProvidersQuick } = await import('./src/intelligence');
        for (const filePath of testFiles) {
            const units = await (0, ast_parser_1.parseFile)(filePath);
            console.log(`📄 ${path.basename(filePath)}:\n`);
            for (const unit of units) {
                const bundle = {
                    code: unit.body,
                    imports: unit.dependencies.join('\n'),
                    location: unit.location
                };
                const providers = detectProvidersQuick(bundle);
                if (providers.length > 0) {
                    console.log(`   ✅ ${unit.name}`);
                    console.log(`      Detected providers: ${providers.join(', ')}`);
                }
            }
            console.log('');
        }
        console.log('✅ AST parsing test completed successfully!\n');
        console.log('💡 Note: Gemini API classification was skipped to avoid quota limits.');
        console.log('   The regex-based detection above shows what providers were found.\n');
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
//# sourceMappingURL=test_parser_no_gemini.js.map