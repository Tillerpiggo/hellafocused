'use client'

import { CompletionHeatmap } from "@/components/progress/heatmap/completion-heatmap"
import { FocusPointsBadge } from "@/components/progress/focus-points-badge"
import { TodaysProgressCard } from "@/components/progress/todays-progress-card"
import { ProgressChart } from "@/components/progress/progress-chart"
import { TaskData, ProjectData } from "@/lib/types"

interface ProgressViewProps {
  projects: ProjectData[]
}

export function ProgressView({ projects }: ProgressViewProps) {
  return (
    <div className="container max-w-4xl mx-auto py-12 px-6">
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">Progress Dashboard</h2>
          <p className="text-muted-foreground">
            Feel good about what you&apos;ve done so far
          </p>
        </div>
        <TodaysProgressCard projects={projects} />
        <ProgressChart projects={projects} />
        <FocusPointsBadge projects={projects} />
        <div>
          <h3 className="text-lg font-medium text-foreground mb-4">
            {(() => {
              let totalTasks = 0
              const countTask = (task: TaskData) => {
                if (task.completed && task.completionDate) {
                  totalTasks += 1
                }
                task.subtasks.forEach(countTask)
              }
              projects.forEach(project => {
                project.tasks.forEach(countTask)
              })
              return `${totalTasks.toLocaleString()} tasks completed in the last year`
            })()}
          </h3>
          <CompletionHeatmap projects={projects} />
        </div>
      </div>
    </div>
  )
}