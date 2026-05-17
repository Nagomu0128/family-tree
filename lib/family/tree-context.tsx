'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { doc } from 'firebase/firestore'
import { useCollection, useDocument } from 'react-firebase-hooks/firestore'
import { getDb } from '@/lib/firebase/client'
import { useAuth } from '@/lib/auth/hooks'
import { treeFromSnapshot } from '@/lib/firestore/trees'
import { personFromSnapshot, personsQuery } from '@/lib/firestore/persons'
import { relationFromSnapshot, relationsQuery } from '@/lib/firestore/relations'
import type { MemberRole, Person, Relation, Tree } from './types'

export type TreeContextValue = {
  treeId: string
  tree: Tree | null
  role: MemberRole | null
  loading: boolean
  error: Error | null
  persons: Person[]
  relations: Relation[]
  personsLoading: boolean
  relationsLoading: boolean
}

const TreeCtx = createContext<TreeContextValue | undefined>(undefined)

export function TreeProvider({ treeId, children }: { treeId: string; children: ReactNode }) {
  const { user } = useAuth()
  const [snap, loading, error] = useDocument(doc(getDb(), 'trees', treeId))
  const [personsSnap, personsLoading] = useCollection(personsQuery(treeId))
  const [relationsSnap, relationsLoading] = useCollection(relationsQuery(treeId))

  const value = useMemo<TreeContextValue>(() => {
    const persons = personsSnap ? personsSnap.docs.map(personFromSnapshot) : []
    const relations = relationsSnap ? relationsSnap.docs.map(relationFromSnapshot) : []
    if (!snap || !snap.exists()) {
      return {
        treeId,
        tree: null,
        role: null,
        loading,
        error: error ?? null,
        persons,
        relations,
        personsLoading,
        relationsLoading,
      }
    }
    const tree = treeFromSnapshot(snap)
    let role: MemberRole | null = null
    if (user) {
      if (user.uid === tree.ownerId) role = 'owner'
      else if (tree.editorIds.includes(user.uid)) role = 'editor'
      else if (tree.viewerIds.includes(user.uid)) role = 'viewer'
    }
    return {
      treeId,
      tree,
      role,
      loading,
      error: error ?? null,
      persons,
      relations,
      personsLoading,
      relationsLoading,
    }
  }, [
    snap,
    loading,
    error,
    treeId,
    user,
    personsSnap,
    relationsSnap,
    personsLoading,
    relationsLoading,
  ])

  return <TreeCtx.Provider value={value}>{children}</TreeCtx.Provider>
}

export function useTree(): TreeContextValue {
  const ctx = useContext(TreeCtx)
  if (!ctx) throw new Error('useTree must be used inside <TreeProvider>')
  return ctx
}

export function canEdit(role: MemberRole | null): boolean {
  return role === 'owner' || role === 'editor'
}
