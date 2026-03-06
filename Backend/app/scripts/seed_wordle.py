from __future__ import annotations

from pathlib import Path
from typing import List
from datetime import datetime, timezone

WORD_LEN = 5

def _load_words(path: Path, length: int = WORD_LEN) -> List[str]:
    if not path.exists():
        raise FileNotFoundError(f"Wordlist not found: {path}")

    words: List[str] = []
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            w = line.strip().lower()
            if len(w) == length and w.isalpha():
                words.append(w)

    return sorted(set(words))


async def seed_wordle_if_empty(db) -> None:
    answers_count = await db.wordle_answers.count_documents({"length": WORD_LEN})
    allowed_count = await db.wordle_allowed.count_documents({"length": WORD_LEN})

    if answers_count > 0 and allowed_count > 0:
        return 

    base = Path(__file__).resolve().parents[1] 
    wordlist_dir = base / "scripts" / "wordlists"

    answers_path = wordlist_dir / "answers.txt"
    allowed_path = wordlist_dir / "allowed.txt"

    answers = _load_words(answers_path, WORD_LEN)
    allowed = _load_words(allowed_path, WORD_LEN)

    allowed = sorted(set(allowed) | set(answers))

    await db.wordle_answers.delete_many({"length": WORD_LEN})
    await db.wordle_allowed.delete_many({"length": WORD_LEN})

    now = datetime.now(timezone.utc)

    if answers:
        await db.wordle_answers.insert_many(
            [{"word": w, "length": WORD_LEN, "createdAt": now} for w in answers]
        )

    if allowed:
        await db.wordle_allowed.insert_many(
            [{"word": w, "length": WORD_LEN, "createdAt": now} for w in allowed]
        )

    print(f"[WORDLE] Seeded answers={len(answers)} allowed={len(allowed)}")