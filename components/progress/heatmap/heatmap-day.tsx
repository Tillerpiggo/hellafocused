'use client'

interface HeatmapDayProps {
  date: Date
  count: number
}

export function HeatmapDay({ date, count }: HeatmapDayProps) {
  const getIntensityLevel = (count: number): number => {
    if (count === 0) return 0
    if (count <= 2) return 1
    if (count <= 4) return 2
    if (count <= 6) return 3
    return 4
  }

  const getColorStyle = (level: number): React.CSSProperties => {
    // Custom blue theme with light and dark mode gradients
    const colors = [
      { 
        lightBg: '#ebf5ff', darkBg: '#0d2a4a',  // Level 0
      },
      { 
        lightBg: '#cce4ff', darkBg: '#1a5393',  // Level 1
      },
      { 
        lightBg: '#99c9ff', darkBg: '#287cd8',  // Level 2
      },
      { 
        lightBg: '#66adff', darkBg: '#36a5ff',  // Level 3
      },
      { 
        lightBg: '#3392ff', darkBg: '#45d1ff',  // Level 4
      }
    ]
    
    const colorIndex = Math.min(level, 4)
    const color = colors[colorIndex]
    
    return {
      backgroundColor: `light-dark(${color.lightBg}, ${color.darkBg})`,
      borderColor: `light-dark(${color.lightBg}, ${color.darkBg})`
    }
  }

  const level = getIntensityLevel(count)

  return (
    <div
      className="w-3 h-3 rounded-[2px] border cursor-pointer hover:ring-1 hover:ring-blue-300 hover:ring-opacity-30"
      style={getColorStyle(level)}
      data-date={date.toISOString().split('T')[0]}
      data-count={count}
    />
  )
}