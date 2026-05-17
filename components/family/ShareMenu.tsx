'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { createShareLink, revokeShareLink } from '@/lib/firestore/shareLinks'
import { exportTreeAsPdf } from '@/lib/family/svg-export'
import type { Person, Relation, Tree } from '@/lib/family/types'

export function ShareMenu({
  tree,
  persons,
  relations,
  isOwner,
}: {
  tree: Tree
  persons: Person[]
  relations: Relation[]
  isOwner: boolean
}) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  const code = tree.shareCode ?? null
  const url =
    typeof window === 'undefined' || !code ? '' : `${window.location.origin}/share/${code}`

  const onCreate = async () => {
    if (!isOwner) return
    setBusy(true)
    try {
      await createShareLink(tree.id, tree.ownerId)
    } finally {
      setBusy(false)
    }
  }

  const onRotate = async () => {
    if (!isOwner) return
    if (!confirm('既存の共有リンクを無効化し、新しいリンクを発行します。続行しますか？')) return
    setBusy(true)
    try {
      await createShareLink(tree.id, tree.ownerId)
    } finally {
      setBusy(false)
    }
  }

  const onRevoke = async () => {
    if (!isOwner || !code) return
    if (!confirm('共有リンクを無効にします。続行しますか？')) return
    setBusy(true)
    try {
      await revokeShareLink(tree.id, code)
    } finally {
      setBusy(false)
    }
  }

  const onCopy = async () => {
    if (!url) return
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
      >
        共有 / PDF
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="共有と PDF 出力">
        <div className="space-y-5 text-sm">
          <section>
            <h3 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              公開リンク (読み取り専用)
            </h3>
            {code ? (
              <>
                <div className="mt-2 flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 p-2 text-xs dark:border-zinc-800 dark:bg-zinc-900">
                  <span className="flex-1 font-mono break-all">{url}</span>
                  <button
                    type="button"
                    onClick={onCopy}
                    className="rounded-md border border-zinc-300 px-2.5 py-1 hover:bg-white dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    {copied ? 'コピー済' : 'コピー'}
                  </button>
                </div>
                {isOwner && (
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onRotate}
                      disabled={busy}
                      className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs disabled:opacity-60 dark:border-zinc-700"
                    >
                      リンクを再発行
                    </button>
                    <button
                      type="button"
                      onClick={onRevoke}
                      disabled={busy}
                      className="rounded-md border border-red-300 px-2.5 py-1 text-xs text-red-600 disabled:opacity-60 dark:border-red-900/50"
                    >
                      共有を停止
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="mt-2">
                {isOwner ? (
                  <button
                    type="button"
                    onClick={onCreate}
                    disabled={busy}
                    className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
                  >
                    {busy ? '発行中…' : '公開リンクを発行'}
                  </button>
                ) : (
                  <p className="text-xs text-zinc-500">公開リンクの発行はオーナーのみです。</p>
                )}
              </div>
            )}
            <p className="mt-2 text-[11px] text-zinc-500">
              リンクを知っている人なら誰でも閲覧できます。編集はできません。
            </p>
          </section>

          <section>
            <h3 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">PDF 出力</h3>
            <p className="mt-1 text-xs text-zinc-500">
              新しいウィンドウで開き、ブラウザの印刷メニューから「PDFとして保存」できます。
            </p>
            <button
              type="button"
              onClick={() => exportTreeAsPdf(persons, relations, tree.name || '家系図')}
              className="mt-2 rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              印刷プレビューを開く
            </button>
          </section>
        </div>
      </Modal>
    </>
  )
}
