'use client'

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getStraightPath,
  type EdgeProps,
} from '@xyflow/react'
import type { RelationEdgeData } from '@/lib/family/layout'
import type { ParentChildSubtype, SiblingSubtype, SpouseSubtype } from '@/lib/family/types'

const parentChildStyle: Record<ParentChildSubtype, { color: string; dash?: string }> = {
  biological: { color: '#52525b' },
  adoptive: { color: '#52525b', dash: '6 4' },
  step: { color: '#6366f1', dash: '2 3' },
  foster: { color: '#d97706', dash: '4 2 1 2' },
}

const spouseStyle: Record<SpouseSubtype, { color: string; dash?: string; glyph: string }> = {
  married: { color: '#a1a1aa', glyph: '⚭' },
  partnered: { color: '#a1a1aa', dash: '6 3', glyph: '⚯' },
  engaged: { color: '#a1a1aa', dash: '2 3', glyph: '💍' },
}

const siblingStyle: Record<SiblingSubtype, { color: string; dash?: string; glyph?: string }> = {
  full: { color: '#71717a' },
  half: { color: '#71717a', dash: '6 4' },
  step: { color: '#71717a', dash: '2 3' },
  twin: { color: '#71717a', glyph: '双' },
}

export function ParentChildEdge(props: EdgeProps) {
  const [path] = getBezierPath(props)
  const relation = (props.data as RelationEdgeData | undefined)?.relation
  const subtype = (relation?.subtype ?? 'biological') as ParentChildSubtype
  const style = parentChildStyle[subtype] ?? parentChildStyle.biological
  return (
    <BaseEdge
      id={props.id}
      path={path}
      style={{
        stroke: style.color,
        strokeWidth: 1.5,
        strokeDasharray: style.dash,
        fill: 'none',
      }}
    />
  )
}

export function SpouseEdge(props: EdgeProps) {
  const [path, labelX, labelY] = getStraightPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
  })
  const relation = (props.data as RelationEdgeData | undefined)?.relation
  const subtype = (relation?.subtype ?? 'married') as SpouseSubtype
  const style = spouseStyle[subtype] ?? spouseStyle.married
  return (
    <>
      <BaseEdge
        id={props.id}
        path={path}
        style={{
          stroke: style.color,
          strokeWidth: 2,
          strokeDasharray: style.dash,
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'none',
          }}
          className="rounded-full bg-zinc-200 px-1.5 py-0.5 text-[10px] text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
        >
          {style.glyph}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

export function SiblingEdge(props: EdgeProps) {
  const [path, labelX, labelY] = getStraightPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
  })
  const relation = (props.data as RelationEdgeData | undefined)?.relation
  const subtype = (relation?.subtype ?? 'full') as SiblingSubtype
  const style = siblingStyle[subtype] ?? siblingStyle.full
  return (
    <>
      <BaseEdge
        id={props.id}
        path={path}
        style={{
          stroke: style.color,
          strokeWidth: 1.5,
          strokeDasharray: style.dash,
        }}
      />
      {style.glyph && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'none',
            }}
            className="rounded bg-zinc-200 px-1 py-0.5 text-[10px] text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200"
          >
            {style.glyph}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
