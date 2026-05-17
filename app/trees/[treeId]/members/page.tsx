'use client'

import { useState } from 'react'
import { collection, query } from 'firebase/firestore'
import { useCollection } from 'react-firebase-hooks/firestore'
import { useAuth } from '@/lib/auth/hooks'
import { useTree } from '@/lib/family/tree-context'
import { getDb } from '@/lib/firebase/client'
import { addMemberByEmail, changeRole, removeMember } from '@/lib/firestore/members'
import type { MemberRole, TreeMember } from '@/lib/family/types'

export default function MembersPage() {
  const { tree, role, treeId } = useTree()
  const { user } = useAuth()
  const db = getDb()
  const [membersSnap] = useCollection(query(collection(db, 'trees', treeId, 'members')))

  if (!tree || !role || !user) return null

  const members = (membersSnap?.docs ?? []).map((d) => {
    const data = d.data()
    return {
      uid: d.id,
      role: (data.role ?? 'viewer') as MemberRole,
      ...data,
    } satisfies TreeMember
  })

  const isOwner = role === 'owner'

  return (
    <main className="flex-1 px-6 py-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <section>
          <h2 className="text-lg font-semibold">メンバー</h2>
          <ul className="mt-3 divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {members.map((m) => (
              <MemberRow
                key={m.uid}
                member={m}
                treeId={treeId}
                isOwner={isOwner}
                isSelf={m.uid === user.uid}
              />
            ))}
            {members.length === 0 && (
              <li className="px-4 py-3 text-sm text-zinc-500">読み込み中…</li>
            )}
          </ul>
        </section>

        {isOwner && (
          <AddMemberSection
            treeId={treeId}
            ownerUid={user.uid}
            existingMemberIds={tree.memberIds}
          />
        )}
      </div>
    </main>
  )
}

function MemberRow({
  member,
  treeId,
  isOwner,
  isSelf,
}: {
  member: TreeMember
  treeId: string
  isOwner: boolean
  isSelf: boolean
}) {
  const [busy, setBusy] = useState(false)

  const update = async (next: Exclude<MemberRole, 'owner'>) => {
    setBusy(true)
    try {
      await changeRole(treeId, member.uid, next)
    } finally {
      setBusy(false)
    }
  }

  const onRemove = async () => {
    if (!confirm('このメンバーを外しますか？')) return
    setBusy(true)
    try {
      await removeMember(treeId, member.uid)
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
      <div>
        <div className="font-mono text-xs text-zinc-500">{member.uid}</div>
        <div className="text-xs text-zinc-500">役割: {roleLabel(member.role)}</div>
      </div>
      {isOwner && member.role !== 'owner' && (
        <div className="flex items-center gap-2">
          <select
            value={member.role}
            onChange={(e) => update(e.target.value as Exclude<MemberRole, 'owner'>)}
            disabled={busy}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="editor">編集者</option>
            <option value="viewer">閲覧者</option>
          </select>
          <button
            type="button"
            onClick={onRemove}
            disabled={busy}
            className="rounded-md border border-red-300 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/40"
          >
            外す
          </button>
        </div>
      )}
      {isSelf && <span className="text-xs text-zinc-500">あなた</span>}
    </li>
  )
}

function AddMemberSection({
  treeId,
  ownerUid,
  existingMemberIds,
}: {
  treeId: string
  ownerUid: string
  existingMemberIds: string[]
}) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Exclude<MemberRole, 'owner'>>('editor')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setBusy(true)
    setMsg(null)
    try {
      const result = await addMemberByEmail(treeId, ownerUid, email, role, existingMemberIds)
      if (result.ok) {
        setMsg({ kind: 'ok', text: `${email} をメンバーに追加しました` })
        setEmail('')
      } else {
        const text =
          result.reason === 'not-signed-in'
            ? 'そのメールアドレスのユーザーが見つかりません。相手に一度 Family Tree でサインインしてもらってください。'
            : result.reason === 'already-member'
              ? 'すでにメンバーです'
              : 'あなた自身は追加できません'
        setMsg({ kind: 'err', text })
      }
    } catch (err) {
      setMsg({
        kind: 'err',
        text: err instanceof Error ? err.message : '追加に失敗しました',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section>
      <h2 className="text-lg font-semibold">メンバーを追加</h2>
      <p className="mt-1 text-xs text-zinc-500">
        相手の Google アカウントのメールアドレスを入力します。相手が事前に Family Tree
        へサインインしている必要があります。
      </p>
      <form onSubmit={onSubmit} className="mt-3 flex flex-wrap items-end gap-2">
        <label className="flex-1">
          <span className="text-xs text-zinc-500">メールアドレス</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="invitee@example.com"
            disabled={busy}
            className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label>
          <span className="text-xs text-zinc-500">役割</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Exclude<MemberRole, 'owner'>)}
            disabled={busy}
            className="mt-1 block rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="editor">編集者</option>
            <option value="viewer">閲覧者</option>
          </select>
        </label>
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {busy ? '追加中…' : '追加する'}
        </button>
      </form>
      {msg && (
        <p
          className={
            msg.kind === 'ok'
              ? 'mt-2 text-sm text-green-700 dark:text-green-400'
              : 'mt-2 text-sm text-red-600 dark:text-red-400'
          }
        >
          {msg.text}
        </p>
      )}
    </section>
  )
}

function roleLabel(role: MemberRole): string {
  return role === 'owner' ? 'オーナー' : role === 'editor' ? '編集者' : '閲覧者'
}
