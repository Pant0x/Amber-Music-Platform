const DEFAULT_RETRIES = 3
const BASE_DELAY = 500

interface ApiClientConfig {
  baseUrl?: string
  retries?: number
  headers?: Record<string, string>
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function request<T>(
  url: string,
  options: RequestInit = {},
  config: ApiClientConfig = {}
): Promise<T> {
  const { retries = DEFAULT_RETRIES, headers = {} } = config
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
          ...options.headers,
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new ApiError(
          data?.error || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          data
        )
      }

      return await response.json()
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))

      if (err instanceof ApiError && err.status < 500) {
        throw err
      }

      if (attempt < retries) {
        const backoff = BASE_DELAY * Math.pow(2, attempt) + Math.random() * 100
        console.warn(`[API] Retry ${attempt + 1}/${retries} for ${url}: ${lastError.message}`)
        await delay(backoff)
      }
    }
  }

  throw lastError || new Error(`Request to ${url} failed after ${retries} retries`)
}

export const api = {
  get: <T>(url: string, config?: ApiClientConfig) =>
    request<T>(url, { method: 'GET' }, config),

  post: <T>(url: string, body?: unknown, config?: ApiClientConfig) =>
    request<T>(url, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }, config),

  put: <T>(url: string, body?: unknown, config?: ApiClientConfig) =>
    request<T>(url, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }, config),

  delete: <T>(url: string, config?: ApiClientConfig) =>
    request<T>(url, { method: 'DELETE' }, config),
}

export { ApiError }
