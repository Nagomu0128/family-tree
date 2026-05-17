'use client'

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getStraightPath,
  type EdgeProps,
} from '@xyflow/react'

export function ParentChildEdge(props: EdgeProps) {
  const [path] = getBezierPath(props)
  return <BaseEdge id={props.id} path={path} style={{ stroke: '#52525b', strokeWidth: 1.5 }} />
}

export function AdoptiveEdge(props: EdgeProps) {
  const [path] = getBezierPath(props)
  return (
    <BaseEdge
      id={props.id}
      path={path}
      style={{ stroke: '#52525b', strokeWidth: 1.5, strokeDasharray: '6 4' }}
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
  return (
    <>
      <BaseEdge id={props.id} path={path} style={{ stroke: '#d4d4d8', strokeWidth: 2 }} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'none',
          }}
          className="rounded-full bg-zinc-200 px-1.5 py-0.5 text-[9px] text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
        >
          ⚭
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
