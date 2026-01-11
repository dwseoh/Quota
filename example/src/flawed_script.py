
# FLAW: Python Loop N+1

import openai
import time

def process_data(items):
    # FLAW: Call inside loop
    for item in items:
        # No cache here
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": item}]
        )
        print(response)

def process_with_cache(items):
    # This should trigger "Verify Cache" suggestion
    for item in items:
        if cache.get(item):
            continue
            
        openai.ChatCompletion.create(
            model="gpt-4", 
            messages=[]
        )

def bad_infra():
    # DynamoDB Scan in Python
    dynamodb.scan(TableName='Users')
