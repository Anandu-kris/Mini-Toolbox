from app.config import settings
from .openai_provider import OpenAIProvider
from .gemini_provider import GeminiProvider

def get_ai_provider():
    if settings.AI_PROVIDER == "gemini":
        return GeminiProvider()
    return OpenAIProvider()