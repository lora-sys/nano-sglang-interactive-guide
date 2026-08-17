"""Run this after starting a real SGLang server on localhost:30000."""
from openai import OpenAI

client = OpenAI(base_url="http://127.0.0.1:30000/v1", api_key="EMPTY")
response = client.chat.completions.create(
    model="qwen/qwen2.5-0.5b-instruct",
    messages=[{"role": "user", "content": "Explain KV cache in one sentence."}],
    temperature=0,
    max_tokens=32,
)
print(response.choices[0].message.content)
