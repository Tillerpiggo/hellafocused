'use client'

interface HeatmapTooltipProps {
  date: string
  count: number
}

export function HeatmapTooltip({ date, count }: HeatmapTooltipProps) {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  const formatCount = (count: number): string => {
    if (count === 0) return 'No tasks completed'
    if (count === 1) return '1 task completed'
    return `${count} tasks completed`
  }

  return (
    <>
      <div className="font-medium">{formatCount(count)}</div>
      <div className="text-xs opacity-75">{formatDate(date)}</div>
    </>
  )
}