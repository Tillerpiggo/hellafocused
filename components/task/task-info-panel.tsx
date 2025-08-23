"use client"

import { useState } from "react"
import { FileText, Link, Paperclip, Calendar, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface TaskInfoPanelProps {
  taskPath: string[]
  taskName: string
}

export function TaskInfoPanel({ taskPath, taskName }: TaskInfoPanelProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  
  // Generate fake description based on task name
  const generateFakeDescription = () => {
    const templates = [
      `This task involves working on ${taskName}. The goal is to complete all necessary steps to ensure high quality delivery. Consider breaking this down into smaller subtasks if needed.`,
      `${taskName} requires careful attention to detail. Make sure to review all requirements before starting. This task may have dependencies on other work items.`,
      `Complete ${taskName} by following the established workflow. Document any issues or blockers that arise during implementation.`,
      `The objective of ${taskName} is to deliver value to the end user. Focus on the core functionality first, then iterate on improvements.`,
      `Work on ${taskName} should align with the overall project goals. Collaborate with team members as needed to ensure successful completion.`,
    ]
    
    // Use task path length as a seed for consistent fake data per task
    const index = taskPath.reduce((acc, part) => acc + part.length, 0) % templates.length
    return templates[index]
  }
  
  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }
  
  const sections = [
    { 
      id: 'description', 
      icon: FileText, 
      label: 'Description',
      available: true,
      content: generateFakeDescription()
    },
    { 
      id: 'links', 
      icon: Link, 
      label: 'Links',
      available: false,
      content: null
    },
    { 
      id: 'attachments', 
      icon: Paperclip, 
      label: 'Attachments',
      available: false,
      content: null
    },
    { 
      id: 'duedate', 
      icon: Calendar, 
      label: 'Due Date',
      available: false,
      content: null
    },
  ]
  
  return (
    <div className="space-y-2">
      {/* Icon Bar */}
      <div className="flex items-center gap-2 p-2 rounded-2xl glass-card backdrop-blur-md">
        {sections.map((section) => {
          const Icon = section.icon
          const isExpanded = expandedSection === section.id
          
          return (
            <Button
              key={section.id}
              variant="ghost"
              size="sm"
              onClick={() => section.available && toggleSection(section.id)}
              disabled={!section.available}
              className={cn(
                "flex items-center gap-2 rounded-xl transition-all",
                section.available 
                  ? "hover:bg-pink-100/30 dark:hover:bg-pink-900/20" 
                  : "opacity-50 cursor-not-allowed",
                isExpanded && "bg-pink-100/40 dark:bg-pink-900/30"
              )}
              title={!section.available ? "Coming soon" : section.label}
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm hidden sm:inline">{section.label}</span>
              {section.available && (
                isExpanded ? (
                  <ChevronUp className="h-3 w-3 ml-1" />
                ) : (
                  <ChevronDown className="h-3 w-3 ml-1" />
                )
              )}
            </Button>
          )
        })}
      </div>
      
      {/* Expanded Content */}
      {expandedSection === 'description' && (
        <div className={cn(
          "p-4 rounded-2xl glass-card backdrop-blur-md",
          "animate-in slide-in-from-top-2 duration-200"
        )}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground"
                disabled
              >
                Edit
              </Button>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">
              {generateFakeDescription()}
            </p>
            <p className="text-xs text-muted-foreground italic">
              This is placeholder content. Description editing coming soon.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}