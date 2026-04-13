import os
from dotenv import load_dotenv
from groq import Groq
from pathlib import Path

env_path=Path(__file__).resolve().parent.parent.parent /".env"
load_dotenv(dotenv_path=env_path)
print("API KEY:",os.getenv("GROQ_API_KEY"))

client=Groq(api_key=os.getenv("GROQ_API_KEY"))

def generate_answer(query,context):
    try:
        prompt=f"""
You are an helpful AI tutor.

Explain in simple language so a student can understand easily.

Context:
{context[:600]}

Question:
{query}
"""

        chat_completion=client.chat.completions.create(
            messages=[
                {"role":"user","content":prompt}
            ],
            model="llama-3.3-70b-versatile"
        )
        answer=chat_completion.choices[0].message.content
        return answer
    except Exception as e:
        print("❌GROQ ERROR:",e)
        return "AI is busy,try again"


