import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  // track the current session
  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  // load the user's profile (name, role) when the session changes
  useEffect(() => {
    let cancelled = false
    if (!session?.user) { setProfile(null); return }
    const user = session.user
    const meta = user.user_metadata || {}
    // set immediately from the login so the UI never flashes a placeholder name
    setProfile({
      name: meta.name || user.email?.split('@')[0] || 'Player',
      role: meta.role || 'player',
      email: user.email,
    })
    // then refine from the profiles table
    ;(async () => {
      const { data } = await supabase.from('profiles').select('name, role').eq('id', user.id).maybeSingle()
      if (cancelled || !data) return
      setProfile((p) => ({ ...p, name: data.name || p.name, role: data.role || p.role }))
    })()
    return () => { cancelled = true }
  }, [session])

  const signUp = async (email, password, name, role) => {
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { name, role } } })
    return error
  }
  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error
  }
  const signOut = async () => { await supabase.auth.signOut() }

  const value = {
    configured: isSupabaseConfigured,
    session,
    user: session?.user || null,
    profile,
    loading,
    signUp, signIn, signOut,
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
