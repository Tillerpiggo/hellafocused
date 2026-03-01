'use client'

import { CompletionHeatmap } from "@/components/progress/heatmap/completion-heatmap"
import { FocusPointsBadge } from "@/components/progress/focus-points-badge"
import { TodaysProgressCard } from "@/components/progress/todays-progress-card"
import { ProgressChart } from "@/components/progress/progress-chart"
import { ProjectData } from "@/lib/types"
import { useCompletionData } from "@/hooks/use-completion-data"

interface ProgressViewProps {
  projects: ProjectData[]
}

export function ProgressView({ projects }: ProgressViewProps) {
  const { completionsByDate, totalPoints } = useCompletionData(projects)

  return (
    <div className="container max-w-4xl mx-auto py-10 px-6">
      <div className="space-y-10">
        <div>
          <h2 className="text-2xl font-semibold text-foreground tracking-tight">Progress</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Your completed work at a glance
          </p>
        </div>
        <TodaysProgressCard projects={projects} completionsByDate={completionsByDate} />
        <ProgressChart completionsByDate={completionsByDate} />
        <FocusPointsBadge totalPoints={totalPoints} />
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
            {totalPoints.toLocaleString()} tasks completed in the last year
          </h3>
          <CompletionHeatmap completions={completionsByDate} />
        </div>
      </div>
    </div>
  )
}
