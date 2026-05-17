'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  buildLayout,
  NODE_HEIGHT,
  NODE_WIDTH,
  type PersonNodeData,
  type RelationEdgeData,
} from '@/lib/family/layout'
import { computeKinship } from '@/lib/family/kinship'
import { PersonNode } from './PersonNode'
import { ParentChildEdge, SiblingEdge, SpouseEdge } from './RelationEdge'
import { SearchBar } from './SearchBar'
import { defaultFilterState, FilterPanel, isFilterActive, type FilterState } from './FilterPanel'
import type { Person, Relation } from '@/lib/family/types'

const nodeTypes = { person: PersonNode }
const edgeTypes = {
  parentChild: ParentChildEdge,
  spouse: SpouseEdge,
  sibling: SiblingEdge,
}

export function ReadOnlyCanvas({
  persons,
  relations,
  treeName,
}: {
  persons: Person[]
  relations: Relation[]
  treeName: string
}) {
  return (
    <ReactFlowProvider>
      <ReadOnlyInner persons={persons} relations={relations} treeName={treeName} />
    </ReactFlowProvider>
  )
}

function ReadOnlyInner({
  persons,
  relations,
  treeName,
}: {
  persons: Person[]
  relations: Relation[]
  treeName: string
}) {
  const { setCenter } = useReactFlow()

  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(
    () => buildLayout(persons, relations),
    [persons, relations],
  )

  const [filterState, setFilterState] = useState<FilterState>(defaultFilterState)
  const [filterOpen, setFilterOpen] = useState(false)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)

  const generationById = useMemo(() => {
    const m = new Map<string, number>()
    for (const n of layoutNodes) m.set(n.id, n.data.generation)
    return m
  }, [layoutNodes])
  const availableGenerations = useMemo(() => {
    const set = new Set<number>()
    for (const g of generationById.values()) set.add(g)
    return [...set].sort((a, b) => a - b)
  }, [generationById])

  const kinship = useMemo(() => {
    if (!filterState.baseId) return null
    return computeKinship(filterState.baseId, persons, relations, {
      includeSpouseLink: filterState.includeSpouseLink,
    })
  }, [filterState.baseId, filterState.includeSpouseLink, persons, relations])

  const matchedIds = useMemo(() => {
    if (!isFilterActive(filterState)) return null
    const result = new Set<string>()
    for (const p of persons) {
      if (filterState.genders.size > 0 && !filterState.genders.has(p.gender)) continue
      const gen = generationById.get(p.id)
      if (
        filterState.generations.size > 0 &&
        (gen === undefined || !filterState.generations.has(gen))
      )
        continue
      if (filterState.yearMin !== null) {
        if (p.birthYear === undefined || p.birthYear < filterState.yearMin) continue
      }
      if (filterState.yearMax !== null) {
        if (p.birthYear === undefined || p.birthYear > filterState.yearMax) continue
      }
      if (kinship && filterState.maxDegree !== null) {
        const d = kinship.get(p.id)
        if (d === undefined || d > filterState.maxDegree) continue
      } else if (kinship && filterState.baseId) {
        if (!kinship.has(p.id)) continue
      }
      result.add(p.id)
    }
    return result
  }, [filterState, persons, generationById, kinship])

  const transformedNodes = useMemo<Node<PersonNodeData>[]>(() => {
    return layoutNodes.map((n) => ({
      ...n,
      data: {
        ...n.data,
        highlight: highlightedId === n.id,
        dimmed: matchedIds ? !matchedIds.has(n.id) : false,
      },
    }))
  }, [layoutNodes, matchedIds, highlightedId])

  const transformedEdges = useMemo<Edge<RelationEdgeData>[]>(() => {
    if (!matchedIds) return layoutEdges
    return layoutEdges.map((e) => ({
      ...e,
      hidden: !(matchedIds.has(e.source) && matchedIds.has(e.target)),
    }))
  }, [layoutEdges, matchedIds])

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<PersonNodeData>>(transformedNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<RelationEdgeData>>(transformedEdges)

  useEffect(() => {
    setNodes(transformedNodes)
  }, [transformedNodes, setNodes])
  useEffect(() => {
    setEdges(transformedEdges)
  }, [transformedEdges, setEdges])

  const focusOnPerson = useCallback(
    (id: string) => {
      const node = layoutNodes.find((n) => n.id === id)
      if (!node) return
      setCenter(node.position.x + NODE_WIDTH / 2, node.position.y + NODE_HEIGHT / 2, {
        zoom: 1.1,
        duration: 500,
      })
      setHighlightedId(id)
      window.setTimeout(() => setHighlightedId((h) => (h === id ? null : h)), 2500)
    },
    [layoutNodes, setCenter],
  )

  return (
    <div className="relative flex flex-1">
      <div className="relative flex-1">
        <div className="pointer-events-none absolute inset-x-0 top-3 z-20 flex flex-col gap-2 px-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="pointer-events-auto">
            <SearchBar persons={persons} onPick={focusOnPerson} />
          </div>
          <div className="pointer-events-auto flex items-center gap-2">
            <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              読み取り専用 · {treeName}
            </span>
            <button
              type="button"
              onClick={() => setFilterOpen((v) => !v)}
              className={`rounded-md border px-3 py-1.5 text-sm shadow-sm ${
                isFilterActive(filterState)
                  ? 'border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200'
                  : 'border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900'
              }`}
            >
              フィルター{isFilterActive(filterState) && ' (適用中)'}
            </button>
          </div>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodesDraggable={false}
          elementsSelectable={false}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
          minZoom={0.1}
          maxZoom={2}
          panOnScroll
          panOnDrag
          zoomOnPinch
          zoomOnDoubleClick={false}
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        </ReactFlow>

        {persons.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-xl border border-dashed border-zinc-300 bg-white/70 p-6 text-center text-sm text-zinc-500 backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/70">
              人物が登録されていません。
            </div>
          </div>
        )}
      </div>

      {filterOpen && (
        <FilterPanel
          persons={persons}
          state={filterState}
          onChange={setFilterState}
          onClose={() => setFilterOpen(false)}
          availableGenerations={availableGenerations}
        />
      )}
    </div>
  )
}
