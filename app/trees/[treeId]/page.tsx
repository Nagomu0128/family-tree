'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTree, canEdit } from '@/lib/family/tree-context'
import { deleteTree, renameTree } from '@/lib/firestore/trees'

export default function TreePage() {
  const { tree, role, treeId } = useTree()
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(tree?.name ?? '')
  const [busy, setBusy] = useState(false)

  if (!tree || !role) return null

  const startRename = () => {
    setName(tree.name)
    setEditing(true)
  }

  const saveRename = async () => {
    const trimmed = name.trim()
    if (!trimmed || trimmed === tree.name) {
      setEditing(false)
      return
    }
    setBusy(true)
    try {
      await renameTree(treeId, trimmed)
      setEditing(false)
    } finally {
      setBusy(false)
    }
  }

  const onDelete = async () => {
    if (!confirm('このツリーを削除します。元に戻せません。続行しますか？')) return
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
      <div className="mx-auto max-w-3xl">
        <section className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {editing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                    disabled={busy}
                  />
                  <button
                    type="button"
                    onClick={saveRename}
                    disabled={busy}
                    className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
                  >
                    保存
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    disabled={busy}
                    className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
                  >
                    キャンセル
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold">{tree.name || '(無題)'}</h2>
                  {canEdit(role) && (
                    <button
                      type="button"
                      onClick={startRename}
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
                onClick={onDelete}
                disabled={busy}
                className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/40"
              >
                ツリーを削除
              </button>
            )}
          </div>
          <p className="mt-3 text-sm text-zinc-500">家系図キャンバスは Phase 5 で実装予定です。</p>
        </section>
      </div>
    </main>
  )
}
