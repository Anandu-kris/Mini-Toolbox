function decodeHtmlEntities(text: string) {
  // Browser-safe decode without extra libs
  const el = document.createElement("textarea");
  el.innerHTML = text;
  return el.value;
}

export function htmlToPlainText(html: string) {
  if (!html) return "";
  // Remove tags
  const text = html.replace(/<[^>]*>/g, " ");
  // Decode entities (&nbsp;, &amp; etc)
  const decoded = decodeHtmlEntities(text);
  // Normalize whitespace
  return decoded.replace(/\s+/g, " ").trim();
}
