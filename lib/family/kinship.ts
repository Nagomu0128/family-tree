import { buildAdjacency } from './generation'
import type { Person, Relation } from './types'

export type KinshipOptions = {
  includeSpouseLink: boolean
}

/**
 * Compute the kinship distance (親等) from `baseId` to every reachable person.
 *
 * Edge weights:
 * - parent-child : 1
 * - spouse       : 0 when `includeSpouseLink` is true, ignored otherwise
 * - sibling      : 2 (you go up to a shared parent and down — matches the
 *                  legal counting for full / half siblings)
 *
 * The walk uses a deque so 0-weight spouse hops keep their priority.
 */
export function computeKinship(
  baseId: string,
  persons: Person[],
  relations: Relation[],
  options: KinshipOptions = { includeSpouseLink: true },
): Map<string, number> {
  const adj = buildAdjacency(relations)
  const dist = new Map<string, number>()
  if (!persons.some((p) => p.id === baseId)) return dist
  dist.set(baseId, 0)
  const deque: string[] = [baseId]
  while (deque.length > 0) {
    const id = deque.shift()!
    const d = dist.get(id) ?? 0
    if (options.includeSpouseLink) {
      for (const sp of adj.spouseOf.get(id) ?? []) {
        const prev = dist.get(sp)
        if (prev === undefined || prev > d) {
          dist.set(sp, d)
          deque.unshift(sp)
        }
      }
    }
    const blood = [...(adj.parentOf.get(id) ?? []), ...(adj.childOf.get(id) ?? [])]
    for (const n of blood) {
      const prev = dist.get(n)
      if (prev === undefined || prev > d + 1) {
        dist.set(n, d + 1)
        deque.push(n)
      }
    }
    for (const sib of adj.siblingOf.get(id) ?? []) {
      const prev = dist.get(sib)
      if (prev === undefined || prev > d + 2) {
        dist.set(sib, d + 2)
        deque.push(sib)
      }
    }
  }
  return dist
}
