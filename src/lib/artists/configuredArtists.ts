// Configurable artists database - replaces hardcoded artist IDs
// Add new artists here as needed

export interface ConfiguredArtist {
  id: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  subtitle: string;
  publishedAt: string;
  type: 'channel';
  origin: 'youtube';
  channelId: string;
  alternativeIds?: string[]; // For common misspellings
}

export const configuredArtists: Record<string, ConfiguredArtist> = {
  fairuz: {
    id: 'UCzixfFiEFMjhSB3R9UdUdsA',
    title: 'Fairuz',
    channelTitle: 'Artist',
    thumbnailUrl: 'https://yt3.googleusercontent.com/ZIONSAndglfiCvZdwa0CNCrUFWN6EUvhQxyY6MtqRzzuZQYeg27M80K0LAikAZkmWcTgbSXXkA=w1000-h1000-l90-rj',
    subtitle: 'Legendary Lebanese Singer',
    publishedAt: new Date().toISOString(),
    type: 'channel',
    origin: 'youtube',
    channelId: 'UCzixfFiEFMjhSB3R9UdUdsA',
    alternativeIds: ['65eg8R4wje95952S772qZq'], // German Fairuz
  },
  german_fairuz: {
    id: 'german-fairuz',
    title: 'Fairuz (DE)',
    channelTitle: 'Artist',
    thumbnailUrl: 'https://yt3.googleusercontent.com/r-nlAuthMmcTD_7SWnkTM0b60SyLjCD7IbWje50Da6lPquj0kEG5cDLabupRrnufiV4muhbbvwgkURv14w=w1000-h1000-l90-rj',
    subtitle: 'German Pop/Rapper',
    publishedAt: new Date().toISOString(),
    type: 'channel',
    origin: 'youtube',
    channelId: 'german-fairuz',
  },
};

// Artist name to ID mapping for quick lookup
export const artistNameToId: Record<string, string[]> = {
  'fairuz': ['UCzixfFiEFMjhSB3R9UdUdsA', 'german-fairuz'],
  'fairouz': ['UCzixfFiEFMjhSB3R9UdUdsA', 'german-fairuz'],
  'fayrouz': ['UCzixfFiEFMjhSB3R9UdUdsA', 'german-fairuz'],
  'فيروز': ['UCzixfFiEFMjhSB3R9UdUdsA', 'german-fairuz'],
};

// Check if an artist ID is a configured special artist
export function isConfiguredArtist(artistId: string): boolean {
  return Object.values(configuredArtists).some(a => 
    a.id === artistId || a.channelId === artistId || 
    (a.alternativeIds && a.alternativeIds.includes(artistId))
  );
}

// Get configured artist by search term
export function getArtistBySearchTerm(term: string): ConfiguredArtist | null {
  const normalized = term.toLowerCase().trim();
  const configuredKeys = Object.keys(configuredArtists);
  
  for (const key of configuredKeys) {
    if (normalized === key || normalized === key.toLowerCase()) {
      return configuredArtists[key];
    }
    // Check alternative IDs
    const artist = configuredArtists[key];
    if (artist.alternativeIds?.includes(normalized)) {
      return artist;
    }
    if (artistNameToId[normalized]) {
      return artist;
    }
  }
  
  return null;
}