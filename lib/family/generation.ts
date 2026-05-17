import type { Person, Relation } from './types'

export function buildAdjacency(relations: Relation[]) {
  const parentOf = new Map<string, string[]>() // child -> parents
  const childOf = new Map<string, string[]>() // parent -> children
  const spouseOf = new Map<string, string[]>()
  for (const r of relations) {
    if (r.kind === 'parent-child') {
      parentOf.set(r.toId, [...(parentOf.get(r.toId) ?? []), r.fromId])
      childOf.set(r.fromId, [...(childOf.get(r.fromId) ?? []), r.toId])
    } else if (r.kind === 'spouse') {
      spouseOf.set(r.fromId, [...(spouseOf.get(r.fromId) ?? []), r.toId])
      spouseOf.set(r.toId, [...(spouseOf.get(r.toId) ?? []), r.fromId])
    }
  }
  return { parentOf, childOf, spouseOf }
}

/**
 * Assign a generation number to every person. The earliest reachable ancestor
 * is generation 0; descendants increment, spouses share the same generation.
 *
 * If multiple disconnected components exist, each is anchored independently.
 */
export function computeGenerations(persons: Person[], relations: Relation[]): Map<string, number> {
  const { parentOf, childOf, spouseOf } = buildAdjacency(relations)
  const gen = new Map<string, number>()

  const order = [...persons].sort((a, b) => a.id.localeCompare(b.id))
  for (const root of order) {
    if (gen.has(root.id)) continue
    if (parentOf.has(root.id)) continue
    walkComponent(root.id, 0, gen, { parentOf, childOf, spouseOf })
  }
  // Remaining persons (in a cycle or unreachable from a root) get gen 0.
  for (const p of persons) {
    if (!gen.has(p.id)) walkComponent(p.id, 0, gen, { parentOf, childOf, spouseOf })
  }
  return gen
}

function walkComponent(
  startId: string,
  startGen: number,
  gen: Map<string, number>,
  adj: ReturnType<typeof buildAdjacency>,
) {
  const queue: Array<{ id: string; g: number }> = [{ id: startId, g: startGen }]
  while (queue.length > 0) {
    const { id, g } = queue.shift()!
    const prior = gen.get(id)
    if (prior !== undefined) {
      // Don't move down already-assigned nodes.
      if (g <= prior) continue
    }
    gen.set(id, prior === undefined ? g : Math.max(prior, g))
    for (const sp of adj.spouseOf.get(id) ?? []) {
      if (!gen.has(sp)) queue.push({ id: sp, g })
    }
    for (const c of adj.childOf.get(id) ?? []) {
      queue.push({ id: c, g: g + 1 })
    }
  }
}
