'use client'

import Link from 'next/link'
import { useCollection } from 'react-firebase-hooks/firestore'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { useAuth } from '@/lib/auth/hooks'
import { myTreesQuery, treeFromSnapshot } from '@/lib/firestore/trees'

export default function TreesPage() {
  return (
    <AuthGuard>
      <TreesInner />
    </AuthGuard>
  )
}

function TreesInner() {
  const { user, signOut } = useAuth()
  const [snapshot, loading, error] = useCollection(user ? myTreesQuery(user.uid) : null)
  const trees = snapshot?.docs.map(treeFromSnapshot) ?? []

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">マイツリー</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {user?.displayName ?? user?.email}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/trees/new"
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            新しいツリー
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            サインアウト
          </button>
        </div>
      </header>

      <section className="mt-8">
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">読み込みエラー: {error.message}</p>
        )}
        {loading && !snapshot && <p className="text-sm text-zinc-500">読み込み中…</p>}
        {!loading && trees.length === 0 && (
          <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">まだツリーがありません。</p>
            <Link
              href="/trees/new"
              className="mt-4 inline-block rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              最初のツリーを作る
            </Link>
          </div>
        )}
        {trees.length > 0 && (
          <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {trees.map((tree) => (
              <li key={tree.id}>
                <Link
                  href={`/trees/${tree.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  <div>
                    <div className="font-medium">{tree.name || '(無題)'}</div>
                    <div className="mt-0.5 text-xs text-zinc-500">
                      メンバー {tree.memberIds.length} 人
                      {tree.ownerId === user?.uid && ' · オーナー'}
                    </div>
                  </div>
                  <span aria-hidden className="text-zinc-400">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
