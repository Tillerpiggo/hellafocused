"use client"

import { useState } from "react"
import { FileText, Link, Paperclip, Calendar, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface TaskInfoPanelProps {
  taskPath: string[]
  taskName: string
}

export function TaskInfoPanel({ taskPath, taskName }: TaskInfoPanelProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  
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
    if (isAnimating) return
    
    if (expandedSection === section) {
      setIsAnimating(true)
      setTimeout(() => {
        setExpandedSection(null)
        setIsAnimating(false)
      }, 800)
    } else {
      setExpandedSection(section)
    }
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
      <div className="flex items-center gap-2 p-2 rounded-2xl glass-card">
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
                "flex items-center gap-2 rounded-xl transition-all duration-1000 ease-in-out",
                section.available 
                  ? "hover:bg-taskNormal-from/30 dark:hover:bg-taskNormal-from/20" 
                  : "opacity-50 cursor-not-allowed",
                isExpanded && "bg-taskNormal-from/40 dark:bg-taskNormal-from/30"
              )}
              title={!section.available ? "Coming soon" : section.label}
            >
              <Icon className="h-4 w-4 transition-all duration-1000 ease-in-out" />
              <span className="text-sm hidden sm:inline">{section.label}</span>
              {section.available && (
                <div className="ml-1 transition-transform duration-1000 ease-in-out" style={{
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                }}>
                  <ChevronDown className="h-3 w-3" />
                </div>
              )}
            </Button>
          )
        })}
      </div>
      
      {/* Expanded Content */}
      {(expandedSection === 'description' || (isAnimating && !expandedSection)) && (
        <div 
          className="p-4 rounded-2xl glass-card overflow-hidden"
          style={{
            animation: expandedSection 
              ? 'gracefulSlideDown 1.2s cubic-bezier(0.25, 0.1, 0.25, 1) forwards'
              : 'gracefulSlideUp 0.8s cubic-bezier(0.25, 0.1, 0.25, 1) forwards',
            transformOrigin: 'top'
          }}
        >
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