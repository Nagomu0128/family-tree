'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth/hooks'

export function GoogleSignInButton() {
  const { signInWithGoogle } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onClick = async () => {
    setBusy(true)
    setError(null)
    try {
      await signInWithGoogle()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className="inline-flex h-11 items-center justify-center gap-3 rounded-md border border-black/10 bg-white px-5 text-sm font-medium text-gray-800 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
      >
        <GoogleMark />
        {busy ? 'サインイン中…' : 'Google でサインイン'}
      </button>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A9 9 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.346l2.582-2.58C13.463.891 11.426 0 9 0 5.477 0 2.432 2.02.957 4.961l3.007 2.332C4.672 5.165 6.656 3.58 9 3.58Z"
      />
    </svg>
  )
}
