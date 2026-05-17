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
      g.setEdge(r.fromId, r.toId, { weight: 1 })
    }
  }

  // Spouse pairs as same-rank pull: dagre lacks rank constraints, so we
  // approximate by adding an invisible edge with minlen 0 and high weight.
  for (const r of relations) {
    if (r.kind === 'spouse') {
      g.setEdge(r.fromId, r.toId, { weight: 0, minlen: 0 })
    }
  }

  dagre.layout(g)

  const nodes: Node<PersonNodeData>[] = persons.map((p) => {
    const n = g.node(p.id)
    return {
      id: p.id,
      type: 'person',
      position: { x: (n?.x ?? 0) - NODE_WIDTH / 2, y: (n?.y ?? 0) - NODE_HEIGHT / 2 },
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
        type: r.subtype === 'adoptive' ? 'adoptive' : 'parentChild',
        data: { relation: r },
      }
    }
    return {
      id: r.id,
      source: r.fromId,
      target: r.toId,
      type: 'spouse',
      data: { relation: r },
    }
  })

  return { nodes, edges }
}
