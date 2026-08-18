export interface ArtistProfile {
  id: string
  title: string
  description: string
  customUrl: string
  avatarUrl: string
  bannerUrl: string
  thumbnailUrl?: string
  thumbnail?: string
  subscriberCount: string
  subscriberCountText?: string
  videoCount: string
  [key: string]: unknown
}

export interface ChannelDetails {
  profile: ArtistProfile
  videos: any[]
  topSongs: any[]
  albums: any[]
  singles: any[]
  allPlaylists: any[]
  featuredPlaylists: any[]
  relatedArtists: any[]
  description?: string
  [key: string]: unknown
}