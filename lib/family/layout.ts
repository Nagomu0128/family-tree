import dagre from 'dagre'
import type { Edge, Node } from '@xyflow/react'
import type { Person, Relation } from './types'
import { computeGenerations } from './generation'

export type PersonNodeData = {
  person: Person
  generation: number
  highlight?: boolean
  dimmed?: boolean
}

export type RelationEdgeData = {
  relation: Relation
}

export const NODE_WIDTH = 200
export const NODE_HEIGHT = 88

export function buildLayout(
  persons: Person[],
  relations: Relation[],
): { nodes: Node<PersonNodeData>[]; edges: Edge<RelationEdgeData>[] } {
  const generations = computeGenerations(persons, relations)

  const g = new dagre.graphlib.Graph()
  g.setGraph({
    rankdir: 'TB',
    nodesep: 32,
    ranksep: 110,
    marginx: 32,
    marginy: 32,
  })
  g.setDefaultEdgeLabel(() => ({}))

  for (const p of persons) {
    g.setNode(p.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  }

  for (const r of relations) {
    if (r.kind === 'parent-child') {
      g.setEdge(r.fromId, r.toId, { weight: 2 })
    }
  }

  // Spouse / sibling pairs are same-rank pulls so dagre clusters them together
  // without ranking one above the other.
  for (const r of relations) {
    if (r.kind === 'spouse' || r.kind === 'sibling') {
      g.setEdge(r.fromId, r.toId, { weight: 0, minlen: 0 })
    }
  }

  dagre.layout(g)

  const positions = new Map<string, { x: number; y: number }>()
  for (const p of persons) {
    const n = g.node(p.id)
    positions.set(p.id, { x: n?.x ?? 0, y: n?.y ?? 0 })
  }

  const nodes: Node<PersonNodeData>[] = persons.map((p) => {
    const pos = positions.get(p.id)!
    return {
      id: p.id,
      type: 'person',
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
      data: { person: p, generation: generations.get(p.id) ?? 0 },
      draggable: false,
      selectable: true,
    }
  })

  const edges: Edge<RelationEdgeData>[] = relations.map((r) => {
    if (r.kind === 'parent-child') {
      return {
        id: r.id,
        source: r.fromId,
        target: r.toId,
        sourceHandle: 'b',
        targetHandle: 't',
        type: 'parentChild',
        data: { relation: r },
      }
    }
    // Pick side handles based on dagre's x-coordinate so the line goes
    // through the inner edge rather than across the node.
    const a = positions.get(r.fromId)!
    const b = positions.get(r.toId)!
    const fromIsLeft = a.x <= b.x
    return {
      id: r.id,
      source: r.fromId,
      target: r.toId,
      sourceHandle: fromIsLeft ? 'rs' : 'ls',
      targetHandle: fromIsLeft ? 'lt' : 'rt',
      type: r.kind === 'spouse' ? 'spouse' : 'sibling',
      data: { relation: r },
    }
  })

  return { nodes, edges }
}
