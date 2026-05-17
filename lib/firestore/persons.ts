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
import type { Person } from '../family/types'
import type { PersonInput } from '../family/schemas'

export function personsCollection(treeId: string) {
  return collection(getDb(), 'trees', treeId, 'persons')
}

export function personsQuery(treeId: string) {
  return query(personsCollection(treeId))
}

export function newPersonId(treeId: string): string {
  return doc(personsCollection(treeId)).id
}

export function personFromSnapshot(snap: DocumentSnapshot | QueryDocumentSnapshot): Person {
  const data = snap.data() ?? {}
  return {
    id: snap.id,
    name: data.name ?? '',
    maidenName: data.maidenName || undefined,
    reading: data.reading || undefined,
    gender: data.gender ?? 'unknown',
    birthYear: typeof data.birthYear === 'number' ? data.birthYear : undefined,
    deathYear: typeof data.deathYear === 'number' ? data.deathYear : undefined,
    memo: data.memo || undefined,
    generation: typeof data.generation === 'number' ? data.generation : undefined,
    createdBy: data.createdBy,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
}

function cleanInput<T extends object>(obj: T): Partial<T> {
  const out: Partial<T> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === '') continue
    ;(out as Record<string, unknown>)[k] = v
  }
  return out
}

export async function createPerson(
  treeId: string,
  uid: string,
  input: PersonInput,
  options: { id?: string } = {},
): Promise<string> {
  const id = options.id ?? newPersonId(treeId)
  const data = cleanInput(input)
  await setDoc(doc(personsCollection(treeId), id), {
    ...data,
    createdBy: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return id
}

export async function updatePerson(
  treeId: string,
  personId: string,
  input: Partial<PersonInput>,
): Promise<void> {
  const data = cleanInput(input)
  await updateDoc(doc(personsCollection(treeId), personId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deletePerson(treeId: string, personId: string): Promise<void> {
  await deleteDoc(doc(personsCollection(treeId), personId))
}

/**
 * Restore a person from a prior snapshot. Used by undo of delete; keeps the
 * original id and createdAt/createdBy so relations referencing it still link.
 */
export async function restorePerson(treeId: string, person: Person): Promise<void> {
  const { id, ...rest } = person
  const payload: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(rest)) {
    if (v === undefined) continue
    payload[k] = v
  }
  payload.updatedAt = serverTimestamp()
  await setDoc(doc(personsCollection(treeId), id), payload)
}
