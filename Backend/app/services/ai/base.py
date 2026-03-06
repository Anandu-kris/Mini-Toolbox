from abc import ABC, abstractmethod
from typing import List

class BaseAIProvider(ABC):

    @abstractmethod
    async def chat(self, system: str, user: str) -> str:
        pass

    @abstractmethod
    async def embed(self, texts: List[str]) -> List[List[float]]:
        pass