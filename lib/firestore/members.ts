import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { getDb } from '../firebase/client'
import type { MemberRole } from '../family/types'

export function membersCollection(treeId: string) {
  return collection(getDb(), 'trees', treeId, 'members')
}

export async function changeRole(
  treeId: string,
  uid: string,
  nextRole: Exclude<MemberRole, 'owner'>,
): Promise<void> {
  const db = getDb()
  const treeRef = doc(db, 'trees', treeId)
  const memberRef = doc(db, 'trees', treeId, 'members', uid)
  const batch = writeBatch(db)
  batch.update(treeRef, {
    editorIds: nextRole === 'editor' ? arrayUnion(uid) : arrayRemove(uid),
    viewerIds: nextRole === 'viewer' ? arrayUnion(uid) : arrayRemove(uid),
    memberIds: arrayUnion(uid),
    updatedAt: serverTimestamp(),
  })
  batch.set(
    memberRef,
    {
      uid,
      role: nextRole,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
  await batch.commit()
}

export async function removeMember(treeId: string, uid: string): Promise<void> {
  const db = getDb()
  const treeRef = doc(db, 'trees', treeId)
  const memberRef = doc(db, 'trees', treeId, 'members', uid)
  const batch = writeBatch(db)
  batch.update(treeRef, {
    memberIds: arrayRemove(uid),
    editorIds: arrayRemove(uid),
    viewerIds: arrayRemove(uid),
    updatedAt: serverTimestamp(),
  })
  batch.delete(memberRef)
  await batch.commit()
}

export type AddMemberResult =
  | { ok: true; uid: string }
  | { ok: false; reason: 'not-signed-in' | 'already-member' | 'self' }

export async function addMemberByEmail(
  treeId: string,
  ownerUid: string,
  email: string,
  role: Exclude<MemberRole, 'owner'>,
  existingMemberIds: string[],
): Promise<AddMemberResult> {
  const db = getDb()
  const trimmed = email.trim().toLowerCase()
  const q = query(collection(db, 'users'), where('email', '==', trimmed), limit(1))
  const snap = await getDocs(q)
  if (snap.empty) {
    return { ok: false, reason: 'not-signed-in' }
  }
  const uid = snap.docs[0].id
  if (uid === ownerUid) {
    return { ok: false, reason: 'self' }
  }
  if (existingMemberIds.includes(uid)) {
    return { ok: false, reason: 'already-member' }
  }

  const treeRef = doc(db, 'trees', treeId)
  const memberRef = doc(db, 'trees', treeId, 'members', uid)
  const batch = writeBatch(db)
  batch.update(treeRef, {
    memberIds: arrayUnion(uid),
    editorIds: role === 'editor' ? arrayUnion(uid) : arrayRemove(uid),
    viewerIds: role === 'viewer' ? arrayUnion(uid) : arrayRemove(uid),
    updatedAt: serverTimestamp(),
  })
  batch.set(memberRef, {
    uid,
    role,
    addedAt: serverTimestamp(),
    addedBy: ownerUid,
  })
  await batch.commit()
  return { ok: true, uid }
}

export async function touchTree(treeId: string): Promise<void> {
  await updateDoc(doc(getDb(), 'trees', treeId), { updatedAt: serverTimestamp() })
}
