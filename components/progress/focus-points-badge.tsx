'use client'

import { useMemo, useState } from 'react'
import { ProjectData, TaskData } from '@/lib/types'
import Tilt from 'react-parallax-tilt'

interface FocusPointsBadgeProps {
  projects: ProjectData[]
}

export function FocusPointsBadge({ projects }: FocusPointsBadgeProps) {
  const [isClicked, setIsClicked] = useState(false)

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

  const handleClick = () => {
    setIsClicked(true)
    setTimeout(() => setIsClicked(false), 200)
  }

  return (
    <Tilt
      tiltMaxAngleX={8}
      tiltMaxAngleY={8}
      perspective={1000}
      scale={1.02}
      transitionSpeed={300}
      gyroscope={true}
    >
      <div 
        className={`w-full flex flex-col items-center px-6 py-8 bg-muted/30 rounded-xl border shadow-sm hover:shadow-lg cursor-pointer select-none transition-all ${
          isClicked ? 'scale-95 duration-75' : 'scale-100 duration-200'
        } ease-out`}
        onClick={handleClick}
      >
        <div className="text-5xl font-bold text-foreground tabular-nums drop-shadow-sm">
          {formatNumber(totalPoints)}
        </div>
        <div className="text-base text-muted-foreground mt-2 text-center">
          Focus Points
        </div>
      </div>
    </Tilt>
  )
}