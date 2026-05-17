'use client'

import { useState, type FormEvent } from 'react'
import { relationInputSchema, type RelationInput } from '@/lib/family/schemas'
import type { Person, Relation } from '@/lib/family/types'

export type RelationFormProps = {
  persons: Person[]
  initial?: Partial<Relation>
  onSubmit: (input: RelationInput) => Promise<void>
  onDelete?: () => Promise<void>
  onCancel: () => void
}

export function RelationForm({
  persons,
  initial,
  onSubmit,
  onDelete,
  onCancel,
}: RelationFormProps) {
  const [kind, setKind] = useState<RelationInput['kind']>(initial?.kind ?? 'parent-child')
  const [fromId, setFromId] = useState(initial?.fromId ?? '')
  const [toId, setToId] = useState(initial?.toId ?? '')
  const [subtype, setSubtype] = useState<NonNullable<RelationInput['subtype']>>(
    initial?.subtype ?? 'biological',
  )
  const [startedYear, setStartedYear] = useState<string>(
    initial?.startedYear !== undefined ? String(initial.startedYear) : '',
  )
  const [endedYear, setEndedYear] = useState<string>(
    initial?.endedYear !== undefined ? String(initial.endedYear) : '',
  )
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const parsed = relationInputSchema.safeParse({
      kind,
      fromId,
      toId,
      subtype: kind === 'parent-child' ? subtype : undefined,
      startedYear: startedYear ? Number(startedYear) : undefined,
      endedYear: endedYear ? Number(endedYear) : undefined,
    })
    if (!parsed.success) {
      setError(parsed.error.issues.map((i) => i.message).join(' / '))
      return
    }
    setBusy(true)
    try {
      await onSubmit(parsed.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました')
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!onDelete) return
    if (!confirm('この関係を削除しますか？')) return
    setBusy(true)
    try {
      await onDelete()
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除に失敗しました')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="種類" required>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as RelationInput['kind'])}
          className={inputClass}
        >
          <option value="parent-child">親子</option>
          <option value="spouse">配偶者</option>
        </select>
      </Field>
      <Field label={kind === 'parent-child' ? '親' : '配偶者A'} required>
        <PersonSelect persons={persons} value={fromId} onChange={setFromId} />
      </Field>
      <Field label={kind === 'parent-child' ? '子' : '配偶者B'} required>
        <PersonSelect persons={persons} value={toId} onChange={setToId} />
      </Field>
      {kind === 'parent-child' && (
        <Field label="親子の種類">
          <select
            value={subtype}
            onChange={(e) => setSubtype(e.target.value as NonNullable<RelationInput['subtype']>)}
            className={inputClass}
          >
            <option value="biological">実親子</option>
            <option value="adoptive">養子縁組</option>
          </select>
        </Field>
      )}
      {kind === 'spouse' && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="結婚年">
            <input
              type="number"
              min={0}
              max={9999}
              value={startedYear}
              onChange={(e) => setStartedYear(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="解消年 (離婚・死別)">
            <input
              type="number"
              min={0}
              max={9999}
              value={endedYear}
              onChange={(e) => setEndedYear(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      )}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex items-center justify-between gap-2 pt-2">
        {onDelete ? (
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/40"
          >
            削除
          </button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {busy ? '処理中…' : '保存'}
          </button>
        </div>
      </div>
    </form>
  )
}

function PersonSelect({
  persons,
  value,
  onChange,
}: {
  persons: Person[]
  value: string
  onChange: (id: string) => void
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
      <option value="">— 選択 —</option>
      {persons.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
          {p.birthYear ? ` (${p.birthYear}–${p.deathYear ?? ''})` : ''}
        </option>
      ))}
    </select>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  )
}

const inputClass =
  'block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900'
