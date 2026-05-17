import type { Timestamp } from 'firebase/firestore'

export type MemberRole = 'owner' | 'editor' | 'viewer'

export type Tree = {
  id: string
  name: string
  ownerId: string
  memberIds: string[]
  editorIds: string[]
  viewerIds: string[]
  /** If set, the tree is publicly readable via /share/{shareCode}. */
  shareCode?: string | null
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export type TreeMember = {
  uid: string
  role: MemberRole
  displayName?: string | null
  email?: string | null
  photoURL?: string | null
  addedAt?: Timestamp
  addedBy?: string
}

export type Gender = 'male' | 'female' | 'other' | 'unknown'

export type Person = {
  id: string
  name: string
  maidenName?: string
  reading?: string
  gender: Gender
  birthYear?: number
  deathYear?: number
  memo?: string
  generation?: number
  createdBy?: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export type RelationKind = 'parent-child' | 'spouse'
export type ParentChildSubtype = 'biological' | 'adoptive'

export type Relation = {
  id: string
  kind: RelationKind
  fromId: string
  toId: string
  subtype?: ParentChildSubtype
  startedYear?: number
  endedYear?: number
  createdBy?: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}
