"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle, Circle, Search, FileText, Paperclip, Calendar, Star } from "lucide-react"
import { cn } from "@/lib/utils"

export default function Mockup2Page() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  // Mock task data
  const mockTask = {
    name: "Design user onboarding flow",
    priority: 1, // preferred task
    subtasks: [
      { id: '1', name: "Research competitor onboarding patterns", completed: true },
      { id: '2', name: "Create user journey wireframes", completed: false },
      { id: '3', name: "Design welcome screen mockups", completed: false },
      { id: '4', name: "Test flow with 5 users", completed: false },
    ]
  }

  const features = [
    { id: 'search', icon: Search, label: 'Search', hasContent: false },
    { id: 'description', icon: FileText, label: 'Description', hasContent: true },
    { id: 'attachments', icon: Paperclip, label: 'Attachments', hasContent: false },
    { id: 'duedate', icon: Calendar, label: 'Due Date', hasContent: false },
  ]

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50/50 via-white to-rose-50/50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container max-w-4xl mx-auto py-12 px-6">
        
        {/* Header with Task Title and Feature Icons */}
        <div className="group mb-8">
          <div className="flex items-center justify-between">
            {/* Task Title */}
            <div className="flex items-center gap-4 flex-grow">
              {mockTask.priority === 1 && (
                <Star className="h-5 w-5 text-amber-500/60 fill-amber-500/60" />
              )}
              <h1 className={cn(
                "text-3xl font-light tracking-wide transition-colors duration-200",
                mockTask.priority === 1 
                  ? "text-amber-800/90 dark:text-amber-200/95" 
                  : "text-foreground"
              )}>
                {mockTask.name}
              </h1>
            </div>

            {/* Feature Icons - Always visible */}
            <div className="flex items-center gap-2">
              {features.map((feature) => {
                const Icon = feature.icon
                const isExpanded = expandedSection === feature.id
                
                return (
                  <Button
                    key={feature.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSection(feature.id)}
                    className={cn(
                      "relative h-9 w-9 rounded-xl transition-all",
                      "hover:bg-pink-100/50 dark:hover:bg-pink-900/20",
                      isExpanded && "bg-pink-100/60 dark:bg-pink-900/30"
                    )}
                    title={feature.label}
                  >
                    <Icon className="h-4 w-4" />
                    
                    {/* Content indicator */}
                    {feature.hasContent && (
                      <div className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full" />
                    )}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Subtle separator line */}
          <div className="mt-4 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* Expanded Feature Sections */}
        {expandedSection === 'search' && (
          <div className={cn(
            "mb-6 p-4 rounded-2xl glass-card border-white/30",
            "animate-in slide-in-from-top-2 duration-200"
          )}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search subtasks..."
                className="w-full pl-10 pr-4 py-2 bg-transparent border border-white/20 rounded-xl focus:border-primary/50 focus:outline-none"
              />
            </div>
          </div>
        )}

        {expandedSection === 'description' && (
          <div className={cn(
            "mb-6 p-4 rounded-2xl glass-card border-white/30",
            "animate-in slide-in-from-top-2 duration-200"
          )}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                <Button variant="ghost" size="sm" className="text-xs">
                  Edit
                </Button>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">
                Create a comprehensive user onboarding experience that guides new users through the key features of our application. Focus on reducing time-to-value and increasing user engagement in the first session.
              </p>
            </div>
          </div>
        )}

        {expandedSection === 'attachments' && (
          <div className={cn(
            "mb-6 p-4 rounded-2xl glass-card border-white/30",
            "animate-in slide-in-from-top-2 duration-200"
          )}>
            <div className="text-center py-8">
              <Paperclip className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No attachments yet</p>
              <Button variant="outline" size="sm" className="mt-2">
                Add Attachment
              </Button>
            </div>
          </div>
        )}

        {expandedSection === 'duedate' && (
          <div className={cn(
            "mb-6 p-4 rounded-2xl glass-card border-white/30",
            "animate-in slide-in-from-top-2 duration-200"
          )}>
            <div className="text-center py-8">
              <Calendar className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No due date set</p>
              <Button variant="outline" size="sm" className="mt-2">
                Set Due Date
              </Button>
            </div>
          </div>
        )}

        {/* Subtasks List - The main focus */}
        <div className="space-y-3">
          {mockTask.subtasks.map((subtask) => (
            <div
              key={subtask.id}
              className={cn(
                "flex items-start gap-4 p-4 rounded-2xl group glass-card",
                "bg-gradient-to-br transition-all duration-200",
                subtask.completed
                  ? "from-green-50/30 to-emerald-50/30 border-green-200/40 opacity-70"
                  : mockTask.priority === 1
                  ? "from-amber-50/40 to-pink-50/40 hover:from-amber-100/50 hover:to-pink-100/50 border-amber-200/50"
                  : "hover:from-pink-50/40 hover:to-rose-50/40 border-white/30",
                "cursor-pointer border shadow-lg hover:shadow-xl"
              )}
            >
              <div className="flex items-center min-h-[2rem] pt-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0 rounded-full"
                >
                  {subtask.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  )}
                </Button>
              </div>
              <div className="flex items-center min-h-[2rem] flex-grow min-w-0">
                <span className={cn(
                  "text-base font-medium break-words transition-colors",
                  subtask.completed && "line-through text-muted-foreground",
                  !subtask.completed && mockTask.priority === 1 && "text-amber-800/80 dark:text-amber-200/90"
                )}>
                  {subtask.name}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Add New Subtask */}
        <div className="mt-6 p-4 rounded-2xl glass-card border-white/30 border-dashed">
          <div className="flex items-center gap-4">
            <Circle className="h-5 w-5 text-muted-foreground/50" />
            <input
              type="text"
              placeholder="Add a subtask..."
              className="flex-grow bg-transparent border-none outline-none text-base placeholder-muted-foreground/70"
            />
          </div>
        </div>

        {/* Design Notes */}
        <div className="mt-12 p-6 rounded-2xl bg-muted/30 border">
          <h3 className="font-medium mb-3">Design Notes</h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• <strong>Always visible icons:</strong> Feature icons are always shown in header</li>
            <li>• <strong>Icon-only design:</strong> Clean square icon buttons with tooltips</li>
            <li>• <strong>Content indicators:</strong> Red dots show which features have content</li>
            <li>• <strong>Expandable sections:</strong> Click icons to reveal feature panels</li>
            <li>• <strong>Priority styling:</strong> Amber/gold theming for preferred tasks</li>
            <li>• <strong>Glass morphism:</strong> Maintains your existing visual language</li>
          </ul>
        </div>
      </div>
    </div>
  )
}