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
    // CSS variable-based heatmap colors
    const colors = [
      { 
        lightBg: '#EBEDF0', darkBg: '#161B22',  // Level 0 (--hm-0)
      },
      { 
        lightBg: '#E9F1FD', darkBg: '#112441',  // Level 1 (--hm-1)
      },
      { 
        lightBg: '#C7DBFA', darkBg: '#133261',  // Level 2 (--hm-2)
      },
      { 
        lightBg: '#9ABEF6', darkBg: '#17458C',  // Level 3 (--hm-3)
      },
      { 
        lightBg: '#0047E1', darkBg: '#0060FF',  // Level 4 (more)
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