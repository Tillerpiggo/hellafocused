import { TaskData } from "@/lib/types"

interface BreadcrumbPathProps {
  projectName: string
  taskChain: TaskData[]
}

export function BreadcrumbPath({ projectName, taskChain }: BreadcrumbPathProps) {
  if (taskChain.length <= 1) {
    return null
  }

  return (
    <div className="text-sm text-muted-foreground font-light">
      <span>{projectName}</span>
      {taskChain.slice(0, -1).map((task) => (
        <span key={task.id}>
          {" / "}
          {task.name}
        </span>
      ))}
    </div>
  )
} 