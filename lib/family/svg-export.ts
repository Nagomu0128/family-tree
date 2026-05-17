import { buildLayout, NODE_HEIGHT, NODE_WIDTH } from './layout'
import type { Person, Relation } from './types'

const PADDING = 40

export function buildSvg(persons: Person[], relations: Relation[], title: string): string {
  const { nodes, edges } = buildLayout(persons, relations)
  if (nodes.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="200"><text x="20" y="40" font-family="sans-serif" font-size="16">${escapeXml(title)} (人物なし)</text></svg>`
  }

  const xs = nodes.map((n) => n.position.x)
  const ys = nodes.map((n) => n.position.y)
  const minX = Math.min(...xs) - PADDING
  const minY = Math.min(...ys) - PADDING
  const maxX = Math.max(...xs) + NODE_WIDTH + PADDING
  const maxY = Math.max(...ys) + NODE_HEIGHT + PADDING + 30 // extra for title
  const width = maxX - minX
  const height = maxY - minY

  const nodeById = new Map(nodes.map((n) => [n.id, n]))

  const edgeSvg = edges
    .map((e) => {
      const a = nodeById.get(e.source)
      const b = nodeById.get(e.target)
      if (!a || !b) return ''
      const ax = a.position.x + NODE_WIDTH / 2
      const bx = b.position.x + NODE_WIDTH / 2
      if (e.type === 'spouse') {
        const ay = a.position.y + NODE_HEIGHT / 2
        const by = b.position.y + NODE_HEIGHT / 2
        return `<line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" stroke="#a1a1aa" stroke-width="2" />`
      }
      const ay = a.position.y + NODE_HEIGHT
      const by = b.position.y
      const midY = (ay + by) / 2
      const dash = e.type === 'adoptive' ? 'stroke-dasharray="6 4"' : ''
      return `<path d="M ${ax} ${ay} C ${ax} ${midY}, ${bx} ${midY}, ${bx} ${by}" stroke="#52525b" stroke-width="1.5" fill="none" ${dash} />`
    })
    .join('\n')

  const personFill: Record<Person['gender'], string> = {
    male: '#e0f2fe',
    female: '#fce7f3',
    other: '#ede9fe',
    unknown: '#ffffff',
  }
  const personStroke: Record<Person['gender'], string> = {
    male: '#7dd3fc',
    female: '#f9a8d4',
    other: '#c4b5fd',
    unknown: '#d4d4d8',
  }

  const nodeSvg = nodes
    .map((n) => {
      const p = n.data.person
      const x = n.position.x
      const y = n.position.y
      const fill = personFill[p.gender] ?? personFill.unknown
      const stroke = personStroke[p.gender] ?? personStroke.unknown
      const life = lifeText(p)
      return `<g>
        <rect x="${x}" y="${y}" width="${NODE_WIDTH}" height="${NODE_HEIGHT}" rx="10" fill="${fill}" stroke="${stroke}" stroke-width="2" />
        <text x="${x + 12}" y="${y + 28}" font-family="'Helvetica','Arial',sans-serif" font-size="14" font-weight="600">${escapeXml(truncate(p.name, 16))}</text>
        ${p.maidenName ? `<text x="${x + 12}" y="${y + 46}" font-family="'Helvetica','Arial',sans-serif" font-size="10" fill="#71717a">旧姓 ${escapeXml(truncate(p.maidenName, 16))}</text>` : ''}
        ${life ? `<text x="${x + 12}" y="${y + (p.maidenName ? 62 : 48)}" font-family="'Helvetica','Arial',sans-serif" font-size="10" fill="#52525b">${escapeXml(life)}</text>` : ''}
      </g>`
    })
    .join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${width} ${height}" width="${width}" height="${height}">
    <rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="#ffffff" />
    <text x="${minX + 20}" y="${minY + 28}" font-family="'Helvetica','Arial',sans-serif" font-size="18" font-weight="700">${escapeXml(title)}</text>
    ${edgeSvg}
    ${nodeSvg}
  </svg>`
}

function lifeText(p: Person): string {
  if (p.birthYear === undefined && p.deathYear === undefined) return ''
  return `${p.birthYear ?? '?'}–${p.deathYear ?? ''}`
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Open the generated SVG in a new window and trigger the browser print dialog.
 * Users can choose "Save as PDF" from there. Zero dependencies vs jsPDF/etc.
 */
export function exportTreeAsPdf(persons: Person[], relations: Relation[], title: string) {
  const svg = buildSvg(persons, relations, title)
  const html = `<!doctype html><html><head><title>${escapeXml(title)}</title>
    <style>
      html, body { margin: 0; padding: 0; }
      @page { size: auto; margin: 8mm; }
      .print-only { display: none; }
      @media print { .print-only { display: block; } .screen-only { display: none; } }
    </style>
    </head><body>
    <div class="screen-only" style="padding:16px;font-family:sans-serif;font-size:13px;color:#52525b;">
      ブラウザの印刷メニューから「PDFとして保存」を選んで保存してください。<br>
      <button onclick="window.print()" style="margin-top:8px;padding:6px 12px;border:1px solid #d4d4d8;border-radius:6px;background:#fff;cursor:pointer;">印刷ダイアログを開く</button>
    </div>
    ${svg}
    </body></html>`
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const w = window.open(url, '_blank')
  if (w) {
    w.addEventListener('beforeunload', () => URL.revokeObjectURL(url))
  } else {
    URL.revokeObjectURL(url)
    alert('ポップアップがブロックされました。ブラウザ設定で許可してください。')
  }
}
