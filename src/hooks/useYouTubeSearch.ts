import { useState, useEffect, useCallback, useRef } from 'react'
import { Track, YouTubeSearchResponse } from '@/types/music-player'

interface UseYouTubeSearchReturn {
  searchQuery: string
  setSearchQuery: (query: string) => void
  tracks: Track[]
  loading: boolean
  error: string | null
  nextPageToken: string | undefined
  loadMore: () => void
  hasMore: boolean
  refreshSearch: () => void
}

export const useYouTubeSearch = (initialQuery: string = 'Lofi'): UseYouTubeSearchReturn => {
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery)
  const [debouncedQuery, setDebouncedQuery] = useState<string>(initialQuery)
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  
  // Pagination states
  const [currentPageToken, setCurrentPageToken] = useState<string | undefined>(undefined)
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined)
  
  // Ref to track if we're resetting due to new query
  const isReset = useRef(false)

  // Debounce the searchQuery
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 500) // 500ms debounce

    return () => {
      clearTimeout(handler)
    }
  }, [searchQuery])

  // Reset pagination when debounced query changes
  useEffect(() => {
    // Check if this is a new query (not from pagination loadMore)
    if (currentPageToken === undefined) {
      isReset.current = true
      setTracks([])
      setCurrentPageToken(undefined)
    }
  }, [debouncedQuery])

  const fetchSearchResults = useCallback(async (query: string, pageToken?: string) => {
    setLoading(true)
    setError(null)

    try {
      const url = new URL('/api/search', window.location.origin)
      if (query) {
        url.searchParams.set('q', query)
      }
      if (pageToken) {
        url.searchParams.set('pageToken', pageToken)
      }

      const res = await fetch(url.toString())
      if (!res.ok) {
        throw new Error(`API error: ${res.statusText}`)
      }

      const data: YouTubeSearchResponse = await res.json()
      
      setTracks((prev) => {
        // If we are fetching page 1 (no pageToken), replace. Else append.
        if (!pageToken || isReset.current) {
          isReset.current = false
          return data.items || []
        }
        
        // Append unique items only
        const existingIds = new Set(prev.map(t => t.id))
        const newItems = (data.items || []).filter(t => !existingIds.has(t.id))
        return [...prev, ...newItems]
      })
      
      setNextPageToken(data.nextPageToken)
    } catch (err: unknown) {
      console.error('Error fetching YouTube results:', err)
      const message = err instanceof Error ? err.message : 'Failed to search YouTube'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch search results when debounced query or currentPageToken changes
  useEffect(() => {
    // If it's a query change (no currentPageToken), we fetch.
    // If it's a page token change, we fetch.
    fetchSearchResults(debouncedQuery, currentPageToken)
  }, [debouncedQuery, currentPageToken, fetchSearchResults])

  const loadMore = useCallback(() => {
    if (nextPageToken && !loading) {
      setCurrentPageToken(nextPageToken)
    }
  }, [nextPageToken, loading])

  const refreshSearch = useCallback(() => {
    isReset.current = true
    fetchSearchResults(debouncedQuery, undefined)
  }, [debouncedQuery, fetchSearchResults])

  return {
    searchQuery,
    setSearchQuery,
    tracks,
    loading,
    error,
    nextPageToken,
    loadMore,
    hasMore: !!nextPageToken,
    refreshSearch
  }
}