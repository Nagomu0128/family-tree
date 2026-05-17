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
  type Edge,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useAuth } from '@/lib/auth/hooks'
import { useTree, canEdit } from '@/lib/family/tree-context'
import { buildLayout, type PersonNodeData, type RelationEdgeData } from '@/lib/family/layout'
import { createPerson, deletePerson, updatePerson } from '@/lib/firestore/persons'
import { createRelation, deleteRelation } from '@/lib/firestore/relations'
import { Modal } from '@/components/ui/Modal'
import { PersonForm } from './PersonForm'
import { RelationForm } from './RelationForm'
import { PersonNode } from './PersonNode'
import { AdoptiveEdge, ParentChildEdge, SpouseEdge } from './RelationEdge'
import type { Person, Relation } from '@/lib/family/types'

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
  const { treeId, role, persons, relations, personsLoading } = useTree()
  const { user } = useAuth()
  const editor = canEdit(role)

  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(
    () => buildLayout(persons, relations),
    [persons, relations],
  )

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<PersonNodeData>>(layoutNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<RelationEdgeData>>(layoutEdges)

  // Keep react-flow state in sync with realtime layout recomputation.
  useEffect(() => {
    setNodes(layoutNodes)
  }, [layoutNodes, setNodes])
  useEffect(() => {
    setEdges(layoutEdges)
  }, [layoutEdges, setEdges])

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

  return (
    <div className="relative flex-1">
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
            {editor && '右上の「+ 人物」ボタンから追加してください。'}
          </div>
        </div>
      )}

      {editor && (
        <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center gap-2 sm:right-3 sm:left-auto sm:justify-end">
          <button
            type="button"
            onClick={() => setCreatingPerson(true)}
            className="pointer-events-auto rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white shadow dark:bg-zinc-100 dark:text-zinc-900"
          >
            + 人物
          </button>
          <button
            type="button"
            onClick={() => setCreatingRelation(true)}
            disabled={persons.length < 2}
            className="pointer-events-auto rounded-md bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 shadow ring-1 ring-zinc-300 disabled:opacity-50 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700"
          >
            + 関係
          </button>
        </div>
      )}

      <Modal open={creatingPerson} onClose={() => setCreatingPerson(false)} title="人物を追加">
        <PersonForm
          onCancel={() => setCreatingPerson(false)}
          onSubmit={async (input) => {
            if (!user) return
            await createPerson(treeId, user.uid, input)
            setCreatingPerson(false)
          }}
          submitLabel="追加"
        />
      </Modal>

      <Modal open={!!editingPerson} onClose={() => setEditingPerson(null)} title="人物を編集">
        {editingPerson && (
          <PersonForm
            initial={editingPerson}
            onCancel={() => setEditingPerson(null)}
            onSubmit={async (input) => {
              await updatePerson(treeId, editingPerson.id, input)
              setEditingPerson(null)
            }}
            onDelete={async () => {
              await deletePerson(treeId, editingPerson.id)
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
            if (!user) return
            await createRelation(treeId, user.uid, input)
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
              if (!user) return
              await deleteRelation(treeId, editingRelation.id)
              await createRelation(treeId, user.uid, input)
              setEditingRelation(null)
            }}
            onDelete={async () => {
              await deleteRelation(treeId, editingRelation.id)
              setEditingRelation(null)
            }}
          />
        )}
      </Modal>
    </div>
  )
}
