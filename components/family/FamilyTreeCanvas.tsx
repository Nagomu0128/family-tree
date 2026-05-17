'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useAuth } from '@/lib/auth/hooks'
import { useTree, canEdit } from '@/lib/family/tree-context'
import {
  buildLayout,
  NODE_HEIGHT,
  NODE_WIDTH,
  type PersonNodeData,
  type RelationEdgeData,
} from '@/lib/family/layout'
import {
  createPerson,
  deletePerson,
  newPersonId,
  restorePerson,
  updatePerson,
} from '@/lib/firestore/persons'
import {
  createRelation,
  deleteRelation,
  newRelationId,
  restoreRelation,
} from '@/lib/firestore/relations'
import { logHistory } from '@/lib/firestore/history'
import { Modal } from '@/components/ui/Modal'
import { PersonForm } from './PersonForm'
import { RelationForm } from './RelationForm'
import { PersonNode } from './PersonNode'
import { AdoptiveEdge, ParentChildEdge, SpouseEdge } from './RelationEdge'
import { SearchBar } from './SearchBar'
import { defaultFilterState, FilterPanel, isFilterActive, type FilterState } from './FilterPanel'
import { HistoryPanel } from './HistoryPanel'
import { ShareMenu } from './ShareMenu'
import { GedcomMenu } from './GedcomMenu'
import { computeKinship } from '@/lib/family/kinship'
import { useHistory } from '@/lib/family/history'
import type { Person, Relation } from '@/lib/family/types'
import type { PersonInput, RelationInput } from '@/lib/family/schemas'

const nodeTypes = { person: PersonNode }
const edgeTypes = {
  parentChild: ParentChildEdge,
  adoptive: AdoptiveEdge,
  spouse: SpouseEdge,
}

export function FamilyTreeCanvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  )
}

function CanvasInner() {
  const { tree, treeId, role, persons, relations, personsLoading } = useTree()
  const { user } = useAuth()
  const editor = canEdit(role)
  const { setCenter } = useReactFlow()
  const history = useHistory()

  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(
    () => buildLayout(persons, relations),
    [persons, relations],
  )

  const [filterState, setFilterState] = useState<FilterState>(defaultFilterState)
  const [filterOpen, setFilterOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)

  const personById = useMemo(() => new Map(persons.map((p) => [p.id, p])), [persons])
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
    return layoutNodes.map((n) => {
      const isHighlight = highlightedId === n.id
      const dimmed = matchedIds ? !matchedIds.has(n.id) : false
      return {
        ...n,
        data: { ...n.data, highlight: isHighlight, dimmed },
      }
    })
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

  // ---- Undo-able mutation wrappers ------------------------------------------
  const doAddPerson = useCallback(
    async (input: PersonInput) => {
      if (!user) return
      const id = newPersonId(treeId)
      await history.push({
        label: `人物を追加: ${input.name}`,
        do: async () => {
          await createPerson(treeId, user.uid, input, { id })
          void logHistory(treeId, user.uid, {
            type: 'person:create',
            personId: id,
            name: input.name,
          })
        },
        undo: async () => {
          await deletePerson(treeId, id)
        },
      })
    },
    [history, treeId, user],
  )

  const doEditPerson = useCallback(
    async (before: Person, after: PersonInput) => {
      if (!user) return
      await history.push({
        label: `人物を編集: ${after.name}`,
        do: async () => {
          await updatePerson(treeId, before.id, after)
          void logHistory(treeId, user.uid, {
            type: 'person:update',
            personId: before.id,
            name: after.name,
          })
        },
        undo: async () => {
          await restorePerson(treeId, before)
        },
      })
    },
    [history, treeId, user],
  )

  const doDeletePerson = useCallback(
    async (snapshot: Person) => {
      if (!user) return
      await history.push({
        label: `人物を削除: ${snapshot.name}`,
        do: async () => {
          await deletePerson(treeId, snapshot.id)
          void logHistory(treeId, user.uid, {
            type: 'person:delete',
            personId: snapshot.id,
            name: snapshot.name,
          })
        },
        undo: async () => {
          await restorePerson(treeId, snapshot)
        },
      })
    },
    [history, treeId, user],
  )

  const doAddRelation = useCallback(
    async (input: RelationInput) => {
      if (!user) return
      const id = newRelationId(treeId)
      await history.push({
        label: `${input.kind === 'spouse' ? '配偶者' : '親子'} 関係を追加`,
        do: async () => {
          await createRelation(treeId, user.uid, input, { id })
          void logHistory(treeId, user.uid, {
            type: 'relation:create',
            relationId: id,
            kind: input.kind,
          })
        },
        undo: async () => {
          await deleteRelation(treeId, id)
        },
      })
    },
    [history, treeId, user],
  )

  const doDeleteRelation = useCallback(
    async (snapshot: Relation) => {
      if (!user) return
      await history.push({
        label: `${snapshot.kind === 'spouse' ? '配偶者' : '親子'} 関係を削除`,
        do: async () => {
          await deleteRelation(treeId, snapshot.id)
          void logHistory(treeId, user.uid, {
            type: 'relation:delete',
            relationId: snapshot.id,
            kind: snapshot.kind,
          })
        },
        undo: async () => {
          await restoreRelation(treeId, snapshot)
        },
      })
    },
    [history, treeId, user],
  )

  const doEditRelation = useCallback(
    async (before: Relation, after: RelationInput) => {
      if (!user) return
      const newId = newRelationId(treeId)
      await history.push({
        label: `関係を編集`,
        do: async () => {
          await deleteRelation(treeId, before.id)
          await createRelation(treeId, user.uid, after, { id: newId })
        },
        undo: async () => {
          await deleteRelation(treeId, newId)
          await restoreRelation(treeId, before)
        },
      })
    },
    [history, treeId, user],
  )

  // ---- Modal state ----------------------------------------------------------
  const [creatingPerson, setCreatingPerson] = useState(false)
  const [editingPerson, setEditingPerson] = useState<Person | null>(null)
  const [creatingRelation, setCreatingRelation] = useState(false)
  const [editingRelation, setEditingRelation] = useState<Relation | null>(null)

  const onNodeClick = useCallback(
    (_: unknown, node: Node<PersonNodeData>) => {
      if (!editor) return
      setEditingPerson(node.data.person)
    },
    [editor],
  )
  const onEdgeClick = useCallback(
    (_: unknown, edge: Edge<RelationEdgeData>) => {
      if (!editor) return
      const rel = edge.data?.relation
      if (rel) setEditingRelation(rel)
    },
    [editor],
  )

  const visibleEditingPerson =
    editingPerson && personById.has(editingPerson.id) ? editingPerson : null

  // ---- Keyboard shortcuts ---------------------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && /INPUT|TEXTAREA|SELECT/.test(target.tagName)) return
      const meta = e.metaKey || e.ctrlKey
      if (!meta) return
      if (e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          if (history.canRedo) {
            e.preventDefault()
            void history.redo()
          }
        } else {
          if (history.canUndo) {
            e.preventDefault()
            void history.undo()
          }
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [history])

  return (
    <div className="relative flex flex-1">
      <div className="relative flex-1">
        <div className="pointer-events-none absolute inset-x-0 top-3 z-20 flex flex-col gap-2 px-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="pointer-events-auto">
            <SearchBar persons={persons} onPick={focusOnPerson} />
          </div>
          <div className="pointer-events-auto flex items-center gap-2">
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
            <button
              type="button"
              onClick={() => setHistoryOpen((v) => !v)}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              履歴
            </button>
            {tree && (
              <ShareMenu
                tree={tree}
                persons={persons}
                relations={relations}
                isOwner={role === 'owner'}
              />
            )}
            {tree && user && (
              <GedcomMenu
                treeId={treeId}
                uid={user.uid}
                treeName={tree.name}
                persons={persons}
                relations={relations}
                canImport={editor}
              />
            )}
            {editor && (
              <>
                <button
                  type="button"
                  onClick={() => setCreatingPerson(true)}
                  className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white shadow dark:bg-zinc-100 dark:text-zinc-900"
                >
                  + 人物
                </button>
                <button
                  type="button"
                  onClick={() => setCreatingRelation(true)}
                  disabled={persons.length < 2}
                  className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 shadow ring-1 ring-zinc-300 disabled:opacity-50 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700"
                >
                  + 関係
                </button>
              </>
            )}
          </div>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
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
          <Controls showInteractive={false} className="!rounded-md !shadow-sm" />
          <MiniMap pannable zoomable className="!rounded-md" nodeStrokeWidth={2} />
        </ReactFlow>

        {personsLoading && persons.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-black/60">
            <p className="text-sm text-zinc-500">読み込み中…</p>
          </div>
        )}

        {persons.length === 0 && !personsLoading && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-xl border border-dashed border-zinc-300 bg-white/70 p-6 text-center text-sm text-zinc-500 backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/70">
              まだ人物がいません。
              {editor && '上部の「+ 人物」ボタンから追加してください。'}
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

      {historyOpen && (
        <HistoryPanel
          state={history.state}
          canUndo={history.canUndo}
          canRedo={history.canRedo}
          onUndo={() => void history.undo()}
          onRedo={() => void history.redo()}
          onClose={() => setHistoryOpen(false)}
        />
      )}

      <Modal open={creatingPerson} onClose={() => setCreatingPerson(false)} title="人物を追加">
        <PersonForm
          onCancel={() => setCreatingPerson(false)}
          onSubmit={async (input) => {
            await doAddPerson(input)
            setCreatingPerson(false)
          }}
          submitLabel="追加"
        />
      </Modal>

      <Modal
        open={!!visibleEditingPerson}
        onClose={() => setEditingPerson(null)}
        title="人物を編集"
      >
        {visibleEditingPerson && (
          <PersonForm
            initial={visibleEditingPerson}
            onCancel={() => setEditingPerson(null)}
            onSubmit={async (input) => {
              await doEditPerson(visibleEditingPerson, input)
              setEditingPerson(null)
            }}
            onDelete={async () => {
              await doDeletePerson(visibleEditingPerson)
              setEditingPerson(null)
            }}
          />
        )}
      </Modal>

      <Modal open={creatingRelation} onClose={() => setCreatingRelation(false)} title="関係を追加">
        <RelationForm
          persons={persons}
          onCancel={() => setCreatingRelation(false)}
          onSubmit={async (input) => {
            await doAddRelation(input)
            setCreatingRelation(false)
          }}
        />
      </Modal>

      <Modal open={!!editingRelation} onClose={() => setEditingRelation(null)} title="関係を編集">
        {editingRelation && (
          <RelationForm
            persons={persons}
            initial={editingRelation}
            onCancel={() => setEditingRelation(null)}
            onSubmit={async (input) => {
              await doEditRelation(editingRelation, input)
              setEditingRelation(null)
            }}
            onDelete={async () => {
              await doDeleteRelation(editingRelation)
              setEditingRelation(null)
            }}
          />
        )}
      </Modal>
    </div>
  )
}
