"use client"
import { DragDropContext, Droppable, type DropResult } from '@hello-pangea/dnd'
import type { ProjectData } from "@/lib/types"
import { SortableProjectItem } from "./sortable-project-item"
import { useAppStore } from "@/store/app-store"

interface ProjectListViewProps {
  projects: ProjectData[]
}

export function ProjectListView({ projects }: ProjectListViewProps) {
  const reorderProjects = useAppStore((state) => state.reorderProjects)

  function handleDragEnd(result: DropResult) {
    if (!result.destination) {
      return
    }

    const sourceIndex = result.source.index
    const destinationIndex = result.destination.index

    if (sourceIndex !== destinationIndex) {
      reorderProjects(sourceIndex, destinationIndex)
    }
  }

  // Sort projects by position for display
  const sortedProjects = projects
    .slice()
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="project-list">
        {(provided) => (
          <div 
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="space-y-3"
          >
            {sortedProjects.map((project, index) => (
              <SortableProjectItem
                key={project.id}
                project={project}
                index={index}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}