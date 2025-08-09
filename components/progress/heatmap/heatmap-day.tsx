'use client'

interface HeatmapDayProps {
  date: Date
  count: number
  onHover: (date: Date, count: number) => void
}

export function HeatmapDay({ date, count, onHover }: HeatmapDayProps) {
  const getIntensityLevel = (count: number): number => {
    if (count === 0) return 0
    if (count <= 2) return 1
    if (count <= 4) return 2
    if (count <= 6) return 3
    return 4
  }

  const getColorClass = (level: number): string => {
    const colors = [
      'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
      'bg-blue-100 dark:bg-blue-900 border-blue-200 dark:border-blue-800',
      'bg-blue-300 dark:bg-blue-700 border-blue-400 dark:border-blue-600',
      'bg-blue-500 dark:bg-blue-500 border-blue-600 dark:border-blue-400',
      'bg-blue-700 dark:bg-blue-300 border-blue-800 dark:border-blue-200'
    ]
    return colors[level] || colors[0]
  }

  const level = getIntensityLevel(count)

  return (
    <div
      className={`w-3 h-3 rounded-sm border cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-opacity-50 ${getColorClass(level)}`}
      onMouseEnter={() => onHover(date, count)}
      title={`${count} tasks completed`}
    />
  )
}