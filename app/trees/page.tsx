'use client'

import { AuthGuard } from '@/components/auth/AuthGuard'
import { useAuth } from '@/lib/auth/hooks'

export default function TreesPage() {
  return (
    <AuthGuard>
      <TreesInner />
    </AuthGuard>
  )
}

function TreesInner() {
  const { user, signOut } = useAuth()
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">マイツリー</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {user?.displayName ?? user?.email} としてサインイン中
          </p>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          サインアウト
        </button>
      </header>
      <section className="mt-8 rounded-lg border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
        ツリー一覧は Phase 3 で実装予定です。
      </section>
    </main>
  )
}
