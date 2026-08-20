import { createContext, useContext, useEffect, useState } from 'react'
import { createMatch } from '../lib/engine'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthStore'

const KEY = 'matchmind:v1'
const MatchContext = createContext(null)

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || { active: null, saved: [] } }
  catch { return { active: null, saved: [] } }
}

export function MatchProvider({ children }) {
  const { user, configured } = useAuth()
  const [data, setData] = useState(load)

  // keep a local cache (the in-progress "active" match is always device-local)
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(data)) } catch { /* ignore quota */ }
  }, [data])

  // when signed in to the cloud, saved matches come from Supabase
  useEffect(() => {
    if (!configured) return
    if (!user) { setData((d) => ({ ...d, saved: [] })); return }
    let cancelled = false
    // No owner filter: row-level security returns my own matches PLUS any
    // matches of players I'm linked to as a scout.
    supabase
      .from('matches')
      .select('data, created_at')
      .order('created_at', { ascending: false })
      .then(({ data: rows, error }) => {
        if (!error && !cancelled && rows) setData((d) => ({ ...d, saved: rows.map((r) => r.data) }))
      })
    return () => { cancelled = true }
  }, [configured, user])

  const startMatch = (config) => {
    const m = createMatch(config)
    setData((d) => ({ ...d, active: m }))
    return m
  }
  const logPoint = (pt) =>
    setData((d) => (d.active ? { ...d, active: { ...d.active, points: [...d.active.points, pt] } } : d))
  const undoPoint = () =>
    setData((d) => (d.active ? { ...d, active: { ...d.active, points: d.active.points.slice(0, -1) } } : d))
  const saveReflection = (answers) =>
    setData((d) => (d.active ? { ...d, active: { ...d.active, reflection: answers } } : d))
  const addMood = (mood) =>
    setData((d) => (d.active ? { ...d, active: { ...d.active, moods: [...(d.active.moods || []), mood] } } : d))

  const finishToHistory = async () => {
    const active = data.active
    if (!active) return
    const done = { ...active, status: 'done', finishedAt: Date.now(), recordedBy: user?.id }
    if (configured && user) {
      // If a scout recorded this for a linked player, it's owned by that player.
      const owner = active.config.recordOwner || user.id
      try { await supabase.from('matches').insert({ owner, data: done }) } catch { /* keep local copy */ }
    }
    setData((d) => ({
      ...d,
      saved: [done, ...d.saved.filter((x) => x.id !== done.id)],
      active: null,
    }))
  }

  const viewMatch = (id) =>
    setData((d) => {
      const m = d.saved.find((x) => x.id === id)
      return m ? { ...d, active: { ...m } } : d
    })

  const value = {
    activeMatch: data.active,
    savedMatches: data.saved,
    startMatch, logPoint, undoPoint, saveReflection, addMood, finishToHistory, viewMatch,
  }
  return <MatchContext.Provider value={value}>{children}</MatchContext.Provider>
}

export function useMatch() {
  const ctx = useContext(MatchContext)
  if (!ctx) throw new Error('useMatch must be used inside <MatchProvider>')
  return ctx
}
