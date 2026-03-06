import httpx
from typing import List
from app.config import settings
from .base import BaseAIProvider


class OpenAIProvider(BaseAIProvider):

    async def chat(self, system: str, user: str) -> str:
        url = "https://api.openai.com/v1/chat/completions"
        headers = {"Authorization": f"Bearer {settings.OPENAI_API_KEY}"}

        body = {
            "model": settings.OPENAI_CHAT_MODEL,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "temperature": 0.2,
        }

        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(url, headers=headers, json=body)
            r.raise_for_status()
            return r.json()["choices"][0]["message"]["content"]

    async def embed(self, texts: List[str]) -> List[List[float]]:
        url = "https://api.openai.com/v1/embeddings"
        headers = {"Authorization": f"Bearer {settings.OPENAI_API_KEY}"}

        body = {
            "model": settings.OPENAI_EMBED_MODEL,
            "input": texts,
        }

        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(url, headers=headers, json=body)
            r.raise_for_status()
            data = r.json()["data"]

        return [item["embedding"] for item in data]