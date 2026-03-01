"use client"
import { DragDropContext, Droppable, type DropResult } from '@hello-pangea/dnd'
import type { ProjectData } from "@/lib/types"
import { SortableProjectItem } from "./sortable-project-item"
import { useAppStore } from "@/store/app-store"
import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

const DEFAULT_VISIBLE = 3

interface ProjectListViewProps {
  projects: ProjectData[]
}

export function ProjectListView({ projects }: ProjectListViewProps) {
  const reorderProjects = useAppStore((state) => state.reorderProjects)
  const [expanded, setExpanded] = useState(false)

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

  const baseProjects = sortedProjects.slice(0, DEFAULT_VISIBLE)
  const overflowProjects = sortedProjects.slice(DEFAULT_VISIBLE)
  const canExpand = sortedProjects.length > DEFAULT_VISIBLE
  const hiddenCount = sortedProjects.length - DEFAULT_VISIBLE

  return (
    <div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="project-list">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {baseProjects.map((project, index) => (
                <SortableProjectItem
                  key={project.id}
                  project={project}
                  index={index}
                />
              ))}
              {canExpand && (
                <div
                  className="grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
                  style={{
                    gridTemplateRows: expanded ? '1fr' : '0fr',
                    opacity: expanded ? 1 : 0,
                  }}
                >
                  <div className="overflow-hidden">
                    {overflowProjects.map((project, i) => (
                      <SortableProjectItem
                        key={project.id}
                        project={project}
                        index={DEFAULT_VISIBLE + i}
                      />
                    ))}
                  </div>
                </div>
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {canExpand && (
        <div className="mt-3 px-0.5">
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-full py-3.5 rounded-2xl text-sm font-medium
              bg-primary/[0.07] text-primary/70
              hover:bg-primary/[0.12] hover:text-primary/90
              active:bg-primary/[0.16]
              transition-all duration-300 ease-out
              flex items-center justify-center gap-2"
          >
            {expanded ? (
              <>
                Show less
                <ChevronUp className="h-3.5 w-3.5 opacity-50" />
              </>
            ) : (
              <>
                Show more
                <span className="text-primary/40 text-xs">({hiddenCount})</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-50" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
