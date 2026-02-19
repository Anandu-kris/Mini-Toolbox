from bs4 import BeautifulSoup
import re

def html_to_text(html: str) -> str:
    if not html:
        return ""
    soup = BeautifulSoup(html, "html.parser")
    text = soup.get_text(" ")
    return re.sub(r"\s+", " ", text).strip()
