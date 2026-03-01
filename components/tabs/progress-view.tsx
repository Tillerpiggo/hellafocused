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
    <div className="container max-w-4xl mx-auto py-10 px-6">
      <div className="space-y-10">
        <div>
          <h2 className="text-2xl font-semibold text-foreground tracking-tight">Progress</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Your completed work at a glance
          </p>
        </div>
        <TodaysProgressCard projects={projects} />
        <ProgressChart projects={projects} />
        <FocusPointsBadge projects={projects} />
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
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