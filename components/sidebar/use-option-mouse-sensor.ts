"use client"

import { useEffect } from "react"
import type { FluidDragActions, PreDragActions, SensorAPI } from "@hello-pangea/dnd"

type Point = { x: number; y: number }
type Phase =
  | { type: "idle" }
  | { type: "pending"; point: Point; actions: PreDragActions }
  | { type: "dragging"; actions: FluidDragActions }

const idle: Phase = { type: "idle" }
const sloppyClickThreshold = 5
const listenerOptions: AddEventListenerOptions = { capture: true, passive: false }

function thresholdExceeded(origin: Point, current: Point) {
  return Math.abs(current.x - origin.x) >= sloppyClickThreshold ||
    Math.abs(current.y - origin.y) >= sloppyClickThreshold
}

/**
 * Matches @hello-pangea/dnd's mouse sensor, except Option/Alt is allowed to
 * initiate a drag so the session list can use it as a copy modifier.
 */
export function useOptionMouseSensor(api: SensorAPI) {
  useEffect(() => {
    let phase: Phase = idle

    const stop = () => {
      phase = idle
    }

    const cancel = () => {
      const current = phase
      stop()
      if (current.type === "dragging") {
        current.actions.cancel({ shouldBlockNextClick: true })
      } else if (current.type === "pending") {
        current.actions.abort()
      }
    }

    const handleMouseDown = (event: MouseEvent) => {
      if (phase.type !== "idle") {
        event.preventDefault()
        cancel()
        return
      }
      if (event.defaultPrevented || event.button !== 0) return

      // Preserve the default sensor's modifier blocking, except for Option/Alt.
      if (event.ctrlKey || event.metaKey || event.shiftKey) return

      const draggableId = api.findClosestDraggableId(event)
      if (!draggableId) return

      const actions = api.tryGetLock(draggableId, cancel, { sourceEvent: event })
      if (!actions) return

      event.preventDefault()
      phase = {
        type: "pending",
        point: { x: event.clientX, y: event.clientY },
        actions,
      }
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (phase.type === "idle") return

      const point = { x: event.clientX, y: event.clientY }
      if (phase.type === "dragging") {
        event.preventDefault()
        phase.actions.move(point)
        return
      }

      if (!thresholdExceeded(phase.point, point)) return

      event.preventDefault()
      phase = {
        type: "dragging",
        actions: phase.actions.fluidLift(point),
      }
    }

    const handleMouseUp = (event: MouseEvent) => {
      if (phase.type === "idle") return
      const current = phase
      stop()

      if (current.type === "dragging") {
        event.preventDefault()
        current.actions.drop({ shouldBlockNextClick: true })
      } else {
        current.actions.abort()
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (phase.type === "idle") return
      if (event.key === "Alt") return
      if (phase.type === "pending" || event.key === "Escape") {
        if (event.key === "Escape") event.preventDefault()
        cancel()
        return
      }
      if (event.key === "Enter" || event.key === "Tab") event.preventDefault()
    }

    const cancelPendingOnScroll = () => {
      if (phase.type === "pending") cancel()
    }

    window.addEventListener("mousedown", handleMouseDown, listenerOptions)
    window.addEventListener("mousemove", handleMouseMove, listenerOptions)
    window.addEventListener("mouseup", handleMouseUp, listenerOptions)
    window.addEventListener("keydown", handleKeyDown, listenerOptions)
    window.addEventListener("resize", cancel, listenerOptions)
    window.addEventListener("scroll", cancelPendingOnScroll, true)
    document.addEventListener("visibilitychange", cancel)

    return () => {
      window.removeEventListener("mousedown", handleMouseDown, listenerOptions)
      window.removeEventListener("mousemove", handleMouseMove, listenerOptions)
      window.removeEventListener("mouseup", handleMouseUp, listenerOptions)
      window.removeEventListener("keydown", handleKeyDown, listenerOptions)
      window.removeEventListener("resize", cancel, listenerOptions)
      window.removeEventListener("scroll", cancelPendingOnScroll, true)
      document.removeEventListener("visibilitychange", cancel)
      cancel()
    }
  }, [api])
}
