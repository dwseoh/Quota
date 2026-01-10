/**
 * test file for anthropic api calls
 * use this to test the parser and cost tracking
 */

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

// test case 1: simple claude-sonnet-4 call
const msg1 = await client.messages.create({
  model: "claude-sonnet-4-20250514",
  messages: [{ role: "user", content: "hi" }]
});

// test case 2: claude-haiku call
const msg2 = await client.messages.create({
  model: "claude-haiku",
  max_tokens: 1024,
  messages: [
    { role: "user", content: "what is the meaning of life?" }
  ]
});

// test case 3: longer conversation
const msg3 = await client.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 2048,
  messages: [
    { role: "user", content: "explain quantum computing in simple terms" },
    { role: "assistant", content: "quantum computing uses quantum mechanics..." },
    { role: "user", content: "can you give me a practical example?" }
  ]
});
