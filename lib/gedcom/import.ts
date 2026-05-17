import type { PersonInput, RelationInput } from '../family/schemas'
import type { Gender } from '../family/types'

export type ParsedPerson = PersonInput & { gedId: string }
export type ParsedRelation = Omit<RelationInput, 'fromId' | 'toId'> & {
  fromGedId: string
  toGedId: string
}

export type ParsedGedcom = {
  persons: ParsedPerson[]
  relations: ParsedRelation[]
  warnings: string[]
}

type Line = { level: number; tag: string; value: string; xref?: string }

function tokenize(input: string): Line[] {
  return input
    .split(/\r?\n/)
    .map((raw) => raw.trim())
    .filter(Boolean)
    .map<Line | null>((line) => {
      const m = line.match(/^(\d+)\s+(?:(@[^@]+@)\s+)?([A-Z0-9_]+)(?:\s+(.*))?$/)
      if (!m) return null
      const level = Number(m[1])
      const xref = m[2]
      const tag = m[3]
      const value = m[4] ?? ''
      return xref ? { level, tag, value, xref } : { level, tag, value }
    })
    .filter((l): l is Line => l !== null)
}

export function parseGedcom(input: string): ParsedGedcom {
  const lines = tokenize(input)
  const warnings: string[] = []

  type IndiRec = {
    xref: string
    name?: string
    maidenName?: string
    sex?: Gender
    birthYear?: number
    deathYear?: number
    notes: string[]
  }
  type FamRec = {
    xref: string
    husb?: string
    wife?: string
    marrYear?: number
    divYear?: number
    children: Array<{ xref: string; adopted: boolean }>
  }

  const indis = new Map<string, IndiRec>()
  const fams = new Map<string, FamRec>()

  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.level === 0 && line.xref && line.tag === 'INDI') {
      const rec: IndiRec = { xref: line.xref, notes: [] }
      i++
      while (i < lines.length && lines[i].level > 0) {
        const sub = lines[i]
        if (sub.level === 1 && sub.tag === 'NAME') {
          const parsed = parseName(sub.value)
          rec.name = parsed.given
          rec.maidenName = parsed.maiden
        } else if (sub.level === 1 && sub.tag === 'SEX') {
          rec.sex = sub.value === 'M' ? 'male' : sub.value === 'F' ? 'female' : 'unknown'
        } else if (sub.level === 1 && sub.tag === 'BIRT') {
          rec.birthYear = readDate(lines, i + 1)
        } else if (sub.level === 1 && sub.tag === 'DEAT') {
          rec.deathYear = readDate(lines, i + 1)
        } else if (sub.level === 1 && sub.tag === 'NOTE') {
          rec.notes.push(sub.value)
        }
        i++
      }
      indis.set(rec.xref, rec)
      continue
    }
    if (line.level === 0 && line.xref && line.tag === 'FAM') {
      const rec: FamRec = { xref: line.xref, children: [] }
      i++
      while (i < lines.length && lines[i].level > 0) {
        const sub = lines[i]
        if (sub.level === 1 && sub.tag === 'HUSB') rec.husb = sub.value.trim()
        else if (sub.level === 1 && sub.tag === 'WIFE') rec.wife = sub.value.trim()
        else if (sub.level === 1 && sub.tag === 'CHIL') {
          const childXref = sub.value.trim()
          let adopted = false
          const peek = lines[i + 1]
          if (peek && peek.level === 2 && peek.tag === 'PEDI' && /adopt/i.test(peek.value)) {
            adopted = true
          }
          rec.children.push({ xref: childXref, adopted })
        } else if (sub.level === 1 && sub.tag === 'MARR') {
          rec.marrYear = readDate(lines, i + 1)
        } else if (sub.level === 1 && sub.tag === 'DIV') {
          rec.divYear = readDate(lines, i + 1)
        }
        i++
      }
      fams.set(rec.xref, rec)
      continue
    }
    i++
  }

  const persons: ParsedPerson[] = []
  for (const rec of indis.values()) {
    if (!rec.name) {
      warnings.push(`${rec.xref}: 名前がないためスキップしました`)
      continue
    }
    persons.push({
      gedId: rec.xref,
      name: rec.name,
      maidenName: rec.maidenName,
      gender: rec.sex ?? 'unknown',
      birthYear: rec.birthYear,
      deathYear: rec.deathYear,
      memo: rec.notes.length > 0 ? rec.notes.join('\n') : undefined,
    })
  }

  const relations: ParsedRelation[] = []
  for (const fam of fams.values()) {
    const parents = [fam.husb, fam.wife].filter(Boolean) as string[]
    if (parents.length === 2) {
      relations.push({
        kind: 'spouse',
        fromGedId: parents[0],
        toGedId: parents[1],
        startedYear: fam.marrYear,
        endedYear: fam.divYear,
      })
    }
    for (const child of fam.children) {
      for (const parent of parents) {
        relations.push({
          kind: 'parent-child',
          fromGedId: parent,
          toGedId: child.xref,
          subtype: child.adopted ? 'adoptive' : 'biological',
        })
      }
    }
  }

  return { persons, relations, warnings }
}

function parseName(value: string): { given: string; maiden?: string } {
  // GEDCOM convention wraps surname in slashes: "Taro /Yamada/" or "山田 /太郎/".
  // We treat the slashed part as maiden name when set, otherwise everything as the display name.
  const m = value.match(/^(.*?)\/([^/]*)\/(.*)$/)
  if (!m) return { given: value.trim() }
  const before = m[1].trim()
  const slashed = m[2].trim()
  const after = m[3].trim()
  const display = [before, after].filter(Boolean).join(' ').trim() || slashed
  if (display === slashed) return { given: display }
  return { given: display, maiden: slashed || undefined }
}

function readDate(lines: Line[], start: number): number | undefined {
  for (let k = start; k < lines.length; k++) {
    const sub = lines[k]
    if (sub.level <= 1) break
    if (sub.tag === 'DATE') {
      const m = sub.value.match(/(\d{3,4})/)
      if (m) return Number(m[1])
    }
  }
  return undefined
}
