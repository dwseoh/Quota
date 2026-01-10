import openai
import anthropic
import os

openai.api_key = os.getenv("OPENAI_API_KEY")
anthropic_client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

def answer_faq(question):
    """
    Answer FAQ using GPT-4
    WASTEFUL: Could use a simple FAQ database instead!
    """
    response = openai.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a helpful FAQ bot."},
            {"role": "user", "content": f"Answer this FAQ: {question}"}
        ]
    )
    return response.choices[0].message.content

def moderate_content(user_content):
    """
    Moderate user content using Claude
    EXPENSIVE: Called on every single post!
    """
    message = anthropic_client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=256,
        messages=[
            {"role": "user", "content": f"Is this content appropriate? {user_content}"}
        ]
    )
    return message.content[0].text

def generate_tags(post_content):
    """
    Generate tags using GPT-3.5
    INEFFICIENT: Could use keyword extraction!
    """
    response = openai.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "user", "content": f"Generate 5 tags for: {post_content}"}
        ]
    )
    return response.choices[0].message.content

def translate_text(text, target_language):
    """
    Translate using Claude Haiku
    REDUNDANT: Same translations requested multiple times!
    """
    message = anthropic_client.messages.create(
        model="claude-haiku-20240307",
        max_tokens=1024,
        messages=[
            {"role": "user", "content": f"Translate to {target_language}: {text}"}
        ]
    )
    return message.content[0].text

def classify_ticket(ticket_description):
    """
    Classify support tickets using GPT-4
    OVERKILL: Simple classification could use ML model or rules!
    """
    response = openai.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "Classify this support ticket into: billing, technical, or general."},
            {"role": "user", "content": ticket_description}
        ],
        temperature=0.3
    )
    return response.choices[0].message.content
