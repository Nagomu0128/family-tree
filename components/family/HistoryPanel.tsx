'use client'

import type { HistoryState } from '@/lib/family/history'

export function HistoryPanel({
  state,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClose,
}: {
  state: HistoryState
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onClose: () => void
}) {
  const entries = [...state.past.slice().reverse(), ...state.future]
  return (
    <aside
      role="dialog"
      aria-label="変更履歴"
      className="fixed inset-y-0 right-0 z-30 flex h-full w-full max-w-[88vw] flex-col border-l border-zinc-200 bg-white shadow-xl sm:relative sm:z-auto sm:w-72 sm:shadow-none dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <h3 className="text-sm font-semibold">変更履歴</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="閉じる"
          className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          ✕
        </button>
      </div>
      <div className="flex items-center gap-2 border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          ↶ 取り消し
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          ↷ 復元
        </button>
        <span className="ml-auto text-[10px] text-zinc-500">⌘/Ctrl+Z, ⌘/Ctrl+⇧+Z</span>
      </div>
      <ul className="flex-1 overflow-auto">
        {entries.length === 0 && (
          <li className="px-4 py-6 text-center text-xs text-zinc-500">操作履歴はまだありません</li>
        )}
        {entries.map((entry) => {
          const isFuture = !!entry.undoneAt
          return (
            <li
              key={entry.id}
              className={`flex items-center justify-between border-b border-zinc-100 px-4 py-2 text-xs dark:border-zinc-900 ${
                isFuture ? 'text-zinc-400' : ''
              }`}
            >
              <span className="truncate">{entry.label}</span>
              <span className="ml-3 shrink-0 text-[10px] text-zinc-500">
                {new Date(isFuture ? entry.undoneAt! : entry.createdAt).toLocaleTimeString()}
              </span>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
