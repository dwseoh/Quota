import * as assert from 'assert';
import { LoopDetector } from '../optimization/detectors/loop_detector';
import { PatternDetector } from '../optimization/detectors/pattern_detector';
import { FileContext } from '../optimization/types';

// Simple mock for FileContext
const mockContext = (content: string, fileName: string): any => ({
    uri: { fsPath: fileName, toString: () => fileName },
    content,
    languageId: fileName.endsWith('.py') ? 'python' : 'typescript'
});

suite('Optimization Refinements', () => {

    test('LoopDetector - Detects Cache Logic (TS)', async () => {
        const detector = new LoopDetector();
        const code = `
            import { redis } from 'lib';
            const items = [];
            export async function main() {
                for (const item of items) {
                    // We have a cache check here
                    if (await redis.get(item.id)) continue;
                    openai.chat.completions.create({...});
                }
            }
        `;
        const context = mockContext(code, 'cache_test.ts');
        const suggestions = await detector.analyze(context);

        assert.strictEqual(suggestions.length, 1);
        const suggestion = suggestions[0];
        assert.ok(suggestion.title.includes('Verify Cache Effectiveness'));
        assert.strictEqual(suggestion.severity, 'info');
    });

    test('LoopDetector - Suggests Cache if Missing (TS)', async () => {
        const detector = new LoopDetector();
        const code = `
            import { openai } from 'lib';
            const items = [];
            export async function main() {
                for (const item of items) {
                    // No cache here
                    await openai.chat.completions.create({...});
                }
            }
        `;
        const context = mockContext(code, 'no_cache_test.ts');
        const suggestions = await detector.analyze(context);

        assert.strictEqual(suggestions.length, 1);
        const suggestion = suggestions[0];
        assert.ok(suggestion.description.includes('Read-Through Cache'));
        assert.strictEqual(suggestion.severity, 'warning');
    });

    test('PatternDetector - Suggests Prompt Caching', async () => {
        const detector = new PatternDetector();
        const code = `
            const response = await anthropic.messages.create({
                model: 'claude-3-opus',
                messages: [...]
            });
        `;
        const context = mockContext(code, 'llm.ts');
        const suggestions = await detector.analyze(context);

        assert.strictEqual(suggestions.length, 1);
        assert.ok(suggestions[0].id === 'anthropic-prompt-caching');
    });

    test('PatternDetector - Detects Mongo Projection Issue', async () => {
        const detector = new PatternDetector();
        const code = `
            const users = await db.collection('users').find({});
        `;
        const context = mockContext(code, 'db.ts');
        const suggestions = await detector.analyze(context);

        assert.strictEqual(suggestions.length, 1);
        assert.ok(suggestions[0].id === 'mongo-projection');
    });
});
