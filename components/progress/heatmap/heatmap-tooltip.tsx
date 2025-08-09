'use client'

interface HeatmapTooltipProps {
  date: string
  count: number
}

export function HeatmapTooltip({ date, count }: HeatmapTooltipProps) {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString + 'T00:00:00')
    const currentYear = new Date().getFullYear()
    const dateYear = date.getFullYear()
    const day = date.getDate()
    
    const getOrdinalSuffix = (day: number): string => {
      if (day > 3 && day < 21) return 'th'
      switch (day % 10) {
        case 1: return 'st'
        case 2: return 'nd'  
        case 3: return 'rd'
        default: return 'th'
      }
    }
    
    const month = date.toLocaleDateString('en-US', { month: 'short' })
    const year = dateYear !== currentYear ? `, ${dateYear}` : ''
    
    return `${month} ${day}${getOrdinalSuffix(day)}${year}`
  }

  const formatMessage = (count: number, date: string): string => {
    const formattedDate = formatDate(date)
    if (count === 0) return `No tasks completed on ${formattedDate}.`
    if (count === 1) return `1 task completed on ${formattedDate}.`
    return `${count} tasks completed on ${formattedDate}.`
  }

  return (
    <div className="font-medium">{formatMessage(count, date)}</div>
  )
}