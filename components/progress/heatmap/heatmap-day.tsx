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
    // GitHub's actual heatmap colors
    const colors = [
      { 
        lightBg: '#ebedf0', darkBg: '#161b22'  // Level 0 - Gray (no activity)
      },
      { 
        lightBg: '#9be9a8', darkBg: '#0e4429'  // Level 1 - Light green
      },
      { 
        lightBg: '#40c463', darkBg: '#006d32'  // Level 2 - Medium green
      },
      { 
        lightBg: '#30a14e', darkBg: '#26a641'  // Level 3 - Dark green
      },
      { 
        lightBg: '#216e39', darkBg: '#39d353'  // Level 4 - Darkest green
      }
    ]
    
    const colorIndex = Math.min(level, 4)
    const color = colors[colorIndex]
    
    return {
      backgroundColor: `light-dark(${color.lightBg}, ${color.darkBg})`
    }
  }

  const level = getIntensityLevel(count)

  return (
    <div
      className="w-3 h-3 rounded-sm cursor-pointer hover:ring-1 hover:ring-blue-300 hover:ring-opacity-30"
      style={getColorStyle(level)}
      data-date={date.toISOString().split('T')[0]}
      data-count={count}
    />
  )
}