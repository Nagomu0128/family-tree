import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { getDb } from '../firebase/client'
import type { Tree } from '../family/types'

function fromDoc(snap: DocumentSnapshot | QueryDocumentSnapshot): Tree {
  const data = snap.data() ?? {}
  return {
    id: snap.id,
    name: data.name ?? '',
    ownerId: data.ownerId ?? '',
    memberIds: data.memberIds ?? [],
    editorIds: data.editorIds ?? [],
    viewerIds: data.viewerIds ?? [],
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
}

export async function createTree(name: string, ownerUid: string): Promise<string> {
  const db = getDb()
  const ref = await addDoc(collection(db, 'trees'), {
    name,
    ownerId: ownerUid,
    memberIds: [ownerUid],
    editorIds: [ownerUid],
    viewerIds: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  // Mirror into members subcollection for richer per-user metadata.
  await setDoc(doc(db, 'trees', ref.id, 'members', ownerUid), {
    uid: ownerUid,
    role: 'owner',
    addedAt: serverTimestamp(),
    addedBy: ownerUid,
  })
  return ref.id
}

export function myTreesQuery(uid: string) {
  const db = getDb()
  return query(collection(db, 'trees'), where('memberIds', 'array-contains', uid))
}

export const treeFromSnapshot = fromDoc

export async function getTree(treeId: string): Promise<Tree | null> {
  const db = getDb()
  const snap = await getDoc(doc(db, 'trees', treeId))
  if (!snap.exists()) return null
  return fromDoc(snap)
}

export async function renameTree(treeId: string, name: string): Promise<void> {
  const db = getDb()
  await updateDoc(doc(db, 'trees', treeId), {
    name,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteTree(treeId: string): Promise<void> {
  // Subcollections are not auto-deleted in v1. Callers must clear them first
  // (or rely on a future Cloud Function). Owner gate enforced by rules.
  const db = getDb()
  await deleteDoc(doc(db, 'trees', treeId))
}
