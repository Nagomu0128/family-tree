'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/hooks'
import { useTree, canEdit } from '@/lib/family/tree-context'
import { deleteTree, renameTree } from '@/lib/firestore/trees'
import { createPerson, deletePerson, updatePerson } from '@/lib/firestore/persons'
import { createRelation, deleteRelation } from '@/lib/firestore/relations'
import { Modal } from '@/components/ui/Modal'
import { PersonForm } from '@/components/family/PersonForm'
import { RelationForm } from '@/components/family/RelationForm'
import type { Person, Relation } from '@/lib/family/types'

export default function TreeListPage() {
  const { tree, role, treeId, persons, relations, personsLoading } = useTree()
  const { user } = useAuth()
  const router = useRouter()
  const [editingPerson, setEditingPerson] = useState<Person | null>(null)
  const [creatingPerson, setCreatingPerson] = useState(false)
  const [editingRelation, setEditingRelation] = useState<Relation | null>(null)
  const [creatingRelation, setCreatingRelation] = useState(false)
  const [renamingTree, setRenamingTree] = useState(false)
  const [pendingName, setPendingName] = useState('')
  const [busy, setBusy] = useState(false)

  if (!tree || !role || !user) return null

  const editor = canEdit(role)
  const personById = new Map(persons.map((p) => [p.id, p]))

  const onRename = async () => {
    const trimmed = pendingName.trim()
    if (!trimmed || trimmed === tree.name) {
      setRenamingTree(false)
      return
    }
    setBusy(true)
    try {
      await renameTree(treeId, trimmed)
      setRenamingTree(false)
    } finally {
      setBusy(false)
    }
  }

  const onDeleteTree = async () => {
    if (!confirm('このツリーを削除します。配下の人物/関係は手動削除が必要です。続行しますか？'))
      return
    setBusy(true)
    try {
      await deleteTree(treeId)
      router.replace('/trees')
    } catch (e) {
      alert(e instanceof Error ? e.message : '削除に失敗しました')
      setBusy(false)
    }
  }

  return (
    <main className="flex-1 px-6 py-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {renamingTree ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={pendingName}
                    onChange={(e) => setPendingName(e.target.value)}
                    autoFocus
                    className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  />
                  <button
                    type="button"
                    onClick={onRename}
                    disabled={busy}
                    className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
                  >
                    保存
                  </button>
                  <button
                    type="button"
                    onClick={() => setRenamingTree(false)}
                    disabled={busy}
                    className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
                  >
                    キャンセル
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold">{tree.name || '(無題)'}</h2>
                  {editor && (
                    <button
                      type="button"
                      onClick={() => {
                        setPendingName(tree.name)
                        setRenamingTree(true)
                      }}
                      className="text-xs text-zinc-500 hover:underline"
                    >
                      名前を変更
                    </button>
                  )}
                </div>
              )}
            </div>
            {role === 'owner' && (
              <button
                type="button"
                onClick={onDeleteTree}
                disabled={busy}
                className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/40"
              >
                ツリーを削除
              </button>
            )}
          </div>
        </section>

        <section>
          <header className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              人物 <span className="text-sm font-normal text-zinc-500">({persons.length})</span>
            </h3>
            {editor && (
              <button
                type="button"
                onClick={() => setCreatingPerson(true)}
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                + 人物を追加
              </button>
            )}
          </header>
          {personsLoading && persons.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500">読み込み中…</p>
          ) : persons.length === 0 ? (
            <p className="mt-3 rounded-lg border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
              まだ人物がいません。
            </p>
          ) : (
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {persons.map((p) => (
                <li
                  key={p.id}
                  className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                >
                  <button
                    type="button"
                    onClick={() => editor && setEditingPerson(p)}
                    disabled={!editor}
                    className="block w-full text-left disabled:cursor-default"
                  >
                    <div className="font-medium">{p.name}</div>
                    {p.maidenName && (
                      <div className="text-xs text-zinc-500">旧姓: {p.maidenName}</div>
                    )}
                    <div className="mt-0.5 text-xs text-zinc-500">
                      {p.gender !== 'unknown' && (
                        <span className="mr-2">{genderLabel(p.gender)}</span>
                      )}
                      {(p.birthYear || p.deathYear) && (
                        <span>
                          {p.birthYear ?? '?'}–{p.deathYear ?? ''}
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <header className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              関係 <span className="text-sm font-normal text-zinc-500">({relations.length})</span>
            </h3>
            {editor && persons.length >= 2 && (
              <button
                type="button"
                onClick={() => setCreatingRelation(true)}
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                + 関係を追加
              </button>
            )}
          </header>
          {relations.length === 0 ? (
            <p className="mt-3 rounded-lg border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
              まだ関係が登録されていません。
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
              {relations.map((r) => {
                const from = personById.get(r.fromId)
                const to = personById.get(r.toId)
                return (
                  <li
                    key={r.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <div>
                      <span className="font-medium">{from?.name ?? '(不明)'}</span>
                      <span className="mx-2 text-zinc-500">{relationLabel(r.kind, r.subtype)}</span>
                      <span className="font-medium">{to?.name ?? '(不明)'}</span>
                      {r.kind === 'spouse' && (r.startedYear || r.endedYear) && (
                        <span className="ml-2 text-xs text-zinc-500">
                          ({r.startedYear ?? ''}–{r.endedYear ?? ''})
                        </span>
                      )}
                    </div>
                    {editor && (
                      <button
                        type="button"
                        onClick={() => setEditingRelation(r)}
                        className="text-xs text-zinc-500 hover:underline"
                      >
                        編集
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>

      <Modal open={creatingPerson} onClose={() => setCreatingPerson(false)} title="人物を追加">
        <PersonForm
          onCancel={() => setCreatingPerson(false)}
          onSubmit={async (input) => {
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
    </main>
  )
}

function genderLabel(g: Person['gender']): string {
  switch (g) {
    case 'male':
      return '男'
    case 'female':
      return '女'
    case 'other':
      return 'その他'
    default:
      return ''
  }
}

function relationLabel(kind: Relation['kind'], subtype?: Relation['subtype']): string {
  if (kind === 'spouse') {
    if (subtype === 'partnered') return '— パートナー —'
    if (subtype === 'engaged') return '— 婚約 —'
    return '— 配偶 —'
  }
  if (kind === 'sibling') {
    if (subtype === 'twin') return '— 双子 —'
    if (subtype === 'half') return '— 半兄弟姉妹 —'
    if (subtype === 'step') return '— 義兄弟姉妹 —'
    return '— 兄弟姉妹 —'
  }
  if (subtype === 'adoptive') return '⇣ 養子'
  if (subtype === 'step') return '⇣ 継親子'
  if (subtype === 'foster') return '⇣ 里親子'
  return '↓ 親子'
}
