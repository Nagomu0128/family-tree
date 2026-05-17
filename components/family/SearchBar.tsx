'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { rankSearchResults } from '@/lib/family/search'
import type { Person } from '@/lib/family/types'

export type SearchBarProps = {
  persons: Person[]
  onPick: (personId: string) => void
}

export function SearchBar({ persons, onPick }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const results = useMemo(() => rankSearchResults(persons, query, 8), [persons, query])
  const safeActive = Math.min(activeIndex, Math.max(0, results.length - 1))

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC')
      const meta = isMac ? e.metaKey : e.ctrlKey
      if (meta && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const choose = (id: string) => {
    onPick(id)
    setOpen(false)
    setQuery('')
    inputRef.current?.blur()
  }

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md">
      <input
        ref={inputRef}
        type="search"
        value={query}
        placeholder="人物を検索 (Ctrl/Cmd+K)"
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
          setActiveIndex(0)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActiveIndex((i) => Math.min(i + 1, results.length - 1))
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActiveIndex((i) => Math.max(i - 1, 0))
          } else if (e.key === 'Enter' && results[safeActive]) {
            e.preventDefault()
            choose(results[safeActive].id)
          } else if (e.key === 'Escape') {
            setOpen(false)
          }
        }}
        className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
      />
      {open && results.length > 0 && (
        <ul className="absolute top-full right-0 left-0 z-30 mt-1 max-h-72 overflow-auto rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          {results.map((p, i) => (
            <li key={p.id}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  choose(p.id)
                }}
                onMouseEnter={() => setActiveIndex(i)}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${
                  i === safeActive
                    ? 'bg-zinc-100 dark:bg-zinc-800'
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                }`}
              >
                <span className="font-medium">{p.name}</span>
                <span className="text-xs text-zinc-500">
                  {p.maidenName && `旧姓 ${p.maidenName} · `}
                  {p.birthYear ?? '?'}–{p.deathYear ?? ''}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
