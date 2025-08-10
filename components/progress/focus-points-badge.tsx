'use client'

import { useMemo } from 'react'
import { ProjectData, TaskData } from '@/lib/types'

interface FocusPointsBadgeProps {
  projects: ProjectData[]
}

export function FocusPointsBadge({ projects }: FocusPointsBadgeProps) {
  const totalPoints = useMemo(() => {
    let count = 0

    const countTask = (task: TaskData) => {
      if (task.completed && task.completionDate) {
        count += 1
      }
      task.subtasks.forEach(countTask)
    }

    projects.forEach(project => {
      project.tasks.forEach(countTask)
    })

    return count
  }, [projects])

  const formatNumber = (num: number): string => {
    return num.toLocaleString()
  }

  return (
    <div 
      className="w-full flex flex-col items-center px-6 py-8 bg-muted/30 rounded-xl border shadow-sm transition-all duration-300 ease-out hover:shadow-lg cursor-default group"
      style={{ perspective: '1000px' }}
    >
      <div 
        className="transition-transform duration-300 ease-out"
        style={{
          transformStyle: 'preserve-3d',
          transform: 'rotateY(0deg) rotateX(0deg)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'rotateY(6deg) rotateX(2deg)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'rotateY(0deg) rotateX(0deg)'
        }}
      >
        <div className="text-5xl font-bold text-foreground tabular-nums drop-shadow-sm">
          {formatNumber(totalPoints)}
        </div>
        <div className="text-base text-muted-foreground mt-2 text-center">
          Focus Points
        </div>
      </div>
    </div>
  )
}