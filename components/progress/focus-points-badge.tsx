'use client'

import { useState } from 'react'
import Tilt from 'react-parallax-tilt'

interface FocusPointsBadgeProps {
  totalPoints: number
}

export function FocusPointsBadge({ totalPoints }: FocusPointsBadgeProps) {
  const [isClicked, setIsClicked] = useState(false)

  const formatNumber = (num: number): string => {
    return num.toLocaleString()
  }

  const handleClick = () => {
    setIsClicked(true)
    setTimeout(() => setIsClicked(false), 200)
  }

  return (
    <Tilt
      tiltMaxAngleX={5}
      tiltMaxAngleY={5}
      perspective={1200}
      scale={1.01}
      transitionSpeed={400}
      gyroscope={true}
    >
      <div
        className={`w-full flex items-center justify-center gap-3 px-6 py-6 rounded-xl border border-border/50 cursor-pointer select-none transition-all ${
          isClicked ? 'scale-[0.98] duration-75' : 'scale-100 duration-200'
        } ease-out`}
        onClick={handleClick}
      >
        <span className="text-4xl font-semibold text-foreground tabular-nums tracking-tight">
          {formatNumber(totalPoints)}
        </span>
        <span className="text-sm text-muted-foreground">
          focus points
        </span>
      </div>
    </Tilt>
  )
}
