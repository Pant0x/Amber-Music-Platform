'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface DashboardData {
  users: { id: string; display_name: string; created_at: string }[]
  tracks: { id: string; title: string; artist_name: string; plays_count: number; created_at: string }[]
  stats: { total_users: number; total_tracks: number; total_plays: number }
  pending_artists: { user_id: string; display_name: string; avatar_url: string; bio: string; created_at: string }[]
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

  const handleApproveArtist = async (userId: string, approve: boolean) => {
    try {
      const res = await fetch('/api/admin/artist/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, approve }),
      })
      if (res.ok) {
        setData(prev => {
          if (!prev) return null
          return {
            ...prev,
            pending_artists: prev.pending_artists.filter(a => a.user_id !== userId),
            stats: {
              ...prev.stats,
              total_users: prev.stats.total_users,
              total_tracks: prev.stats.total_tracks + (approve ? 1 : 0),
              total_plays: prev.stats.total_plays,
            }
          }
        })
      } else {
        alert('Action failed')
      }
    } catch {
      alert('Network error')
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-zinc-400 animate-pulse">Loading dashboard...</p>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-red-400">{error}</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20">
      <header className="flex items-center justify-between px-8 py-4 border-b border-zinc-900 bg-zinc-950/40 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
          <h1 className="text-lg font-bold tracking-tight">Sonora Admin Dashboard</h1>
        </div>
        <button onClick={handleLogout} className="text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer font-medium">
          Logout
        </button>
      </header>

      <div className="max-w-6xl mx-auto p-8 space-y-10">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-6">
          <StatCard label="Total Users" value={data?.stats.total_users ?? 0} />
          <StatCard label="Artist Tracks" value={data?.stats.total_tracks ?? 0} />
          <StatCard label="Total Plays" value={data?.stats.total_plays ?? 0} />
        </div>

        {/* Pending Artist Applications */}
        {data?.pending_artists && data.pending_artists.length > 0 && (
          <section className="bg-zinc-900/20 p-6 rounded-2xl border border-zinc-800/80 space-y-4">
            <h2 className="text-md font-bold text-yellow-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              Pending Artist Applications ({data.pending_artists.length})
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {data.pending_artists.map((app) => (
                <div key={app.user_id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-zinc-950/40 rounded-xl border border-zinc-800/60 gap-4 transition-all hover:border-zinc-700/80">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-900 border border-white/5 flex-shrink-0 flex items-center justify-center">
                      {app.avatar_url ? (
                        <img src={app.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-400 font-bold text-lg bg-zinc-900">
                          {app.display_name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{app.display_name}</h4>
                      <p className="text-xs text-zinc-400 mt-1 max-w-lg">{app.bio || 'No bio provided.'}</p>
                      <p className="text-[10px] text-zinc-500 font-mono mt-1">ID: {app.user_id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApproveArtist(app.user_id, true)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleApproveArtist(app.user_id, false)}
                      className="px-4 py-2 bg-zinc-900 hover:bg-red-950 hover:text-red-400 text-zinc-400 border border-zinc-800 hover:border-red-900/50 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Users Table */}
        <section className="bg-zinc-900/10 p-6 rounded-2xl border border-zinc-900 space-y-4">
          <h2 className="text-md font-bold mb-4">Recent Users</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-zinc-500 border-b border-zinc-900 text-[11px] uppercase tracking-wider">
                  <th className="text-left py-3 font-semibold">User ID</th>
                  <th className="text-left py-3 font-semibold">Display Name</th>
                  <th className="text-left py-3 font-semibold">Joined Date</th>
                </tr>
              </thead>
              <tbody>
                {data?.users.map((u) => (
                  <tr key={u.id} className="border-b border-zinc-900/50 hover:bg-white/[0.01]">
                    <td className="py-3 text-zinc-500 font-mono text-xs">{u.id}</td>
                    <td className="py-3 text-zinc-200 font-medium">{u.display_name}</td>
                    <td className="py-3 text-zinc-400 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Tracks Table */}
        <section className="bg-zinc-900/10 p-6 rounded-2xl border border-zinc-900 space-y-4">
          <h2 className="text-md font-bold mb-4">Artist Uploads</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-zinc-500 border-b border-zinc-900 text-[11px] uppercase tracking-wider">
                  <th className="text-left py-3 font-semibold">Track Title</th>
                  <th className="text-left py-3 font-semibold">Artist Name</th>
                  <th className="text-left py-3 font-semibold">Total Plays</th>
                  <th className="text-left py-3 font-semibold">Uploaded Date</th>
                </tr>
              </thead>
              <tbody>
                {data?.tracks.map((t) => (
                  <tr key={t.id} className="border-b border-zinc-900/50 hover:bg-white/[0.01]">
                    <td className="py-3 text-zinc-200 font-semibold">{t.title}</td>
                    <td className="py-3 text-zinc-400 font-medium">{t.artist_name}</td>
                    <td className="py-3 text-zinc-400 text-xs">{t.plays_count} plays</td>
                    <td className="py-3 text-zinc-400 text-xs">{new Date(t.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-zinc-950/40 rounded-2xl p-6 border border-zinc-900 backdrop-blur transition-all hover:border-zinc-800">
      <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">{label}</p>
      <p className="text-4xl font-extrabold mt-2 tracking-tight text-white">{value}</p>
    </div>
  )
}
