// Match Utilities
export function isCorrectMatch(query: string, candidate: string): boolean {
  const normalize = (str: string) => str.toLowerCase().replace(/[^\w\s]/g, "").trim();
  const q = normalize(query);
  const c = normalize(candidate);

  if (q === c) return true;
  if (c.includes(q)) return true;
  if (q.includes(c)) return true;

  // Check word overlap
  const qWords = q.split(/\s+/).filter((w) => w.length > 2);
  const cWords = c.split(/\s+/).filter((w) => w.length > 2);
  const overlap = qWords.filter((w) => cWords.includes(w)).length;
  return overlap >= Math.min(qWords.length, 2);
}

export function isArtistMatch(query: string, candidate: string): boolean {
  const normalize = (str: string) => str.toLowerCase().replace(/[^\w\s]/g, "").trim();
  const q = normalize(query);
  const c = normalize(candidate);

  if (q === c) return true;
  if (c.includes(q)) return true;
  if (q.includes(c)) return true;

  // Check for feat/ft variations
  const qMain = q.split(/feat\.?|ft\.?|with/)[0].trim();
  const cMain = c.split(/feat\.?|ft\.?|with/)[0].trim();
  return qMain === cMain;
}