'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface DashboardData {
  users: { id: string; display_name: string; created_at: string }[]
  tracks: { id: string; title: string; artist_name: string; plays_count: number; created_at: string }[]
  stats: { total_users: number; total_tracks: number; total_plays: number }
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then(async (res) => {
        if (res.status === 401) {
          router.push('/admin/login')
          return
        }
        if (!res.ok) throw new Error('Failed to load')
        setData(await res.json())
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [router])

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-zinc-400">Loading dashboard...</p>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-red-400">{error}</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="flex items-center justify-between px-8 py-4 border-b border-zinc-800">
        <h1 className="text-xl font-bold">Admin Dashboard</h1>
        <button onClick={handleLogout} className="text-sm text-zinc-400 hover:text-white transition-colors">
          Logout
        </button>
      </header>

      <div className="max-w-6xl mx-auto p-8 space-y-8">
        <div className="grid grid-cols-3 gap-6">
          <StatCard label="Total Users" value={data?.stats.total_users ?? 0} />
          <StatCard label="Artist Tracks" value={data?.stats.total_tracks ?? 0} />
          <StatCard label="Total Plays" value={data?.stats.total_plays ?? 0} />
        </div>

        <section>
          <h2 className="text-lg font-semibold mb-4">Recent Users</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-zinc-400 border-b border-zinc-800">
                <th className="text-left py-2">ID</th>
                <th className="text-left py-2">Name</th>
                <th className="text-left py-2">Joined</th>
              </tr>
            </thead>
            <tbody>
              {data?.users.map((u) => (
                <tr key={u.id} className="border-b border-zinc-800/50">
                  <td className="py-2 text-zinc-500 font-mono text-xs">{u.id.slice(0, 8)}...</td>
                  <td className="py-2">{u.display_name}</td>
                  <td className="py-2 text-zinc-400">{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Artist Uploads</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-zinc-400 border-b border-zinc-800">
                <th className="text-left py-2">Title</th>
                <th className="text-left py-2">Artist</th>
                <th className="text-left py-2">Plays</th>
                <th className="text-left py-2">Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {data?.tracks.map((t) => (
                <tr key={t.id} className="border-b border-zinc-800/50">
                  <td className="py-2">{t.title}</td>
                  <td className="py-2 text-zinc-400">{t.artist_name}</td>
                  <td className="py-2 text-zinc-400">{t.plays_count}</td>
                  <td className="py-2 text-zinc-400">{new Date(t.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
      <p className="text-zinc-400 text-sm">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  )
}
