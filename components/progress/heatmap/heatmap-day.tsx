'use client'

interface HeatmapDayProps {
  date: Date
  count: number
  level: number
}

export function HeatmapDay({ date, count, level }: HeatmapDayProps) {

  const getColorClass = (level: number): string => {
    const classes = [
      'bg-[#ebedf0] dark:bg-[#161b22]',  // Level 0 - Gray (no activity)
      'bg-[#9be9a8] dark:bg-[#0e4429]',  // Level 1 - Light green
      'bg-[#40c463] dark:bg-[#006d32]',  // Level 2 - Medium green
      'bg-[#30a14e] dark:bg-[#26a641]',  // Level 3 - Dark green
      'bg-[#216e39] dark:bg-[#39d353]',  // Level 4 - Darkest green
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