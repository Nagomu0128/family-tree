'use client'

import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { PersonNodeData } from '@/lib/family/layout'

const genderStyles: Record<string, string> = {
  male: 'border-sky-300 bg-sky-50 dark:border-sky-700/60 dark:bg-sky-950/40',
  female: 'border-pink-300 bg-pink-50 dark:border-pink-700/60 dark:bg-pink-950/40',
  other: 'border-violet-300 bg-violet-50 dark:border-violet-700/60 dark:bg-violet-950/40',
  unknown: 'border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900',
}

export function PersonNode({ data, selected }: NodeProps) {
  const { person, generation, highlight, dimmed } = data as PersonNodeData
  const genderClass = genderStyles[person.gender] ?? genderStyles.unknown

  return (
    <div
      className={[
        'group relative w-[200px] rounded-lg border-2 px-3 py-2 text-xs shadow-sm transition',
        genderClass,
        selected ? 'ring-2 ring-zinc-900 dark:ring-zinc-100' : '',
        highlight ? 'ring-2 ring-amber-500' : '',
        dimmed ? 'opacity-30' : '',
      ].join(' ')}
    >
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-0 !bg-zinc-400" />
      <div className="absolute -top-2 -left-2 rounded-full bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] text-white dark:bg-zinc-100 dark:text-zinc-900">
        G{generation}
      </div>
      <div className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        {person.name}
      </div>
      {person.maidenName && (
        <div className="truncate text-[10px] text-zinc-500">旧姓: {person.maidenName}</div>
      )}
      <div className="mt-1 flex items-center gap-2 text-[11px] text-zinc-600 dark:text-zinc-400">
        {(person.birthYear !== undefined || person.deathYear !== undefined) && (
          <span>
            {person.birthYear ?? '?'}–{person.deathYear ?? ''}
          </span>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2 !w-2 !border-0 !bg-zinc-400"
      />
    </div>
  )
}
