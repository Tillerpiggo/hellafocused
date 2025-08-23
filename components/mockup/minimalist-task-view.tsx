"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  ChevronLeft, 
  Target, 
  Search, 
  FileText, 
  Paperclip, 
  MoreHorizontal,
  Circle,
  CheckCircle,
  Plus,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"

export function MinimalistTaskView() {
  const [activePanel, setActivePanel] = useState<'search' | 'description' | 'attachments' | null>(null)
  const [description, setDescription] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddSubtask, setShowAddSubtask] = useState(false)
  const [newSubtaskName, setNewSubtaskName] = useState("")
  
  const [subtasks, setSubtasks] = useState([
    { id: "1", name: "Research competitor features", completed: false },
    { id: "2", name: "Create wireframes", completed: false },
    { id: "3", name: "Get stakeholder feedback", completed: true },
    { id: "4", name: "Implement MVP", completed: false },
  ])

  const toggleSubtask = (id: string) => {
    setSubtasks(prev => prev.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ))
  }

  const addSubtask = () => {
    if (newSubtaskName.trim()) {
      setSubtasks(prev => [...prev, {
        id: Date.now().toString(),
        name: newSubtaskName,
        completed: false
      }])
      setNewSubtaskName("")
      setShowAddSubtask(false)
    }
  }

  const handleActionClick = (action: 'search' | 'description' | 'attachments') => {
    if (activePanel === action) {
      setActivePanel(null)
    } else {
      setActivePanel(action)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50/50 to-rose-50/50 dark:from-pink-950/20 dark:to-rose-950/20">
      <div className="container max-w-3xl mx-auto px-4 py-8">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Target className="h-5 w-5" />
          </Button>
        </div>

        {/* Main Task Title with Action Dots */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <h1 className="text-3xl font-light tracking-wide text-foreground">
              Launch new minimalist design system
            </h1>
            
            {/* Action Icons */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "rounded-full h-8 w-8 opacity-60 hover:opacity-100 transition-opacity",
                  activePanel === 'search' && "bg-pink-100 dark:bg-pink-900/30 opacity-100"
                )}
                onClick={() => handleActionClick('search')}
              >
                <Search className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "rounded-full h-8 w-8 opacity-60 hover:opacity-100 transition-opacity",
                  activePanel === 'description' && "bg-pink-100 dark:bg-pink-900/30 opacity-100"
                )}
                onClick={() => handleActionClick('description')}
              >
                <FileText className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "rounded-full h-8 w-8 opacity-60 hover:opacity-100 transition-opacity",
                  activePanel === 'attachments' && "bg-pink-100 dark:bg-pink-900/30 opacity-100"
                )}
                onClick={() => handleActionClick('attachments')}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-8 w-8 opacity-60 hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Expandable Panels */}
          <div className="mt-4 space-y-4">
            {/* Search Panel */}
            <div className={cn(
              "overflow-hidden transition-all duration-300",
              activePanel === 'search' ? "max-h-20 opacity-100" : "max-h-0 opacity-0"
            )}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search subtasks..."
                  className="pl-10 bg-white/50 dark:bg-gray-900/30 backdrop-blur-sm border-pink-200/30"
                />
              </div>
            </div>

            {/* Description Panel */}
            <div className={cn(
              "overflow-hidden transition-all duration-300",
              activePanel === 'description' ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
            )}>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description..."
                className="min-h-[120px] bg-white/50 dark:bg-gray-900/30 backdrop-blur-sm border-pink-200/30 resize-none"
              />
            </div>

            {/* Attachments Panel */}
            <div className={cn(
              "overflow-hidden transition-all duration-300",
              activePanel === 'attachments' ? "max-h-32 opacity-100" : "max-h-0 opacity-0"
            )}>
              <div className="bg-white/50 dark:bg-gray-900/30 backdrop-blur-sm rounded-lg p-4 border border-pink-200/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Attachments</span>
                  <Button variant="ghost" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add file
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground italic">
                  No attachments yet
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subtasks List */}
        <div className="space-y-2">
          {subtasks
            .filter(task => searchQuery === "" || task.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((subtask) => (
            <div
              key={subtask.id}
              className={cn(
                "flex items-center gap-4 p-4 rounded-2xl",
                "backdrop-blur-md bg-white/40 dark:bg-gray-900/20",
                "border border-white/30",
                "hover:bg-white/50 dark:hover:bg-gray-900/30",
                "transition-all duration-200 cursor-pointer",
                "group"
              )}
              onClick={() => toggleSubtask(subtask.id)}
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0 rounded-full"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleSubtask(subtask.id)
                }}
              >
                {subtask.completed ? (
                  <CheckCircle className="h-5 w-5 text-primary" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
              </Button>
              <span className={cn(
                "text-base",
                subtask.completed && "line-through text-muted-foreground"
              )}>
                {subtask.name}
              </span>
            </div>
          ))}

          {/* Add Subtask */}
          {showAddSubtask ? (
            <div className="flex items-center gap-2 p-4 rounded-2xl backdrop-blur-md bg-white/40 dark:bg-gray-900/20 border border-pink-300/50">
              <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <Input
                value={newSubtaskName}
                onChange={(e) => setNewSubtaskName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addSubtask()
                  if (e.key === 'Escape') {
                    setShowAddSubtask(false)
                    setNewSubtaskName("")
                  }
                }}
                placeholder="Type subtask name..."
                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full"
                onClick={() => {
                  setShowAddSubtask(false)
                  setNewSubtaskName("")
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddSubtask(true)}
              className={cn(
                "w-full text-left p-4 rounded-2xl",
                "backdrop-blur-md bg-white/20 dark:bg-gray-900/10",
                "border border-dashed border-pink-300/30",
                "hover:bg-white/30 dark:hover:bg-gray-900/20",
                "transition-all duration-200",
                "text-muted-foreground hover:text-foreground",
                "group"
              )}
            >
              <div className="flex items-center gap-4">
                <Plus className="h-5 w-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                <span className="opacity-70 group-hover:opacity-100 transition-opacity">
                  Add subtask...
                </span>
              </div>
            </button>
          )}
        </div>

        {/* Demo Info */}
        <div className="mt-16 p-4 rounded-lg bg-amber-100/50 dark:bg-amber-900/20 border border-amber-200/50">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Demo:</strong> This is a mockup of the minimalist task view. 
            The icons (search, description, attachments) are always visible but subtle. Click them to expand panels inline.
            The focus remains on the task title and subtasks, with features accessible but not intrusive.
          </p>
        </div>
      </div>
    </div>
  )
}