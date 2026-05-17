import {
  collection,
  deleteDoc,
  doc,
  query,
  serverTimestamp,
  setDoc,
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

export function newRelationId(treeId: string): string {
  return doc(relationsCollection(treeId)).id
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

function normalizeUndirected(fromId: string, toId: string): [string, string] {
  return fromId < toId ? [fromId, toId] : [toId, fromId]
}

function defaultSubtype(kind: RelationInput['kind']): string {
  if (kind === 'parent-child') return 'biological'
  if (kind === 'spouse') return 'married'
  return 'full'
}

export async function createRelation(
  treeId: string,
  uid: string,
  input: RelationInput,
  options: { id?: string } = {},
): Promise<string> {
  const data = { ...input }
  // Spouse and sibling are undirected — normalize the pair so reverse-order
  // duplicates are detectable and rendering is stable.
  if (data.kind === 'spouse' || data.kind === 'sibling') {
    const [a, b] = normalizeUndirected(data.fromId, data.toId)
    data.fromId = a
    data.toId = b
  }
  const id = options.id ?? newRelationId(treeId)
  const payload: Record<string, unknown> = {
    kind: data.kind,
    fromId: data.fromId,
    toId: data.toId,
    subtype: data.subtype ?? defaultSubtype(data.kind),
    createdBy: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  if (typeof data.startedYear === 'number') payload.startedYear = data.startedYear
  if (typeof data.endedYear === 'number') payload.endedYear = data.endedYear
  await setDoc(doc(relationsCollection(treeId), id), payload)
  return id
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

export async function restoreRelation(treeId: string, relation: Relation): Promise<void> {
  const { id, ...rest } = relation
  const payload: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(rest)) {
    if (v === undefined) continue
    payload[k] = v
  }
  payload.updatedAt = serverTimestamp()
  await setDoc(doc(relationsCollection(treeId), id), payload)
}
