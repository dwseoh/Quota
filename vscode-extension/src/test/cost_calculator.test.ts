import * as assert from 'assert';
import {
    estimate_tokens,
    calculate_cost,
    get_cost_breakdown,
    get_model_pricing,
    supported_models,
    calculate_total_cost
} from '../cost_calculator';

suite('cost_calculator tests', () => {
    test('estimate_tokens rounds up correctly', () => {
        assert.strictEqual(estimate_tokens(''), 0);
        assert.strictEqual(estimate_tokens('abcd'), 1);   // 4 chars = 1 token
        assert.strictEqual(estimate_tokens('abcde'), 2);  // 5 chars = ceil(5/4) = 2
    });

    test('calculate_cost returns a number for known fallback models', () => {
        const cost = calculate_cost('gpt-4o', 1000);
        assert.ok(cost !== null, 'expected a cost for gpt-4o');
        assert.ok(typeof cost === 'number');
        assert.ok(cost > 0);
    });

    test('calculate_cost returns null for unknown model', () => {
        assert.strictEqual(calculate_cost('not-a-real-model-xyz', 1000), null);
    });

    test('calculate_cost returns null for null model', () => {
        assert.strictEqual(calculate_cost(null, 1000), null);
    });

    test('get_cost_breakdown returns breakdown for known model', () => {
        const breakdown = get_cost_breakdown('gpt-4o', 500, 100);
        assert.ok(breakdown !== null);
        assert.ok(breakdown!.input_cost > 0);
        assert.ok(breakdown!.output_cost > 0);
        assert.ok(Math.abs(breakdown!.total_cost - (breakdown!.input_cost + breakdown!.output_cost)) < 1e-12);
    });

    test('get_cost_breakdown returns null for unknown model', () => {
        assert.strictEqual(get_cost_breakdown('does-not-exist', 100, 100), null);
    });

    test('get_model_pricing returns pricing for known fallback model', () => {
        const p = get_model_pricing('gpt-4o');
        assert.ok(p !== undefined);
        assert.ok(typeof p!.input === 'number');
        assert.ok(typeof p!.output === 'number');
    });

    test('supported_models returns an array', () => {
        const models = supported_models();
        assert.ok(Array.isArray(models));
        assert.ok(models.length > 0);
    });

    test('calculate_total_cost matches breakdown total', () => {
        const total = calculate_total_cost('gpt-4o', 250, 250);
        const breakdown = get_cost_breakdown('gpt-4o', 250, 250);
        assert.ok(total !== null && breakdown !== null);
        assert.ok(Math.abs(total! - breakdown!.total_cost) < 1e-12);
    });
});
