export function cleanVisualName(name: string): string {
  if (!name) return '';
  // Strip trailing " - Topic" (any dash type, case-insensitive)
  let cleaned = name.replace(/\s*[-–—]\s*Topic\s*$/i, '');
  // Strip trailing "VEVO" (case-insensitive, with or without leading space)
  cleaned = cleaned.replace(/VEVO\s*$/i, '');
  cleaned = cleaned.replace(/\s*VEVO\s*$/i, '');
  return cleaned.trim();
}

export function splitArtistNames(nameStr: string): string[] {
  if (!nameStr) return [];
  return nameStr
    .split(/,|\s+&\s+|\s+and\s+/i)
    .map(name => name.trim())
    .filter(Boolean);
}

export interface ParsedTitle {
  title: string;
  featured: string[];
}

let _idCounter = 0;
export function genId(prefix = 'id'): string {
  _idCounter++;
  return `${prefix}_${Date.now().toString(36)}_${_idCounter.toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function genToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

export function parseFeaturedArtists(title: string): ParsedTitle {
  if (!title) return { title: '', featured: [] };
  const featRegex = /\s*[([{-]?(?:feat|featuring|ft|with|w\/)\.?\s+([^)\]}]+)[)\]}]?/i;
  const match = title.match(featRegex);
  if (match) {
    const featString = match[1].trim();
    const cleanedTitle = title.replace(featRegex, '').replace(/\s*[-–—]\s*$/, '').trim();
    const featured = splitArtistNames(featString);
    return {
      title: cleanedTitle,
      featured
    };
  }
  return { title: title.trim(), featured: [] };
}
