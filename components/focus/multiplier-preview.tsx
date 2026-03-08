'use client'

import type { MultiplierResult } from '@/lib/types'

interface MultiplierPreviewProps {
  result: MultiplierResult
}

export function MultiplierPreview({ result }: MultiplierPreviewProps) {
  if (result.total <= 1) return null

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-multiplier-bg text-multiplier border border-multiplier-glow/20">
      ×{result.total}
    </span>
  )
}
