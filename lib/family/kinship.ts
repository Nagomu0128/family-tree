import { buildAdjacency } from './generation'
import type { Person, Relation } from './types'

export type KinshipOptions = {
  includeSpouseLink: boolean
}

/**
 * Compute the kinship distance (親等) from `baseId` to every reachable person.
 *
 * - Parent-child edge: weight 1
 * - Spouse edge: weight 0 when `includeSpouseLink` is true (treats your spouse
 *   and their bloodline as part of your kinship graph); otherwise spouse edges
 *   are ignored so only consanguineous (blood) kin appears.
 *
 * Uses 0-1 BFS to keep the shortest path under mixed 0/1 edge weights.
 */
export function computeKinship(
  baseId: string,
  persons: Person[],
  relations: Relation[],
  options: KinshipOptions = { includeSpouseLink: true },
): Map<string, number> {
  const { parentOf, childOf, spouseOf } = buildAdjacency(relations)
  const dist = new Map<string, number>()
  if (!persons.some((p) => p.id === baseId)) return dist
  dist.set(baseId, 0)
  const deque: string[] = [baseId]
  while (deque.length > 0) {
    const id = deque.shift()!
    const d = dist.get(id) ?? 0
    if (options.includeSpouseLink) {
      for (const sp of spouseOf.get(id) ?? []) {
        const prev = dist.get(sp)
        if (prev === undefined || prev > d) {
          dist.set(sp, d)
          deque.unshift(sp)
        }
      }
    }
    const oneHop = [...(parentOf.get(id) ?? []), ...(childOf.get(id) ?? [])]
    for (const n of oneHop) {
      const prev = dist.get(n)
      if (prev === undefined || prev > d + 1) {
        dist.set(n, d + 1)
        deque.push(n)
      }
    }
  }
  return dist
}
