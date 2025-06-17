import { ChevronRight } from "lucide-react"

interface ProjectsViewProps {
  projects: any[]
  onNavigateToProject: (projectId: string) => void
}

// Projects view component for displaying list of projects
export function ProjectsView({ 
  projects, 
  onNavigateToProject 
}: ProjectsViewProps) {
  return (
    <div className="space-y-2">
      {projects.map((project) => (
        <button
          key={project.id}
          className="w-full flex items-center p-3 rounded-lg hover:bg-accent/50 transition-colors text-left group"
          onClick={() => onNavigateToProject(project.id)}
        >
          <div className="flex items-center flex-1 min-w-0">
            <span className="font-medium">{project.name}</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>
      ))}
    </div>
  )
} 