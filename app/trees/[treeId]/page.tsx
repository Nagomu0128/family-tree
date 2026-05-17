'use client'

import { FamilyTreeCanvas } from '@/components/family/FamilyTreeCanvas'
import { useTree } from '@/lib/family/tree-context'

export default function TreePage() {
  const { tree, role } = useTree()
  if (!tree || !role) return null
  return <FamilyTreeCanvas />
}
