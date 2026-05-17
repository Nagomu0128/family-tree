import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  query,
  serverTimestamp,
  updateDoc,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { getDb } from '../firebase/client'
import type { Relation } from '../family/types'
import type { RelationInput } from '../family/schemas'

export function relationsCollection(treeId: string) {
  return collection(getDb(), 'trees', treeId, 'relations')
}

export function relationsQuery(treeId: string) {
  return query(relationsCollection(treeId))
}

export function relationFromSnapshot(snap: DocumentSnapshot | QueryDocumentSnapshot): Relation {
  const data = snap.data() ?? {}
  return {
    id: snap.id,
    kind: data.kind,
    fromId: data.fromId,
    toId: data.toId,
    subtype: data.subtype,
    startedYear: typeof data.startedYear === 'number' ? data.startedYear : undefined,
    endedYear: typeof data.endedYear === 'number' ? data.endedYear : undefined,
    createdBy: data.createdBy,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
}

function normalizeSpouse(fromId: string, toId: string): [string, string] {
  return fromId < toId ? [fromId, toId] : [toId, fromId]
}

export async function createRelation(
  treeId: string,
  uid: string,
  input: RelationInput,
): Promise<string> {
  const data = { ...input }
  if (data.kind === 'spouse') {
    const [a, b] = normalizeSpouse(data.fromId, data.toId)
    data.fromId = a
    data.toId = b
  }
  const payload: Record<string, unknown> = {
    kind: data.kind,
    fromId: data.fromId,
    toId: data.toId,
    createdBy: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  if (data.kind === 'parent-child') payload.subtype = data.subtype ?? 'biological'
  if (typeof data.startedYear === 'number') payload.startedYear = data.startedYear
  if (typeof data.endedYear === 'number') payload.endedYear = data.endedYear
  const ref = await addDoc(relationsCollection(treeId), payload)
  return ref.id
}

export async function updateRelation(
  treeId: string,
  relationId: string,
  input: Partial<RelationInput>,
): Promise<void> {
  await updateDoc(doc(relationsCollection(treeId), relationId), {
    ...input,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteRelation(treeId: string, relationId: string): Promise<void> {
  await deleteDoc(doc(relationsCollection(treeId), relationId))
}
