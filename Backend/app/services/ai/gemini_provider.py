import google.generativeai as genai
from typing import List
from app.config import settings
from .base import BaseAIProvider


genai.configure(api_key=settings.GEMINI_API_KEY)


class GeminiProvider(BaseAIProvider):

    async def chat(self, system: str, user: str) -> str:
        model = genai.GenerativeModel(settings.GEMINI_MODEL)

        response = model.generate_content(
            f"{system}\n\n{user}"
        )

        return response.text

    async def embed(self, texts: List[str]) -> List[List[float]]:
        # Gemini embedding model
        embedding_model = "models/embedding-001"

        vectors = []
        for t in texts:
            result = genai.embed_content(
                model=embedding_model,
                content=t,
                task_type="retrieval_document",
            )
            vectors.append(result["embedding"])

        return vectors