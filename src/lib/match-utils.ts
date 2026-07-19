/**
 * Shared matching utilities for verifying YouTube resolve and lyrics results.
 * Centralizes title cleaning, title matching, and artist verification logic
 * used by both the YouTube resolve and lyrics API routes.
 */

/**
 * Cleans a song title by normalizing unicode, stripping parenthetical metadata
 * (feat, prod, video, etc.), removing special characters, and collapsing whitespace.
 */
export function cleanSongTitle(t: string): string {
  return t.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\([^)]*(feat|ft|with|prod|video|audio|visualizer|lyric|explicit|clean|leak)[^)]*\)/gi, '')
    .replace(/\[[^\]]*(feat|ft|with|prod|video|audio|visualizer|lyric|explicit|clean|leak)[^\]]*\]/gi, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Verifies a matched title is correct by checking strict phrase containment
 * between the cleaned requested and matched titles.
 */
export function isCorrectMatch(requestedTitle: string, matchedTitle: string): boolean {
  const cleanReq = cleanSongTitle(requestedTitle);
  const cleanMat = cleanSongTitle(matchedTitle);

  // Strict phrase containment check: one cleaned title must fully contain the other
  return cleanMat.includes(cleanReq) || cleanReq.includes(cleanMat);
}

/** Well-known music label/platform channel keywords that should always be allowed. */
const ALLOWED_GENERIC_CHANNELS = [
  'vevo', 'lyrical lemonade', 'cole bennett', 'ovo sound', 'spinnin', 'atlantic',
  'ultra', 'sony', 'universal', 'warner', 'records', 'music', 'cactus jack', 'grade a',
  'opium', 'interscope', 'def jam', 'republic', 'columbia', 'rca', 'epic', 'various artists'
];

/**
 * Verifies that a channel/uploader title plausibly belongs to the requested artist.
 * Checks direct name containment, short-name word-boundary match, and known label channels.
 */
export function isArtistMatch(requestedArtist: string, channelTitle: string): boolean {
  if (!requestedArtist || !channelTitle) return true; // fallback

  const cleanArtist = requestedArtist.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const cleanChannel = channelTitle.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Split requested artists by separators like ",", "&", "and", "feat", etc.
  const individualArtists = cleanArtist
    .split(/,|\s+&\s+|\s+and\s+|\s+feat\.?\s+|\s+ft\.?\s+/i)
    .map(name => name.trim())
    .filter(Boolean);

  if (individualArtists.length === 0) return true;

  // Clean the channel name of generic suffixes globally (substring replacements to catch "ArtistVEVO")
  const channelArtistClean = cleanChannel
    .replace(/vevo/g, '')
    .replace(/official/g, '')
    .replace(/records/g, '')
    .replace(/music/g, '')
    .replace(/\s*-\s*topic\b/g, '')
    .trim();

  // Split channel artists by same separators
  const channelArtists = channelArtistClean
    .split(/,|\s+&\s+|\s+and\s+|\s+feat\.?\s+|\s+ft\.?\s+/i)
    .map(name => name.trim())
    .filter(Boolean);

  // 1. Direct exact match check: any requested artist must exactly match one of the channel's artists
  const hasExactMatch = individualArtists.some(reqArt => 
    channelArtists.some(chanArt => {
      // Check exact match or boundary containment to handle names with spaces correctly
      if (chanArt === reqArt) return true;
      if (chanArt.length > 2 && reqArt.length > 2) {
        return chanArt.includes(reqArt) || reqArt.includes(chanArt);
      }
      return false;
    })
  );

  if (hasExactMatch) return true;

  // 2. Allowed generic channels check (e.g. major labels, various artists)
  const isGeneric = ALLOWED_GENERIC_CHANNELS.some(keyword => cleanChannel.includes(keyword));
  if (isGeneric) return true;

  return false;
}
