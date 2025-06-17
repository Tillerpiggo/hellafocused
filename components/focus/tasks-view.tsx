import { CheckSquare, Square, ChevronRight } from "lucide-react"
import type { TaskItemData } from "@/lib/types"

interface TasksViewProps {
  tasks: TaskItemData[]
  onNavigateToTask: (taskId: string) => void
}

// Tasks view component for displaying list of tasks/subtasks
export function TasksView({ 
  tasks, 
  onNavigateToTask 
}: TasksViewProps) {
  return (
    <div className="space-y-2">
      {tasks.length > 0 &&
        tasks.map((task) => (
          <button
            key={task.id}
            className="w-full flex items-center p-3 rounded-lg hover:bg-accent/50 transition-colors text-left group"
            onClick={() => onNavigateToTask(task.id)}
          >
            <div className="flex items-center flex-1 min-w-0">
              {task.completed ? (
                <CheckSquare className="h-5 w-5 mr-3 text-muted-foreground" />
              ) : (
                <Square className="h-5 w-5 mr-3 text-muted-foreground" />
              )}
              <span className={task.completed ? "line-through text-muted-foreground" : ""}>{task.name}</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
        ))}
    </div>
  )
} 