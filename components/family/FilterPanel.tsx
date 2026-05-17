'use client'

import { useMemo } from 'react'
import type { Person } from '@/lib/family/types'

export type FilterState = {
  baseId: string | null
  maxDegree: number | null
  includeSpouseLink: boolean
  generations: Set<number>
  genders: Set<Person['gender']>
  yearMin: number | null
  yearMax: number | null
}

export const defaultFilterState: FilterState = {
  baseId: null,
  maxDegree: null,
  includeSpouseLink: true,
  generations: new Set(),
  genders: new Set(),
  yearMin: null,
  yearMax: null,
}

export function isFilterActive(s: FilterState): boolean {
  return (
    s.baseId !== null ||
    s.generations.size > 0 ||
    s.genders.size > 0 ||
    s.yearMin !== null ||
    s.yearMax !== null
  )
}

export function FilterPanel({
  persons,
  state,
  onChange,
  onClose,
  availableGenerations,
}: {
  persons: Person[]
  state: FilterState
  onChange: (next: FilterState) => void
  onClose: () => void
  availableGenerations: number[]
}) {
  const sortedPersons = useMemo(
    () => [...persons].sort((a, b) => a.name.localeCompare(b.name, 'ja')),
    [persons],
  )

  const setField = <K extends keyof FilterState>(key: K, value: FilterState[K]) =>
    onChange({ ...state, [key]: value })

  const toggleGender = (g: Person['gender']) => {
    const next = new Set(state.genders)
    if (next.has(g)) next.delete(g)
    else next.add(g)
    setField('genders', next)
  }

  const toggleGeneration = (g: number) => {
    const next = new Set(state.generations)
    if (next.has(g)) next.delete(g)
    else next.add(g)
    setField('generations', next)
  }

  const reset = () => onChange(defaultFilterState)

  return (
    <aside
      role="dialog"
      aria-label="フィルター"
      className="fixed inset-y-0 right-0 z-30 flex h-full w-full max-w-[88vw] flex-col border-l border-zinc-200 bg-white p-4 shadow-xl sm:relative sm:z-auto sm:w-72 sm:shadow-none dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">フィルター</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="閉じる"
          className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          ✕
        </button>
      </div>

      <div className="mt-4 space-y-5 overflow-auto text-sm">
        <section>
          <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
            基準人物からの親等
          </h4>
          <label className="mt-2 block">
            <span className="text-xs text-zinc-500">基準人物</span>
            <select
              value={state.baseId ?? ''}
              onChange={(e) => setField('baseId', e.target.value || null)}
              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="">— なし —</option>
              {sortedPersons.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-3 block">
            <span className="text-xs text-zinc-500">
              {state.maxDegree === null ? '親等で絞り込まない' : `${state.maxDegree} 親等以内`}
            </span>
            <input
              type="range"
              min={0}
              max={6}
              step={1}
              value={state.maxDegree ?? 6}
              onChange={(e) => {
                const v = Number(e.target.value)
                setField('maxDegree', v === 6 ? null : v)
              }}
              disabled={!state.baseId}
              className="mt-1 w-full"
            />
          </label>
          <label className="mt-2 flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={state.includeSpouseLink}
              onChange={(e) => setField('includeSpouseLink', e.target.checked)}
              disabled={!state.baseId}
            />
            配偶者経由の親族も含める
          </label>
        </section>

        <section>
          <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">世代</h4>
          {availableGenerations.length === 0 ? (
            <p className="mt-2 text-xs text-zinc-500">人物がいません</p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-1">
              {availableGenerations.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleGeneration(g)}
                  className={`rounded-md border px-2 py-0.5 text-xs ${
                    state.generations.has(g)
                      ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                      : 'border-zinc-300 dark:border-zinc-700'
                  }`}
                >
                  G{g}
                </button>
              ))}
            </div>
          )}
        </section>

        <section>
          <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">性別</h4>
          <div className="mt-2 flex flex-wrap gap-1 text-xs">
            {(['male', 'female', 'other', 'unknown'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => toggleGender(g)}
                className={`rounded-md border px-2 py-0.5 ${
                  state.genders.has(g)
                    ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                    : 'border-zinc-300 dark:border-zinc-700'
                }`}
              >
                {genderLabel(g)}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
            生年 (期間内に該当)
          </h4>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="開始"
              value={state.yearMin ?? ''}
              onChange={(e) => setField('yearMin', e.target.value ? Number(e.target.value) : null)}
              className="block w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            <input
              type="number"
              placeholder="終了"
              value={state.yearMax ?? ''}
              onChange={(e) => setField('yearMax', e.target.value ? Number(e.target.value) : null)}
              className="block w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
        </section>
      </div>

      <div className="mt-auto pt-4">
        <button
          type="button"
          onClick={reset}
          className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          フィルターをリセット
        </button>
      </div>
    </aside>
  )
}

function genderLabel(g: Person['gender']): string {
  return g === 'male' ? '男' : g === 'female' ? '女' : g === 'other' ? 'その他' : '不明'
}
