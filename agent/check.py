from openai import OpenAI
import requests
from datetime import datetime

# You should use environment variable in production
OPENAI_API_KEY = "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"

# Initialize client
client = OpenAI(api_key=OPENAI_API_KEY)

# === Part 1: List Available Models ===
print("=== Available Models ===")
models = client.models.list()
for model in models.data:
    print(f"- {model.id}")

# === Part 2: Check Today's Usage ===
headers = {"Authorization": f"Bearer {OPENAI_API_KEY}"}
today = datetime.now().strftime("%Y-%m-%d")

response = requests.get(
    "https://api.openai.com/v1/usage",
    headers=headers,
    params={"date": today}
)

if response.status_code != 200:
    print("Error fetching usage:", response.text)
    exit()

data = response.json()

# Total usage metrics
total_requests = sum(item.get("n_requests", 0) for item in data.get("data", []))
total_input_tokens = sum(item.get("n_context_tokens_total", 0) for item in data.get("data", []))
total_output_tokens = sum(item.get("n_generated_tokens_total", 0) for item in data.get("data", []))

# Estimate cost (adjust based on model, defaults here are for GPT-3.5-turbo)
input_cost_per_1k = 0.0015
output_cost_per_1k = 0.0020
estimated_cost = (total_input_tokens / 1000 * input_cost_per_1k) + (total_output_tokens / 1000 * output_cost_per_1k)

print(f"""
=== OpenAI Usage Summary ===
Date: {today}
Total Requests: {total_requests}
Total Input Tokens: {total_input_tokens}
Total Output Tokens: {total_output_tokens}
Estimated Cost: ${estimated_cost:.4f}
""")
