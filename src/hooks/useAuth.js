import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

// There is exactly one admin account (created by you in the Supabase
// dashboard, see README). Anyone signed in with that account is the admin;
// everyone else is a regular listener.
export function useAuth() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return {
    session,
    isAdmin: !!session,
    loading,
    signIn,
    signOut,
  }
}
