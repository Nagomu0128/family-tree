'use client'

import Link from 'next/link'
import { type ReactNode } from 'react'
import { AuthGuard, FullPageSpinner } from '@/components/auth/AuthGuard'
import { TreeProvider, useTree } from '@/lib/family/tree-context'
import { useAuth } from '@/lib/auth/hooks'

export function TreeShell({ treeId, children }: { treeId: string; children: ReactNode }) {
  return (
    <AuthGuard>
      <TreeProvider treeId={treeId}>
        <TreeShellInner>{children}</TreeShellInner>
      </TreeProvider>
    </AuthGuard>
  )
}

function TreeShellInner({ children }: { children: ReactNode }) {
  const { tree, role, loading, error, treeId } = useTree()
  const { user } = useAuth()

  if (loading && !tree) return <FullPageSpinner />

  if (error) {
    return <ErrorScreen message={`ツリーを読み込めませんでした: ${error.message}`} />
  }

  if (!tree) {
    return (
      <ErrorScreen message="ツリーが見つかりません。削除されたか、URL が誤っている可能性があります。" />
    )
  }

  if (!role || !user) {
    return (
      <ErrorScreen message="このツリーへのアクセス権がありません。オーナーに招待を依頼してください。" />
    )
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between gap-4 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <Link href="/trees" className="text-sm text-zinc-500 hover:underline">
            ←
          </Link>
          <div>
            <h1 className="text-base font-semibold">{tree.name || '(無題)'}</h1>
            <div className="text-xs text-zinc-500">
              {role === 'owner' ? 'オーナー' : role === 'editor' ? '編集者' : '閲覧者'} · メンバー
              {tree.memberIds.length} 人
            </div>
          </div>
        </div>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href={`/trees/${treeId}`}
            className="rounded-md px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            キャンバス
          </Link>
          <Link
            href={`/trees/${treeId}/members`}
            className="rounded-md px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            メンバー
          </Link>
        </nav>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  )
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-6 py-12">
      <Link href="/trees" className="text-sm text-zinc-500 hover:underline">
        ← マイツリー
      </Link>
      <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
        {message}
      </div>
    </main>
  )
}
