import * as assert from 'assert';
import { LoopDetector } from '../optimization/detectors/loop_detector';
import { PatternDetector } from '../optimization/detectors/pattern_detector';
import { FileContext } from '../optimization/types';

// Simple mock for FileContext since we don't have full VS Code API in simple unit tests
const mockContext = (content: string, fileName: string): any => ({
    uri: { fsPath: fileName, toString: () => fileName },
    content,
    languageId: fileName.endsWith('.py') ? 'python' : 'typescript'
});

suite('Optimization Detectors', () => {

    test('LoopDetector - Detects API call in TS Loop', async () => {
        const detector = new LoopDetector();
        const code = `
            for (let i = 0; i < 10; i++) {
                // This is a costly call inside a loop
                await openai.chat.completions.create({ model: 'gpt-4' });
            }
        `;
        const context = mockContext(code, 'test.ts');
        const suggestions = await detector.analyze(context);

        assert.strictEqual(suggestions.length, 1);
        assert.ok(suggestions[0].title.includes('Costly Operation'));
    });

    test('LoopDetector - Detects multiple calls in nested loops', async () => {
        const detector = new LoopDetector();
        const code = `
            while (true) {
                const results = db.users.find();
                for (const user of results) {
                    await fetch('https://api.stripe.com/v1/charges');
                }
            }
        `;
        const context = mockContext(code, 'test.ts');
        const suggestions = await detector.analyze(context);

        assert.strictEqual(suggestions.length, 2); // db.find and fetch
    });

    test('LoopDetector - Python Indentation Logic', async () => {
        const detector = new LoopDetector();
        const code = `
for i in range(10):
    print("starting")
    # Indented call
    response = requests.get('https://api.example.com')
    print("done")
        `;
        const context = mockContext(code, 'script.py');
        const suggestions = await detector.analyze(context);

        assert.strictEqual(suggestions.length, 1, 'Should detect requests.get inside loop');
    });

    
    test('PatternDetector - Detects DynamoDB Scan', async () => {
        const detector = new PatternDetector();
        const code = `
            const result = await dynamodb.scan({ TableName: 'Users' });
        `;
        const context = mockContext(code, 'db.ts');
        const suggestions = await detector.analyze(context);
        
        assert.strictEqual(suggestions.length, 1);
        assert.ok(suggestions[0].id === 'dynamodb-scan');
    });

    test('PatternDetector - Detects Legacy GPT-4', async () => {
        const detector = new PatternDetector();
        const code = `
            const model = "gpt-4-32k";
        `;
        const context = mockContext(code, 'config.ts');
        const suggestions = await detector.analyze(context);
        
        assert.strictEqual(suggestions.length, 1);
        assert.ok(suggestions[0].id === 'legacy-gpt4');
    });

    test('PatternDetector - Detects Expensive CI Runner', async () => {
        const detector = new PatternDetector();
        const code = `
            jobs:
              build:
                runs-on: active-large-runner
        `;
        const context = mockContext(code, '.github/workflows/main.yml');
        const suggestions = await detector.analyze(context);
        
        assert.strictEqual(suggestions.length, 1);
        assert.ok(suggestions[0].id === 'github-large-runner');
    });
});
