'use client'

import { useState, type FormEvent } from 'react'
import { personInputSchema, type PersonInput } from '@/lib/family/schemas'
import type { Person } from '@/lib/family/types'

export type PersonFormProps = {
  initial?: Partial<Person>
  onSubmit: (input: PersonInput) => Promise<void>
  onDelete?: () => Promise<void>
  onCancel: () => void
  submitLabel?: string
}

export function PersonForm({
  initial,
  onSubmit,
  onDelete,
  onCancel,
  submitLabel = '保存',
}: PersonFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [maidenName, setMaidenName] = useState(initial?.maidenName ?? '')
  const [reading, setReading] = useState(initial?.reading ?? '')
  const [gender, setGender] = useState<PersonInput['gender']>(initial?.gender ?? 'unknown')
  const [birthYear, setBirthYear] = useState<string>(
    initial?.birthYear !== undefined ? String(initial.birthYear) : '',
  )
  const [deathYear, setDeathYear] = useState<string>(
    initial?.deathYear !== undefined ? String(initial.deathYear) : '',
  )
  const [memo, setMemo] = useState(initial?.memo ?? '')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const parsed = personInputSchema.safeParse({
      name,
      maidenName: maidenName || undefined,
      reading: reading || undefined,
      gender,
      birthYear: birthYear ? Number(birthYear) : undefined,
      deathYear: deathYear ? Number(deathYear) : undefined,
      memo: memo || undefined,
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
    if (!confirm('この人物を削除します。続行しますか？')) return
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
      <Field label="名前" required>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          required
          className={inputClass}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="旧姓">
          <input
            type="text"
            value={maidenName}
            onChange={(e) => setMaidenName(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="読み (かな)">
          <input
            type="text"
            value={reading}
            onChange={(e) => setReading(e.target.value)}
            placeholder="やまだ たろう"
            className={inputClass}
          />
        </Field>
      </div>
      <Field label="性別">
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value as PersonInput['gender'])}
          className={inputClass}
        >
          <option value="unknown">未設定</option>
          <option value="male">男</option>
          <option value="female">女</option>
          <option value="other">その他</option>
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="生年">
          <input
            type="number"
            min={0}
            max={9999}
            value={birthYear}
            onChange={(e) => setBirthYear(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="没年">
          <input
            type="number"
            min={0}
            max={9999}
            value={deathYear}
            onChange={(e) => setDeathYear(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>
      <Field label="メモ">
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={3}
          className={inputClass}
        />
      </Field>
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
            {busy ? '処理中…' : submitLabel}
          </button>
        </div>
      </div>
    </form>
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
