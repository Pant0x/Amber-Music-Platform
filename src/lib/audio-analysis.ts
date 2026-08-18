// BPM, Musical Key, and acoustic fingerprint detection.
// Pure-JS / typed-array implementation — runs client-side in Web Workers
// or the browser main thread with zero dependencies (free-tier friendly).

export interface AudioAnalysisResult {
  success: boolean
  bpm: number | null
  key: number | null
  mode: number | null
  timeSignature: number | null
  danceability: number | null
  energy: number | null
  valence: number | null
  acousticness: number | null
  instrumentalness: number | null
  reason?: string
  error?: string
}

export interface DetectionResult {
  success: boolean
  bpm?: number
  key?: string
  mode?: 'Major' | 'Minor'
  confidence?: number
  reason?: string
}

const KEY_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

// Krumhansl–Schmuckler key profiles
const KS_MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88]
const KS_MINOR = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17]

export function getKeyName(key: number | null): string {
  if (key === null || key === undefined) return 'Unknown'
  return KEY_NAMES[key] || 'Unknown'
}

export function getModeName(mode: number | null): string {
  if (mode === null || mode === undefined) return 'Unknown'
  return mode === 1 ? 'Major' : 'Minor'
}

export function formatBpm(bpm: number | null): string {
  if (bpm === null || bpm === undefined) return '--'
  if (bpm < 60) return '<60'
  if (bpm > 200) return '>200'
  return Math.round(bpm).toString()
}

function hannWindow(size: number): Float64Array {
  const w = new Float64Array(size)
  for (let i = 0; i < size; i++) {
    w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (size - 1)))
  }
  return w
}

/** In-place iterative radix-2 FFT. `real` and `imag` must be power-of-two length. */
function fft(real: Float64Array, imag: Float64Array): void {
  const n = real.length
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      const tr = real[i]; real[i] = real[j]; real[j] = tr
      const ti = imag[i]; imag[i] = imag[j]; imag[j] = ti
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const angle = (-2 * Math.PI) / len
    const wRe = Math.cos(angle)
    const wIm = Math.sin(angle)
    for (let i = 0; i < n; i += len) {
      let curRe = 1
      let curIm = 0
      for (let k = 0; k < len / 2; k++) {
        const uRe = real[i + k]
        const uIm = imag[i + k]
        const vRe = real[i + k + len / 2] * curRe - imag[i + k + len / 2] * curIm
        const vIm = real[i + k + len / 2] * curIm + imag[i + k + len / 2] * curRe
        real[i + k] = uRe + vRe
        imag[i + k] = uIm + vIm
        real[i + k + len / 2] = uRe - vRe
        imag[i + k + len / 2] = uIm - vIm
        const nextRe = curRe * wRe - curIm * wIm
        curIm = curRe * wIm + curIm * wRe
        curRe = nextRe
      }
    }
  }
}

function computeMagnitudes(pcm: Float32Array, sampleRate: number, frameSize: number, hop: number): Float64Array[] {
  const window = hannWindow(frameSize)
  const frames: Float64Array[] = []
  const step = sampleRate >= 24000 ? 2 : 1
  const src = step === 2 ? downmixToMono(pcm) : pcm
  for (let start = 0; start + frameSize <= src.length; start += hop) {
    const real = new Float64Array(frameSize)
    for (let i = 0; i < frameSize; i++) {
      real[i] = src[start + i] * window[i]
    }
    const imag = new Float64Array(frameSize)
    fft(real, imag)
    const mag = new Float64Array(frameSize / 2)
    for (let i = 0; i < frameSize / 2; i++) {
      mag[i] = Math.sqrt(real[i] * real[i] + imag[i] * imag[i])
    }
    frames.push(mag)
  }
  return frames
}

function downmixToMono(pcm: Float32Array): Float32Array {
  return pcm
}

/** Mix an AudioBuffer (any channel count) to mono Float32Array for analysis. */
export function mixBufferToMono(buffer: AudioBuffer): Float32Array {
  const channels = buffer.numberOfChannels
  const length = buffer.length
  const out = new Float32Array(length)
  if (channels === 1) {
    out.set(buffer.getChannelData(0))
    return out
  }
  for (let c = 0; c < channels; c++) {
    const data = buffer.getChannelData(c)
    for (let i = 0; i < length; i++) out[i] += data[i]
  }
  for (let i = 0; i < length; i++) out[i] /= channels
  return out
}

/** Decode an audio file/blob to mono PCM for analysis. Client-side only. */
export async function decodeAudioToPcm(file: Blob | File | ArrayBuffer): Promise<{ pcm: Float32Array; sampleRate: number } | null> {
  try {
    const ctx = new AudioContext()
    const arrayBuffer = file instanceof ArrayBuffer ? file : await file.arrayBuffer()
    const buffer = await ctx.decodeAudioData(arrayBuffer)
    const pcm = mixBufferToMono(buffer)
    await ctx.close()
    return { pcm, sampleRate: buffer.sampleRate }
  } catch {
    return null
  }
}

/**
 * BPM via onset-energy autocorrelation (60–220 BPM range).
 * Returns BPM and a 0..1 confidence (peak-to-mean ratio of the autocorrelation).
 */
export function detectBpm(pcm: Float32Array, sampleRate: number): { bpm: number | null; confidence: number } {
  if (pcm.length < sampleRate) return { bpm: null, confidence: 0 }

  const frameSize = 1024
  const hop = 512
  const energy: number[] = []
  for (let start = 0; start + frameSize <= pcm.length; start += hop) {
    let sum = 0
    for (let i = 0; i < frameSize; i++) {
      sum += pcm[start + i] * pcm[start + i]
    }
    energy.push(sum / frameSize)
  }

  const onset: number[] = []
  for (let i = 1; i < energy.length; i++) {
    onset.push(Math.max(0, energy[i] - energy[i - 1]))
  }
  if (onset.length < 8) return { bpm: null, confidence: 0 }

  // Normalize onset envelope
  let maxOnset = 0
  for (const v of onset) if (v > maxOnset) maxOnset = v
  if (maxOnset <= 0) return { bpm: null, confidence: 0 }
  const norm = onset.map(v => v / maxOnset)

  const minBpm = 60
  const maxBpm = 220
  const minLag = Math.round((sampleRate / hop) * (60 / maxBpm))
  const maxLag = Math.round((sampleRate / hop) * (60 / minBpm))

  const mean = norm.reduce((a, b) => a + b, 0) / norm.length
  let bestLag = -1
  let bestScore = 0

  for (let lag = minLag; lag <= maxLag; lag++) {
    let score = 0
    let pairs = 0
    for (let i = 0; i + lag < norm.length; i++) {
      score += norm[i] * norm[i + lag]
      pairs++
    }
    if (pairs > 0) {
      const s = score / pairs
      if (s > bestScore) {
        bestScore = s
        bestLag = lag
      }
    }
  }

  if (bestLag < 0) return { bpm: null, confidence: 0 }

  // Parabolic interpolation around the peak lag for sub-frame precision
  const bpmAt = (lag: number) => 60 / ((lag * hop) / sampleRate)
  let refinedLag = bestLag
  if (bestLag > minLag && bestLag < maxLag) {
    const y0 = onsetAutocorr(norm, bestLag - 1)
    const y1 = bestScore
    const y2 = onsetAutocorr(norm, bestLag + 1)
    const denom = y0 - 2 * y1 + y2
    if (Math.abs(denom) > 1e-12) {
      refinedLag = bestLag + (0.5 * (y0 - y2)) / denom
    }
  }

  // Confidence: how much the peak stands out from the mean correlation
  const confidence = Math.min(1, Math.max(0, (bestScore - mean) / Math.max(mean, 1e-9)))

  return { bpm: Math.round(bpmAt(refinedLag) * 10) / 10, confidence }
}

function onsetAutocorr(onset: number[], lag: number): number {
  let score = 0
  let pairs = 0
  for (let i = 0; i + lag < onset.length; i++) {
    score += onset[i] * onset[i + lag]
    pairs++
  }
  return pairs > 0 ? score / pairs : 0
}

/**
 * Musical key via chromagram → Krumhansl–Schmuckler profile correlation.
 * Returns the key name (e.g. "C#"), mode, and a 0..1 confidence.
 */
export function detectMusicalKey(pcm: Float32Array, sampleRate: number): { key: string | null; mode: 'Major' | 'Minor' | null; confidence: number } {
  if (pcm.length < sampleRate) return { key: null, mode: null, confidence: 0 }

  const frameSize = 4096
  const hop = 2048
  const frames = computeMagnitudes(pcm, sampleRate, frameSize, hop)
  if (frames.length === 0) return { key: null, mode: null, confidence: 0 }

  const chroma = new Float64Array(12)
  const binToFreq = (bin: number) => (bin * sampleRate) / frameSize
  const freqToPitchClass = (freq: number) => Math.round(69 + 12 * Math.log2(freq / 440)) % 12

  for (const mag of frames) {
    for (let bin = 2; bin < mag.length; bin++) {
      const freq = binToFreq(bin)
      if (freq < 65 || freq > 4000) continue
      const pc = freqToPitchClass(freq)
      chroma[pc] += mag[bin]
    }
  }

  const total = chroma.reduce((a, b) => a + b, 0)
  if (total <= 0) return { key: null, mode: null, confidence: 0 }
  const norm = chroma.map(v => v / total)

  let bestKey = -1
  let bestMode: 'Major' | 'Minor' = 'Major'
  let bestScore = -Infinity

  for (let rotation = 0; rotation < 12; rotation++) {
    const majorScore = correlateProfile(norm, KS_MAJOR, rotation)
    const minorScore = correlateProfile(norm, KS_MINOR, rotation)
    if (majorScore > bestScore) {
      bestScore = majorScore
      bestKey = rotation
      bestMode = 'Major'
    }
    if (minorScore > bestScore) {
      bestScore = minorScore
      bestKey = rotation
      bestMode = 'Minor'
    }
  }

  // Correlation coefficient as confidence (0..1)
  const mean = norm.reduce((a, b) => a + b, 0) / 12
  const profile = bestMode === 'Major' ? KS_MAJOR : KS_MINOR
  const rotated: number[] = []
  for (let i = 0; i < 12; i++) rotated.push(profile[(i + bestKey) % 12])
  const pMean = rotated.reduce((a, b) => a + b, 0) / 12

  let num = 0, den1 = 0, den2 = 0
  for (let i = 0; i < 12; i++) {
    num += (norm[i] - mean) * (rotated[i] - pMean)
    den1 += (norm[i] - mean) ** 2
    den2 += (rotated[i] - pMean) ** 2
  }
  const confidence = den1 > 0 && den2 > 0 ? Math.min(1, Math.abs(num / Math.sqrt(den1 * den2))) : 0

  return { key: KEY_NAMES[bestKey], mode: bestMode, confidence }
}

function correlateProfile(chroma: Float64Array, profile: number[], rotation: number): number {
  let score = 0
  for (let i = 0; i < 12; i++) {
    score += chroma[i] * profile[(i + rotation) % 12]
  }
  return score
}

/** Full BPM + key detection on raw mono PCM. */
export function analyzeAudioPcm(pcm: Float32Array, sampleRate: number): DetectionResult {
  const bpm = detectBpm(pcm, sampleRate)
  const key = detectMusicalKey(pcm, sampleRate)
  return {
    success: bpm.bpm !== null || key.key !== null,
    bpm: bpm.bpm ?? undefined,
    key: key.key ?? undefined,
    mode: key.mode ?? undefined,
    confidence: Math.max(bpm.confidence, key.confidence),
    reason: bpm.bpm === null && key.key === null ? 'Not enough audio data' : undefined,
  }
}

/**
 * Shazam-style acoustic fingerprinting.
 * Spectral-peak landmarks: for each FFT frame we keep prominent local maxima
 * and hash pairs (freqA, freqB, deltaFrames) into stable 32-bit hashes.
 * Works on short clips (5–15s); matching happens by hash-set intersection.
 */
export function extractFingerprintHashes(pcm: Float32Array, sampleRate: number, maxHashes = 512): string[] {
  const frameSize = 2048
  const hop = 1024
  const frames = computeMagnitudes(pcm, sampleRate, frameSize, hop)
  const hashes = new Set<string>()

  const peakFreqBins = (mag: Float64Array, count: number): number[] => {
    const bins: number[] = []
    for (let bin = 4; bin < mag.length - 1; bin++) {
      const f = (bin * sampleRate) / frameSize
      if (f < 300 || f > 8000) continue
      if (mag[bin] >= mag[bin - 1] && mag[bin] >= mag[bin + 1] && mag[bin] > 0.02 * maxMag(mag)) {
        bins.push(bin)
      }
    }
    // spread peaks: keep strongest per 400Hz band
    const selected: number[] = []
    const bandSize = Math.round((400 * frameSize) / sampleRate)
    for (let bandStart = 0; bandStart <= 8000; bandStart += 400) {
      const lo = Math.round((bandStart * frameSize) / sampleRate)
      const hi = lo + bandSize
      let bestBin = -1
      let bestVal = 0
      for (const b of bins) {
        if (b >= lo && b < hi && mag[b] > bestVal) {
          bestVal = mag[b]
          bestBin = b
        }
      }
      if (bestBin !== -1) selected.push(bestBin)
      if (selected.length >= count) break
    }
    return selected
  }

  for (let f = 0; f < frames.length; f++) {
    const peaks = peakFreqBins(frames[f], 8)
    for (let a = 0; a < peaks.length; a++) {
      for (let b = a + 1; b < peaks.length; b++) {
        for (let dt = 1; dt <= 3 && f + dt < frames.length; dt++) {
          const targetPeaks = peakFreqBins(frames[f + dt], 8)
          for (const tp of targetPeaks) {
            if (tp === peaks[a] || tp === peaks[b]) continue
            const hash = ((peaks[a] & 0x3ff) << 22) | ((peaks[b] & 0x3ff) << 12) | ((tp & 0x3ff) << 2) | (dt & 0x3)
            hashes.add(hash.toString(16))
            if (hashes.size >= maxHashes) return Array.from(hashes)
          }
        }
      }
    }
  }
  return Array.from(hashes)
}

function maxMag(mag: Float64Array): number {
  let m = 0
  for (let i = 0; i < mag.length; i++) if (mag[i] > m) m = mag[i]
  return m
}

/** Match a query hash set against a reference hash set. Returns 0..1 confidence. */
export function fingerprintSimilarity(query: Set<string>, reference: Set<string>): number {
  if (query.size === 0 || reference.size === 0) return 0
  let hits = 0
  for (const h of query) {
    if (reference.has(h)) hits++
  }
  return hits / Math.min(query.size, reference.size)
}

// Backward-compatible Spotify-style analyzer (kept as the server-side contract;
// real feature values require the client-side PCM analysis above).
export async function analyzeSpotifyTrack(trackId: string): Promise<AudioAnalysisResult> {
  if (trackId.length !== 22 || trackId.includes('-')) {
    return {
      success: false,
      reason: 'Invalid Spotify track ID format',
      bpm: null,
      key: null,
      mode: null,
      timeSignature: null,
      danceability: null,
      energy: null,
      valence: null,
      acousticness: null,
      instrumentalness: null,
    }
  }
  return {
    success: false,
    reason: 'Audio analysis requires decoding the track client-side (see analyzeAudioPcm)',
    bpm: null,
    key: null,
    mode: null,
    timeSignature: null,
    danceability: null,
    energy: null,
    valence: null,
    acousticness: null,
    instrumentalness: null,
  }
}