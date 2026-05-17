'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { useAuth } from '@/lib/auth/hooks'
import { createTree } from '@/lib/firestore/trees'

export default function NewTreePage() {
  return (
    <AuthGuard>
      <NewTreeInner />
    </AuthGuard>
  )
}

function NewTreeInner() {
  const { user } = useAuth()
  const router = useRouter()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    const trimmed = name.trim()
    if (!trimmed) {
      setError('名前を入力してください')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const id = await createTree(trimmed, user.uid)
      router.replace(`/trees/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '作成に失敗しました')
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-6 py-12">
      <Link href="/trees" className="text-sm text-zinc-500 hover:underline">
        ← マイツリー
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">新しいツリー</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm font-medium">ツリー名</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: 山田家"
            className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
            autoFocus
            disabled={busy}
          />
        </label>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {busy ? '作成中…' : '作成する'}
        </button>
      </form>
    </main>
  )
}
