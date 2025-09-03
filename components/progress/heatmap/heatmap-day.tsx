'use client'

interface HeatmapDayProps {
  date: Date
  count: number
  level: number
}

export function HeatmapDay({ date, count, level }: HeatmapDayProps) {

  const getColorClass = (level: number): string => {
    const classes = [
      'bg-heatmap-0',  // Level 0 - Gray (no activity)
      'bg-heatmap-1',  // Level 1
      'bg-heatmap-2',  // Level 2
      'bg-heatmap-3',  // Level 3
      'bg-heatmap-4',  // Level 4
    ]
    
    const colorIndex = Math.min(level, 4)
    return classes[colorIndex]
  }


  return (
    <div
      className={`w-3 h-3 rounded-sm cursor-pointer hover:ring-1 hover:ring-blue-300 hover:ring-opacity-30 ${getColorClass(level)}`}
      data-date={date.toISOString().split('T')[0]}
      data-count={count}
    />
  )
}