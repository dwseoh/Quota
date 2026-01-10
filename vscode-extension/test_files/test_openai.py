"""
test file for openai api calls
use this to test the parser and cost tracking
"""

import openai

client = openai.OpenAI()

# test case 1: simple gpt-4 call
response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "Hello world"}]
)

# test case 2: gpt-3.5-turbo call
response2 = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "What is the capital of France?"}
    ]
)

# test case 3: longer prompt
long_prompt = """
This is a much longer prompt that should result in higher token counts.
We want to test how the cost calculator handles different prompt lengths.
The more text we have here, the more tokens it will consume.
This should help us verify that our token estimation is working correctly.
"""

response3 = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": long_prompt}]
)
