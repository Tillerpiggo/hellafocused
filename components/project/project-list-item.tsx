"use client"
import type { ProjectData } from "@/lib/types"
import { useAppStore } from "@/store/app-store"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProjectListItemProps {
  project: ProjectData
  isDragging?: boolean
}

export function ProjectListItem({ project, isDragging }: ProjectListItemProps) {
  const selectProject = useAppStore((state) => state.selectProject)

  return (
    <Card
      className={cn(
        "cursor-pointer shadow-none hover:shadow-md transition-all duration-300 hover:border-primary/30 border-border/50 rounded-2xl group bg-card",
        isDragging && "shadow-lg border-primary/50 bg-card/90"
      )}
      onClick={() => selectProject(project.id)}
    >
      <CardHeader className="p-6">
        <div className="flex justify-between items-center">
          <CardTitle className="text-foreground font-medium text-lg group-hover:text-primary transition-colors">
            {project.name}
          </CardTitle>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </CardHeader>
    </Card>
  )
}
