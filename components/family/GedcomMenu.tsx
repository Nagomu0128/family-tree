'use client'

import { useRef, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { downloadAsFile, exportGedcom } from '@/lib/gedcom/export'
import { parseGedcom, type ParsedGedcom } from '@/lib/gedcom/import'
import { createPerson, newPersonId } from '@/lib/firestore/persons'
import { createRelation } from '@/lib/firestore/relations'
import type { Person, Relation } from '@/lib/family/types'

export function GedcomMenu({
  treeId,
  uid,
  treeName,
  persons,
  relations,
  canImport,
}: {
  treeId: string
  uid: string
  treeName: string
  persons: Person[]
  relations: Relation[]
  canImport: boolean
}) {
  const [open, setOpen] = useState(false)
  const [parsed, setParsed] = useState<ParsedGedcom | null>(null)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const onExport = () => {
    const ged = exportGedcom(persons, relations)
    const safeName = (treeName || 'family-tree').replace(/[^\w぀-ヿ一-龯-]+/g, '_')
    downloadAsFile(ged, `${safeName}.ged`, 'text/plain')
  }

  const onPickFile = () => fileRef.current?.click()

  const onFile = async (file: File) => {
    setError(null)
    try {
      const text = await file.text()
      const result = parseGedcom(text)
      setParsed(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ファイルを解析できませんでした')
    }
  }

  const doImport = async () => {
    if (!parsed) return
    setImporting(true)
    setError(null)
    try {
      const idMap = new Map<string, string>()
      for (const p of parsed.persons) {
        const id = newPersonId(treeId)
        idMap.set(p.gedId, id)
        await createPerson(
          treeId,
          uid,
          {
            name: p.name,
            maidenName: p.maidenName,
            gender: p.gender,
            birthYear: p.birthYear,
            deathYear: p.deathYear,
            memo: p.memo,
          },
          { id },
        )
      }
      for (const r of parsed.relations) {
        const fromId = idMap.get(r.fromGedId)
        const toId = idMap.get(r.toGedId)
        if (!fromId || !toId) continue
        if (r.kind === 'parent-child') {
          await createRelation(treeId, uid, {
            kind: 'parent-child',
            fromId,
            toId,
            subtype: r.subtype,
            startedYear: r.startedYear,
            endedYear: r.endedYear,
          })
        } else if (r.kind === 'spouse') {
          await createRelation(treeId, uid, {
            kind: 'spouse',
            fromId,
            toId,
            subtype: r.subtype,
            startedYear: r.startedYear,
            endedYear: r.endedYear,
          })
        } else {
          await createRelation(treeId, uid, {
            kind: 'sibling',
            fromId,
            toId,
            subtype: r.subtype,
            startedYear: r.startedYear,
            endedYear: r.endedYear,
          })
        }
      }
      setParsed(null)
      setOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'インポートに失敗しました')
    } finally {
      setImporting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
      >
        GEDCOM
      </button>
      <Modal
        open={open}
        onClose={() => {
          setOpen(false)
          setParsed(null)
          setError(null)
        }}
        title="GEDCOM 入出力"
      >
        <div className="space-y-5 text-sm">
          <section>
            <h3 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">エクスポート</h3>
            <p className="mt-1 text-xs text-zinc-500">
              現在のツリーを .ged ファイルとしてダウンロードします。
            </p>
            <button
              type="button"
              onClick={onExport}
              className="mt-2 rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              .ged をダウンロード
            </button>
          </section>

          {canImport && (
            <section>
              <h3 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">インポート</h3>
              <p className="mt-1 text-xs text-zinc-500">
                既存ツリーに人物と関係を追加します。重複検出は行いません。
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".ged,text/plain"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void onFile(file)
                  e.target.value = ''
                }}
              />
              {!parsed ? (
                <button
                  type="button"
                  onClick={onPickFile}
                  className="mt-2 rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  ファイルを選択
                </button>
              ) : (
                <div className="mt-2 rounded-md border border-zinc-200 p-3 text-xs dark:border-zinc-800">
                  <p>
                    人物 <b>{parsed.persons.length}</b> / 関係 <b>{parsed.relations.length}</b>{' '}
                    件を読み込みました。
                  </p>
                  {parsed.warnings.length > 0 && (
                    <ul className="mt-2 list-disc pl-5 text-amber-700 dark:text-amber-300">
                      {parsed.warnings.slice(0, 5).map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                      {parsed.warnings.length > 5 && <li>…他 {parsed.warnings.length - 5} 件</li>}
                    </ul>
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={doImport}
                      disabled={importing}
                      className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
                    >
                      {importing ? '取り込み中…' : 'インポートを確定'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setParsed(null)}
                      disabled={importing}
                      className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>
      </Modal>
    </>
  )
}
