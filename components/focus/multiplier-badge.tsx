'use client'

import { useEffect, useState } from 'react'
import type { MultiplierResult } from '@/lib/types'
import { cn } from '@/lib/utils'

interface MultiplierBadgeProps {
  result: MultiplierResult
  onDismiss: () => void
}

export function MultiplierBadge({ result, onDismiss }: MultiplierBadgeProps) {
  const [phase, setPhase] = useState<'enter' | 'visible' | 'exit'>('enter')
  const [visibleRows, setVisibleRows] = useState(0)

  useEffect(() => {
    requestAnimationFrame(() => setPhase('visible'))

    const rowTimers: ReturnType<typeof setTimeout>[] = []
    result.breakdown.forEach((_, i) => {
      rowTimers.push(setTimeout(() => setVisibleRows(i + 1), 100 + i * 80))
    })

    const exitTimer = setTimeout(() => {
      setPhase('exit')
      setTimeout(onDismiss, 400)
    }, 2200)

    return () => {
      rowTimers.forEach(clearTimeout)
      clearTimeout(exitTimer)
    }
  }, [result, onDismiss])

  return (
    <div
      className={cn(
        'fixed inset-0 z-[60] flex items-center justify-center pointer-events-none',
      )}
    >
      <div
        className={cn(
          'multiplier-badge rounded-2xl px-6 py-5 min-w-[220px] max-w-[280px]',
          'transition-all duration-400',
          phase === 'enter' && 'opacity-0 scale-[0.8]',
          phase === 'visible' && 'opacity-100 scale-100',
          phase === 'exit' && 'opacity-0 scale-[0.95] -translate-y-8',
        )}
      >
        <div className="space-y-2">
          {result.breakdown.map((item, i) => (
            <div
              key={`${item.source}-${i}`}
              className={cn(
                'flex items-center justify-between text-sm transition-all duration-200',
                i < visibleRows
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-2',
              )}
            >
              <span className="text-foreground/80 flex items-center gap-1.5">
                <span>{item.source === 'due-date-self' ? '🎯' : '📋'}</span>
                <span>{item.label}</span>
              </span>
              <span className="font-semibold text-foreground/90">
                ×{item.multiplier}
              </span>
            </div>
          ))}
        </div>

        {result.breakdown.length > 0 && (
          <>
            <div className="my-3 border-t border-foreground/10" />
            <div
              className={cn(
                'text-center transition-all duration-300 delay-100',
                visibleRows >= result.breakdown.length
                  ? 'opacity-100 scale-100'
                  : 'opacity-0 scale-90',
              )}
            >
              <span className="text-2xl font-bold text-multiplier">
                ×{result.total}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
