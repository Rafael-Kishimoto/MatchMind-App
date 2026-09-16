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

// client-only fields we don't write into the cloud jsonb
const strip = (m) => { const { _rowId, _owner, ...rest } = m; return rest }

// managed players: named players a parent looks after who have no account of their own
const MKEY = 'matchmind:managed'
function loadManaged() { try { return JSON.parse(localStorage.getItem(MKEY)) || [] } catch { return [] } }

export function MatchProvider({ children }) {
  const { user, configured } = useAuth()
  const [data, setData] = useState(load)

  // keep a local cache (the in-progress "active" match is always device-local)
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(data)) } catch { /* ignore quota */ }
  }, [data])

  // players this parent/scout manages (no account of their own)
  const [managed, setManaged] = useState(loadManaged)
  useEffect(() => { try { localStorage.setItem(MKEY, JSON.stringify(managed)) } catch { /* ignore */ } }, [managed])
  const addManagedPlayer = (name) => {
    const p = { id: 'mp_' + Date.now().toString(36), name: (name || '').trim() || 'Player' }
    setManaged((m) => [...m, p])
    return p
  }
  const removeManagedPlayer = (id) => setManaged((m) => m.filter((p) => p.id !== id))

  // when signed in to the cloud, saved matches come from Supabase
  useEffect(() => {
    if (!configured) return
    if (!user) { setData((d) => ({ ...d, saved: [] })); return }
    let cancelled = false
    // No owner filter: row-level security returns my own matches PLUS any
    // matches of players I'm linked to as a scout.
    supabase
      .from('matches')
      .select('id, owner, data, created_at')
      .order('created_at', { ascending: false })
      .then(({ data: rows, error }) => {
        if (!error && !cancelled && rows) {
          setData((d) => ({ ...d, saved: rows.map((r) => ({ ...r.data, _rowId: r.id, _owner: r.owner })) }))
        }
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

  // Save the active match to history. Inserts a new match, OR updates one that
  // already exists in the cloud (e.g. a player adding their reflection to a
  // match a scout recorded). If a scout recorded it, it's owned by the player.
  const finishToHistory = async () => {
    const active = data.active
    if (!active) return
    const owner = active.config.recordOwner || user?.id || null
    const done = {
      ...active, status: 'done',
      finishedAt: active.finishedAt || Date.now(),
      recordedBy: active.recordedBy || user?.id,
      _owner: owner,
    }
    if (configured && user) {
      try {
        if (active._rowId) {
          await supabase.from('matches').update({ data: strip(done) }).eq('id', active._rowId)
          done._rowId = active._rowId
        } else {
          const { data: ins } = await supabase.from('matches').insert({ owner, data: strip(done) }).select('id').single()
          if (ins) done._rowId = ins.id
        }
      } catch { /* keep local copy */ }
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
    managedPlayers: managed,
    startMatch, logPoint, undoPoint, saveReflection, addMood, finishToHistory, viewMatch,
    addManagedPlayer, removeManagedPlayer,
  }
  return <MatchContext.Provider value={value}>{children}</MatchContext.Provider>
}

export function useMatch() {
  const ctx = useContext(MatchContext)
  if (!ctx) throw new Error('useMatch must be used inside <MatchProvider>')
  return ctx
}
