'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/hooks'

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [loading, user, router])

  if (loading || !user) {
    return <FullPageSpinner />
  }
  return <>{children}</>
}

export function FullPageSpinner() {
  return (
    <div className="flex h-full min-h-[40vh] w-full items-center justify-center">
      <div
        className="size-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-800 dark:border-zinc-700 dark:border-t-zinc-200"
        aria-label="読み込み中"
      />
    </div>
  )
}
