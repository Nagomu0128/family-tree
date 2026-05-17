import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { getDb } from '../firebase/client'

export type SharePayload = {
  treeId: string
  createdBy: string
  createdAt?: unknown
}

function randomCode(): string {
  // 16 url-safe chars; collision risk negligible for our scale.
  const a = new Uint8Array(12)
  crypto.getRandomValues(a)
  return Array.from(a)
    .map((b) => b.toString(36).padStart(2, '0'))
    .join('')
    .slice(0, 16)
}

/**
 * Create (or replace) the public share link for a tree. Single active link
 * per tree; rotating it invalidates the previous URL. Sets the tree's
 * `shareCode` so security rules can recognize public access.
 */
export async function createShareLink(treeId: string, ownerUid: string): Promise<string> {
  const db = getDb()
  const treeRef = doc(db, 'trees', treeId)
  const treeSnap = await getDoc(treeRef)
  const existing = treeSnap.exists() ? (treeSnap.data().shareCode as string | null) : null
  if (existing) {
    await deleteDoc(doc(db, 'shareLinks', existing))
  }
  const code = randomCode()
  await setDoc(doc(db, 'shareLinks', code), {
    treeId,
    createdBy: ownerUid,
    createdAt: serverTimestamp(),
  })
  await updateDoc(treeRef, { shareCode: code, updatedAt: serverTimestamp() })
  return code
}

export async function revokeShareLink(treeId: string, code: string): Promise<void> {
  const db = getDb()
  await deleteDoc(doc(db, 'shareLinks', code))
  await updateDoc(doc(db, 'trees', treeId), {
    shareCode: null,
    updatedAt: serverTimestamp(),
  })
}

export async function lookupShareLink(code: string): Promise<SharePayload | null> {
  const snap = await getDoc(doc(getDb(), 'shareLinks', code))
  if (!snap.exists()) return null
  return snap.data() as SharePayload
}
