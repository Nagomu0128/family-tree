import type { Person } from './types'

/**
 * Normalize for incremental name search:
 * - NFKC (full-width <-> half-width)
 * - katakana -> hiragana so users typing either kana script match
 * - lowercase (for Romaji)
 */
export function normalizeForSearch(input: string): string {
  return input
    .normalize('NFKC')
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .toLowerCase()
    .trim()
}

export function personMatchesQuery(person: Person, normalizedQuery: string): boolean {
  if (!normalizedQuery) return true
  const haystacks = [
    normalizeForSearch(person.name),
    person.maidenName ? normalizeForSearch(person.maidenName) : '',
    person.reading ? normalizeForSearch(person.reading) : '',
  ]
  return haystacks.some((h) => h.includes(normalizedQuery))
}

export function rankSearchResults(persons: Person[], query: string, limit = 8): Person[] {
  const q = normalizeForSearch(query)
  if (!q) return []
  const scored: Array<{ p: Person; score: number }> = []
  for (const p of persons) {
    const fields = [
      normalizeForSearch(p.name),
      p.maidenName ? normalizeForSearch(p.maidenName) : '',
      p.reading ? normalizeForSearch(p.reading) : '',
    ]
    let best = -1
    for (const f of fields) {
      if (!f) continue
      const idx = f.indexOf(q)
      if (idx === -1) continue
      // Prefix matches score higher.
      const score = idx === 0 ? 100 - f.length : 50 - idx
      if (score > best) best = score
    }
    if (best > -1) scored.push({ p, score: best })
  }
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit).map((s) => s.p)
}
