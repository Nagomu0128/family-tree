'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { doc, onSnapshot } from 'firebase/firestore'
import { useCollection } from 'react-firebase-hooks/firestore'
import { getDb } from '@/lib/firebase/client'
import { lookupShareLink } from '@/lib/firestore/shareLinks'
import { treeFromSnapshot } from '@/lib/firestore/trees'
import { personFromSnapshot, personsQuery } from '@/lib/firestore/persons'
import { relationFromSnapshot, relationsQuery } from '@/lib/firestore/relations'
import { ReadOnlyCanvas } from '@/components/family/ReadOnlyCanvas'
import { FullPageSpinner } from '@/components/auth/AuthGuard'
import type { Tree } from '@/lib/family/types'

export function SharedTreeClient({ code }: { code: string }) {
  const [treeId, setTreeId] = useState<string | null>(null)
  const [tree, setTree] = useState<Tree | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [resolving, setResolving] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const payload = await lookupShareLink(code)
        if (cancelled) return
        if (!payload) {
          setError('共有リンクが見つからないか、無効化されています。')
          setResolving(false)
          return
        }
        setTreeId(payload.treeId)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : '読み込みに失敗しました')
          setResolving(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [code])

  useEffect(() => {
    if (!treeId) return
    const unsub = onSnapshot(
      doc(getDb(), 'trees', treeId),
      (snap) => {
        if (!snap.exists()) {
          setError('ツリーが見つかりません。')
          setResolving(false)
          return
        }
        const t = treeFromSnapshot(snap)
        if (!t.shareCode || t.shareCode !== code) {
          setError('共有が解除されています。')
          setTree(null)
          setResolving(false)
          return
        }
        setTree(t)
        setResolving(false)
      },
      (e) => {
        setError(e.message)
        setResolving(false)
      },
    )
    return unsub
  }, [treeId, code])

  const [personsSnap] = useCollection(treeId ? personsQuery(treeId) : null)
  const [relationsSnap] = useCollection(treeId ? relationsQuery(treeId) : null)

  if (resolving) return <FullPageSpinner />
  if (error || !tree)
    return (
      <main className="mx-auto w-full max-w-md flex-1 px-6 py-12">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {error ?? 'ツリーを読み込めません'}
        </div>
        <Link href="/" className="mt-4 inline-block text-sm text-zinc-500 hover:underline">
          ← ホームへ
        </Link>
      </main>
    )

  const persons = personsSnap?.docs.map(personFromSnapshot) ?? []
  const relations = relationsSnap?.docs.map(relationFromSnapshot) ?? []

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div>
          <h1 className="text-base font-semibold">{tree.name || '(無題のツリー)'}</h1>
          <div className="text-xs text-zinc-500">Family Tree · 公開閲覧</div>
        </div>
        <Link
          href="/"
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          自分でも作る
        </Link>
      </header>
      <ReadOnlyCanvas persons={persons} relations={relations} treeName={tree.name || '家系図'} />
    </div>
  )
}
