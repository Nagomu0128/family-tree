'use client'

import { createContext, useEffect, useState, type ReactNode } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut as fbSignOut, type User } from 'firebase/auth'
import { getFirebaseAuth, googleProvider } from '../firebase/client'
import { upsertUserProfile } from '../firestore/users'

export type AuthState = {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const auth = getFirebaseAuth()
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  const signInWithGoogle = async () => {
    const auth = getFirebaseAuth()
    const result = await signInWithPopup(auth, googleProvider)
    await upsertUserProfile(result.user)
  }

  const signOut = async () => {
    await fbSignOut(getFirebaseAuth())
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
