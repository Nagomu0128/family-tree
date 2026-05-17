import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { getDb } from '../firebase/client'

export type HistoryAction =
  | { type: 'person:create'; personId: string; name: string }
  | { type: 'person:update'; personId: string; name: string }
  | { type: 'person:delete'; personId: string; name: string }
  | { type: 'relation:create'; relationId: string; kind: string }
  | { type: 'relation:delete'; relationId: string; kind: string }

/**
 * Best-effort audit log of edits. Failure here must not break the UI; callers
 * fire-and-forget. Persisting history also enables Phase 8 share/PDF
 * "last edited" metadata.
 */
export async function logHistory(
  treeId: string,
  uid: string,
  action: HistoryAction,
): Promise<void> {
  try {
    await addDoc(collection(getDb(), 'trees', treeId, 'history'), {
      ...action,
      userId: uid,
      createdAt: serverTimestamp(),
    })
  } catch {
    // ignored — history is non-critical metadata.
  }
}
