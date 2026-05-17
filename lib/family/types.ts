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

export type RelationKind = 'parent-child' | 'spouse' | 'sibling'

export type ParentChildSubtype = 'biological' | 'adoptive' | 'step' | 'foster'
export type SpouseSubtype = 'married' | 'partnered' | 'engaged'
export type SiblingSubtype = 'full' | 'half' | 'step' | 'twin'

export type RelationSubtype = ParentChildSubtype | SpouseSubtype | SiblingSubtype

export type Relation = {
  id: string
  kind: RelationKind
  fromId: string
  toId: string
  subtype?: RelationSubtype
  startedYear?: number
  endedYear?: number
  createdBy?: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export const PARENT_CHILD_SUBTYPES: ParentChildSubtype[] = [
  'biological',
  'adoptive',
  'step',
  'foster',
]
export const SPOUSE_SUBTYPES: SpouseSubtype[] = ['married', 'partnered', 'engaged']
export const SIBLING_SUBTYPES: SiblingSubtype[] = ['full', 'half', 'step', 'twin']

export const parentChildSubtypeLabel: Record<ParentChildSubtype, string> = {
  biological: '実親子',
  adoptive: '養子縁組',
  step: '継親子',
  foster: '里親子',
}
export const spouseSubtypeLabel: Record<SpouseSubtype, string> = {
  married: '婚姻',
  partnered: '事実婚 / パートナー',
  engaged: '婚約',
}
export const siblingSubtypeLabel: Record<SiblingSubtype, string> = {
  full: '全兄弟姉妹',
  half: '半兄弟姉妹',
  step: '義兄弟姉妹',
  twin: '双子',
}
