'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { relationInputSchema, type RelationInput } from '@/lib/family/schemas'
import {
  PARENT_CHILD_SUBTYPES,
  SIBLING_SUBTYPES,
  SPOUSE_SUBTYPES,
  parentChildSubtypeLabel,
  siblingSubtypeLabel,
  spouseSubtypeLabel,
  type Person,
  type Relation,
  type RelationKind,
  type RelationSubtype,
} from '@/lib/family/types'

export type RelationFormProps = {
  persons: Person[]
  initial?: Partial<Relation>
  onSubmit: (input: RelationInput) => Promise<void>
  onDelete?: () => Promise<void>
  onCancel: () => void
}

const defaultSubtype: Record<RelationKind, RelationSubtype> = {
  'parent-child': 'biological',
  spouse: 'married',
  sibling: 'full',
}

export function RelationForm({
  persons,
  initial,
  onSubmit,
  onDelete,
  onCancel,
}: RelationFormProps) {
  const [kind, setKind] = useState<RelationKind>((initial?.kind as RelationKind) ?? 'parent-child')
  const [fromId, setFromId] = useState(initial?.fromId ?? '')
  const [toId, setToId] = useState(initial?.toId ?? '')
  const [subtype, setSubtype] = useState<RelationSubtype>(
    (initial?.subtype as RelationSubtype) ?? defaultSubtype[kind],
  )
  const [startedYear, setStartedYear] = useState<string>(
    initial?.startedYear !== undefined ? String(initial.startedYear) : '',
  )
  const [endedYear, setEndedYear] = useState<string>(
    initial?.endedYear !== undefined ? String(initial.endedYear) : '',
  )
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const subtypeOptions = useMemo(() => {
    if (kind === 'parent-child') {
      return PARENT_CHILD_SUBTYPES.map((v) => ({ value: v, label: parentChildSubtypeLabel[v] }))
    }
    if (kind === 'spouse') {
      return SPOUSE_SUBTYPES.map((v) => ({ value: v, label: spouseSubtypeLabel[v] }))
    }
    return SIBLING_SUBTYPES.map((v) => ({ value: v, label: siblingSubtypeLabel[v] }))
  }, [kind])

  const onChangeKind = (next: RelationKind) => {
    setKind(next)
    setSubtype(defaultSubtype[next])
  }

  const labels = useMemo(() => {
    if (kind === 'parent-child') return { from: '親', to: '子', startYear: '', endYear: '' }
    if (kind === 'spouse')
      return { from: '配偶者A', to: '配偶者B', startYear: '結婚年', endYear: '解消年 (離婚・死別)' }
    return { from: '本人', to: '兄弟姉妹', startYear: '', endYear: '' }
  }, [kind])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const start = startedYear ? Number(startedYear) : undefined
    const end = endedYear ? Number(endedYear) : undefined
    let payload: RelationInput
    if (kind === 'parent-child') {
      payload = {
        kind,
        fromId,
        toId,
        subtype: subtype as 'biological' | 'adoptive' | 'step' | 'foster',
        startedYear: start,
        endedYear: end,
      }
    } else if (kind === 'spouse') {
      payload = {
        kind,
        fromId,
        toId,
        subtype: subtype as 'married' | 'partnered' | 'engaged',
        startedYear: start,
        endedYear: end,
      }
    } else {
      payload = {
        kind,
        fromId,
        toId,
        subtype: subtype as 'full' | 'half' | 'step' | 'twin',
        startedYear: start,
        endedYear: end,
      }
    }
    const parsed = relationInputSchema.safeParse(payload)
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
          onChange={(e) => onChangeKind(e.target.value as RelationKind)}
          className={inputClass}
        >
          <option value="parent-child">親子</option>
          <option value="spouse">配偶者</option>
          <option value="sibling">兄弟姉妹</option>
        </select>
      </Field>
      <Field label="関係の種別">
        <select
          value={subtype}
          onChange={(e) => setSubtype(e.target.value as RelationSubtype)}
          className={inputClass}
        >
          {subtypeOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label={labels.from} required>
        <PersonSelect persons={persons} value={fromId} onChange={setFromId} />
      </Field>
      <Field label={labels.to} required>
        <PersonSelect persons={persons} value={toId} onChange={setToId} />
      </Field>
      {kind === 'spouse' && (
        <div className="grid grid-cols-2 gap-3">
          <Field label={labels.startYear}>
            <input
              type="number"
              min={0}
              max={9999}
              value={startedYear}
              onChange={(e) => setStartedYear(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label={labels.endYear}>
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
