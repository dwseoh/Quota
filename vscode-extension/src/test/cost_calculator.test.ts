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
  test('estimate_tokens approximates correctly and rounds up', () => {
    assert.strictEqual(estimate_tokens(''), 0);
    // 4 chars -> 1 token
    assert.strictEqual(estimate_tokens('abcd'), 1);
    // 5 chars -> ceil(5/4) = 2
    assert.strictEqual(estimate_tokens('abcde'), 2);
  });

  test('calculate_cost uses pricing table for known model', () => {
    // gpt-3.5-turbo input price = 0.0005 per 1000 tokens
    const tokens = 1000;
    const cost = calculate_cost('gpt-3.5-turbo', tokens);
    assert.ok(Math.abs(cost - 0.0005) < 1e-12, `unexpected cost: ${cost}`);
  });

  test('calculate_cost returns 0 for unknown model', () => {
    const cost = calculate_cost('unknown-model', 1000);
    assert.strictEqual(cost, 0);
  });

  test('get_cost_breakdown returns detailed costs and totals', () => {
    const breakdown = get_cost_breakdown('gpt-4', 500, 100);
    // input: (500/1000)*0.03 = 0.015
    // output: (100/1000)*0.06 = 0.006
    assert.ok(Math.abs(breakdown.input_cost - 0.015) < 1e-12);
    assert.ok(Math.abs(breakdown.output_cost - 0.006) < 1e-12);
    assert.ok(Math.abs(breakdown.total_cost - 0.021) < 1e-12);
  });

  test('get_cost_breakdown returns zeros for unknown model', () => {
    const breakdown = get_cost_breakdown('does-not-exist', 100, 100);
    assert.strictEqual(breakdown.input_cost, 0);
    assert.strictEqual(breakdown.output_cost, 0);
    assert.strictEqual(breakdown.total_cost, 0);
  });

  test('get_model_pricing and supported_models behave as expected', () => {
    const pricing = get_model_pricing('gpt-4');
    assert.ok(pricing);
    assert.strictEqual(typeof pricing!.input, 'number');

    const models = supported_models();
    assert.ok(Array.isArray(models));
    assert.ok(models.includes('gpt-4'));
  });

  test('calculate_total_cost equals breakdown total', () => {
    const total = calculate_total_cost('gpt-4', 250, 250);
    const breakdown = get_cost_breakdown('gpt-4', 250, 250);
    assert.ok(Math.abs(total - breakdown.total_cost) < 1e-12);
  });
});
