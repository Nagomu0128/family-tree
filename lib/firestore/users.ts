import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { getDb } from '../firebase/client'

export type UserProfile = {
  uid: string
  displayName: string | null
  email: string | null
  photoURL: string | null
  createdAt?: unknown
  updatedAt?: unknown
}

export async function upsertUserProfile(user: User): Promise<void> {
  const db = getDb()
  const ref = doc(db, 'users', user.uid)
  const existing = await getDoc(ref)
  const base = {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email ? user.email.toLowerCase() : null,
    photoURL: user.photoURL,
    updatedAt: serverTimestamp(),
  }
  if (existing.exists()) {
    await setDoc(ref, base, { merge: true })
  } else {
    await setDoc(ref, { ...base, createdAt: serverTimestamp() })
  }
}
