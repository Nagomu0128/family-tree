'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/hooks'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { FullPageSpinner } from '@/components/auth/AuthGuard'

export default function LoginPage() {
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
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-2xl font-semibold tracking-tight">サインイン</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Google アカウントでサインインしてください。
        </p>
        <div className="mt-6">
          <GoogleSignInButton />
        </div>
      </div>
    </main>
  )
}
