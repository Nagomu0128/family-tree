'use client'

import { useCallback, useRef, useState } from 'react'

export type HistoryEntry = {
  id: string
  label: string
  undoneAt?: number
  createdAt: number
}

export type Command = {
  label: string
  do: () => Promise<void>
  undo: () => Promise<void>
}

export type HistoryState = {
  past: HistoryEntry[]
  future: HistoryEntry[]
  busy: boolean
}

const MAX_STACK = 50

export function useHistory() {
  // Closures live in a ref so command lookups survive re-renders.
  const cmds = useRef<Map<string, Command>>(new Map())
  const [state, setState] = useState<HistoryState>({ past: [], future: [], busy: false })

  const push = useCallback(async (command: Command) => {
    setState((s) => ({ ...s, busy: true }))
    try {
      await command.do()
      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        label: command.label,
        createdAt: Date.now(),
      }
      cmds.current.set(entry.id, command)
      setState((s) => {
        const past = [...s.past, entry].slice(-MAX_STACK)
        // Pushing a new command clears the redo branch.
        for (const f of s.future) cmds.current.delete(f.id)
        return { past, future: [], busy: false }
      })
    } catch (err) {
      setState((s) => ({ ...s, busy: false }))
      throw err
    }
  }, [])

  const undo = useCallback(async () => {
    const top = state.past.at(-1)
    if (!top) return
    const cmd = cmds.current.get(top.id)
    if (!cmd) return
    setState((s) => ({ ...s, busy: true }))
    try {
      await cmd.undo()
      setState((s) => ({
        past: s.past.slice(0, -1),
        future: [{ ...top, undoneAt: Date.now() }, ...s.future].slice(0, MAX_STACK),
        busy: false,
      }))
    } catch (err) {
      setState((s) => ({ ...s, busy: false }))
      throw err
    }
  }, [state.past])

  const redo = useCallback(async () => {
    const top = state.future[0]
    if (!top) return
    const cmd = cmds.current.get(top.id)
    if (!cmd) return
    setState((s) => ({ ...s, busy: true }))
    try {
      await cmd.do()
      setState((s) => ({
        past: [...s.past, { ...top, undoneAt: undefined }].slice(-MAX_STACK),
        future: s.future.slice(1),
        busy: false,
      }))
    } catch (err) {
      setState((s) => ({ ...s, busy: false }))
      throw err
    }
  }, [state.future])

  const reset = useCallback(() => {
    cmds.current.clear()
    setState({ past: [], future: [], busy: false })
  }, [])

  return {
    state,
    push,
    undo,
    redo,
    reset,
    canUndo: state.past.length > 0 && !state.busy,
    canRedo: state.future.length > 0 && !state.busy,
  }
}
