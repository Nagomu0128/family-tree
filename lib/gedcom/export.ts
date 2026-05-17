import type { Person, Relation } from '../family/types'

/**
 * Serialize persons + relations to a GEDCOM 5.5.1 text. We emit a minimal
 * subset that other genealogy tools commonly accept (INDI / FAM only with
 * NAME / SEX / BIRT / DEAT / NOTE). Round-trips with our own parser.
 */
export function exportGedcom(persons: Person[], relations: Relation[]): string {
  const lines: string[] = []
  lines.push('0 HEAD')
  lines.push('1 SOUR FamilyTree')
  lines.push('2 NAME Family Tree')
  lines.push('1 GEDC')
  lines.push('2 VERS 5.5.1')
  lines.push('2 FORM LINEAGE-LINKED')
  lines.push('1 CHAR UTF-8')

  const indiId = (id: string) => `@I_${id}@`
  const famId = (idx: number) => `@F${idx}@`

  // ----- INDI records --------------------------------------------------------
  for (const p of persons) {
    lines.push(`0 ${indiId(p.id)} INDI`)
    lines.push(`1 NAME ${formatName(p.name, p.maidenName)}`)
    if (p.gender === 'male') lines.push('1 SEX M')
    else if (p.gender === 'female') lines.push('1 SEX F')
    else if (p.gender === 'other') lines.push('1 SEX U')
    if (p.birthYear !== undefined) {
      lines.push('1 BIRT')
      lines.push(`2 DATE ${p.birthYear}`)
    }
    if (p.deathYear !== undefined) {
      lines.push('1 DEAT')
      lines.push(`2 DATE ${p.deathYear}`)
    }
    if (p.reading) lines.push(`1 NOTE 読み: ${p.reading}`)
    if (p.memo) for (const line of p.memo.split('\n')) lines.push(`1 NOTE ${line}`)
  }

  // ----- FAM grouping --------------------------------------------------------
  const childParents = new Map<string, Set<string>>()
  const childSubtype = new Map<string, Map<string, 'biological' | 'adoptive'>>()
  for (const r of relations) {
    if (r.kind !== 'parent-child') continue
    const set = childParents.get(r.toId) ?? new Set<string>()
    set.add(r.fromId)
    childParents.set(r.toId, set)
    const m = childSubtype.get(r.toId) ?? new Map()
    m.set(r.fromId, r.subtype ?? 'biological')
    childSubtype.set(r.toId, m)
  }

  type Family = {
    id: number
    parents: string[]
    spouseStart?: number
    spouseEnd?: number
    children: string[]
  }
  const familyByKey = new Map<string, Family>()
  let famCounter = 1

  const familyKey = (parents: string[]) => [...parents].sort().join('+')

  for (const r of relations) {
    if (r.kind !== 'spouse') continue
    const key = familyKey([r.fromId, r.toId])
    if (!familyByKey.has(key)) {
      familyByKey.set(key, {
        id: famCounter++,
        parents: [r.fromId, r.toId],
        spouseStart: r.startedYear,
        spouseEnd: r.endedYear,
        children: [],
      })
    }
  }
  for (const [child, parents] of childParents) {
    const key = familyKey([...parents])
    if (!familyByKey.has(key)) {
      familyByKey.set(key, { id: famCounter++, parents: [...parents], children: [] })
    }
    familyByKey.get(key)!.children.push(child)
  }

  for (const fam of familyByKey.values()) {
    lines.push(`0 ${famId(fam.id)} FAM`)
    const [a, b] = fam.parents
    if (a) lines.push(`1 HUSB ${indiId(a)}`)
    if (b) lines.push(`1 WIFE ${indiId(b)}`)
    if (fam.spouseStart !== undefined) {
      lines.push('1 MARR')
      lines.push(`2 DATE ${fam.spouseStart}`)
    }
    if (fam.spouseEnd !== undefined) {
      lines.push('1 DIV')
      lines.push(`2 DATE ${fam.spouseEnd}`)
    }
    for (const child of fam.children) {
      lines.push(`1 CHIL ${indiId(child)}`)
      const sub = childSubtype.get(child)
      if (sub && [...sub.values()].some((v) => v === 'adoptive')) {
        lines.push('2 PEDI adopted')
      }
    }
  }

  lines.push('0 TRLR')
  return lines.join('\n')
}

function formatName(name: string, maidenName?: string): string {
  if (maidenName) return `${name} /${maidenName}/`
  return name
}

export function downloadAsFile(content: string, filename: string, mime = 'text/plain') {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
