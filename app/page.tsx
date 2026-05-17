'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/hooks'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { FullPageSpinner } from '@/components/auth/AuthGuard'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.replace('/trees')
    }
  }, [loading, user, router])

  if (loading || user) {
    return <FullPageSpinner />
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md text-center">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Family Tree</h1>
        <p className="mt-3 text-base text-zinc-600 dark:text-zinc-400">
          家系図をデータで管理。複数人で共同編集、検索・フィルター・GEDCOM 入出力対応。
        </p>
        <div className="mt-8">
          <GoogleSignInButton />
        </div>
        <p className="mt-6 text-xs text-zinc-500 dark:text-zinc-500">
          サインインすると利用規約に同意したものとみなされます。
        </p>
      </div>
    </main>
  )
}
