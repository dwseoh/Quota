const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

/**
 * Generate product description using GPT-4
 * EXPENSIVE: Uses GPT-4 for simple task!
 */
async function generateProductDescription(productName) {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are a helpful product description writer." },
      { role: "user", content: `Write a product description for: ${productName}` }
    ]
  });
  
  return response.choices[0].message.content;
}

/**
 * Analyze user sentiment using Claude
 * WASTEFUL: Called on EVERY user comment!
 */
async function analyzeSentiment(userComment) {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      { role: "user", content: `Analyze the sentiment of this comment: "${userComment}"` }
    ]
  });
  
  return message.content[0].text;
}

/**
 * Generate search suggestions using GPT-3.5
 * INEFFICIENT: Could use simple string matching instead!
 */
async function generateSearchSuggestions(query) {
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "user", content: `Generate 5 search suggestions for: ${query}` }
    ]
  });
  
  return response.choices[0].message.content;
}

/**
 * Summarize user profile using Claude Haiku
 * REDUNDANT: Called multiple times for same user!
 */
async function summarizeUserProfile(userId, userData) {
  const message = await anthropic.messages.create({
    model: "claude-haiku-20240307",
    max_tokens: 500,
    messages: [
      { role: "user", content: `Summarize this user profile: ${JSON.stringify(userData)}` }
    ]
  });
  
  return message.content[0].text;
}

/**
 * Generate email response using GPT-4
 * OVERKILL: GPT-4 for template emails!
 */
async function generateEmailResponse(customerQuery) {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are a customer support agent." },
      { role: "user", content: `Generate a response to: ${customerQuery}` }
    ],
    temperature: 0.7
  });
  
  return response.choices[0].message.content;
}

module.exports = {
  generateProductDescription,
  analyzeSentiment,
  generateSearchSuggestions,
  summarizeUserProfile,
  generateEmailResponse
};
