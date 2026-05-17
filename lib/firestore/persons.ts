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
import type { Person } from '../family/types'
import type { PersonInput } from '../family/schemas'

export function personsCollection(treeId: string) {
  return collection(getDb(), 'trees', treeId, 'persons')
}

export function personsQuery(treeId: string) {
  return query(personsCollection(treeId))
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

function stripUndefined<T extends object>(obj: T): Partial<T> {
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
): Promise<string> {
  const data = stripUndefined(input)
  const ref = await addDoc(personsCollection(treeId), {
    ...data,
    createdBy: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updatePerson(
  treeId: string,
  personId: string,
  input: Partial<PersonInput>,
): Promise<void> {
  const data = stripUndefined(input)
  await updateDoc(doc(personsCollection(treeId), personId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deletePerson(treeId: string, personId: string): Promise<void> {
  await deleteDoc(doc(personsCollection(treeId), personId))
}
