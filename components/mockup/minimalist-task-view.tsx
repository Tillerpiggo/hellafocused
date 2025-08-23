"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  ChevronLeft,
  ChevronRight,
  Target, 
  Search, 
  Edit2,
  Calendar,
  CalendarDays,
  MoreHorizontal,
  Circle,
  CheckCircle,
  Plus,
  X,
  Paperclip,
  File,
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"

export function MinimalistTaskView() {
  const [activePanel, setActivePanel] = useState<'search' | 'details' | 'duedate' | null>(null)
  const [description, setDescription] = useState("Design a cohesive and minimal interface that emphasizes clarity and reduces cognitive load for users.")
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddSubtask, setShowAddSubtask] = useState(false)
  const [newSubtaskName, setNewSubtaskName] = useState("")
  const [selectedDate] = useState<Date | null>(new Date('2024-02-15'))
  const [attachments] = useState([
    { id: '1', name: 'wireframes.fig', type: 'design', size: '2.4 MB' },
    { id: '2', name: 'user-research.pdf', type: 'document', size: '1.1 MB' }
  ])
  
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

  const formatDueDate = (date: Date) => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const isToday = date.toDateString() === today.toDateString()
    const isTomorrow = date.toDateString() === tomorrow.toDateString()
    const daysUntil = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (isToday) return "Due today"
    if (isTomorrow) return "Due tomorrow"
    if (daysUntil > 0 && daysUntil <= 7) return `Due in ${daysUntil} days`
    if (daysUntil < 0) return `Overdue by ${Math.abs(daysUntil)} days`
    
    return `Due ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  }

  const getDueDateColor = (date: Date) => {
    const today = new Date()
    const daysUntil = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntil < 0) return "text-red-600 dark:text-red-400"
    if (daysUntil === 0) return "text-amber-600 dark:text-amber-400"
    if (daysUntil <= 3) return "text-orange-600 dark:text-orange-400"
    return "text-muted-foreground"
  }

  const handleActionClick = (action: 'search' | 'details' | 'duedate') => {
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
        <div className="mb-6">
          <div className="flex items-start justify-between mb-3">
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
                  activePanel === 'details' && "bg-pink-100 dark:bg-pink-900/30 opacity-100"
                )}
                onClick={() => handleActionClick('details')}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "rounded-full h-8 w-8 opacity-60 hover:opacity-100 transition-opacity",
                  activePanel === 'duedate' && "bg-pink-100 dark:bg-pink-900/30 opacity-100"
                )}
                onClick={() => handleActionClick('duedate')}
              >
                <Calendar className="h-4 w-4" />
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
          
          {/* Description Preview - shows when details panel is closed */}
          {activePanel !== 'details' && description && (
            <p className="text-sm text-muted-foreground line-clamp-2 cursor-pointer hover:text-foreground transition-colors mb-2"
               onClick={() => handleActionClick('details')}>
              {description}
            </p>
          )}
          
          {/* Attachment Pills - show when details panel is closed */}
          {activePanel !== 'details' && attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {attachments.map((file) => (
                <button
                  key={file.id}
                  onClick={() => handleActionClick('details')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm border border-white/40 hover:bg-white/40 dark:hover:bg-gray-800/40 transition-colors group"
                >
                  <Paperclip className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                    {file.name}
                  </span>
                </button>
              ))}
            </div>
          )}
          
          {/* Due Date Preview - shows when neither details nor due date panels are open */}
          {activePanel !== 'duedate' && activePanel !== 'details' && selectedDate && (
            <div 
              className={cn(
                "flex items-center gap-2 text-sm cursor-pointer transition-colors",
                getDueDateColor(selectedDate)
              )}
              onClick={() => handleActionClick('duedate')}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              <span>{formatDueDate(selectedDate)}</span>
            </div>
          )}

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

            {/* Details Panel (Description + Attachments) */}
            <div className={cn(
              "overflow-hidden transition-all duration-300",
              activePanel === 'details' ? "opacity-100" : "max-h-0 opacity-0"
            )}>
              <div className="bg-gradient-to-br from-white/40 to-white/20 dark:from-gray-900/40 dark:to-gray-900/20 backdrop-blur-md rounded-2xl p-6 border border-white/30 space-y-6">
                {/* Description Section */}
                <div>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a description..."
                    className="w-full bg-transparent border-0 p-0 resize-none focus:ring-0 focus:outline-none text-foreground placeholder:text-muted-foreground/50"
                    style={{ minHeight: '80px' }}
                  />
                </div>
                
                {/* Attachments Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Attachments</span>
                    <Button variant="ghost" size="sm" className="h-6 text-xs opacity-60 hover:opacity-100">
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>
                  
                  {attachments.length > 0 ? (
                    <div className="space-y-2">
                      {attachments.map((file) => (
                        <div key={file.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/20 dark:hover:bg-gray-800/20 transition-colors group">
                          <div className="flex-shrink-0">
                            {file.type === 'design' ? (
                              <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                <File className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                              </div>
                            ) : (
                              <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-grow min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{file.size}</p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-60 transition-opacity">
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 border-2 border-dashed border-muted-foreground/20 rounded-xl">
                      <Paperclip className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground/50">No attachments yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Due Date Panel - Calendar View */}
            <div className={cn(
              "overflow-hidden transition-all duration-300",
              activePanel === 'duedate' ? "opacity-100" : "max-h-0 opacity-0"
            )}>
              <div className="bg-gradient-to-br from-white/40 to-white/20 dark:from-gray-900/40 dark:to-gray-900/20 backdrop-blur-md rounded-2xl p-4 border border-white/30">
                {/* Mini Calendar */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">February 2024</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <ChevronLeft className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1 text-xs">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                      <div key={i} className="text-center text-muted-foreground font-medium py-1">
                        {day}
                      </div>
                    ))}
                    {/* Sample calendar days */}
                    {Array.from({ length: 35 }, (_, i) => {
                      const day = i - 3; // Start from Thursday (Feb 1)
                      const isCurrentMonth = day >= 1 && day <= 29;
                      const isSelected = day === 15;
                      const isToday = day === 10;
                      
                      return (
                        <button
                          key={i}
                          className={cn(
                            "aspect-square rounded-lg flex items-center justify-center transition-colors",
                            !isCurrentMonth && "text-muted-foreground/30",
                            isCurrentMonth && "hover:bg-white/30 dark:hover:bg-gray-800/30",
                            isSelected && "bg-pink-500/30 text-pink-700 dark:text-pink-300 font-medium",
                            isToday && !isSelected && "bg-muted/30 font-medium"
                          )}
                        >
                          {isCurrentMonth ? day : (day < 1 ? 29 + day : day - 29)}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Quick Options */}
                  <div className="flex gap-2 pt-2 border-t border-white/20">
                    <Button variant="ghost" size="sm" className="h-7 text-xs flex-1">Today</Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs flex-1">Tomorrow</Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs flex-1">Next Week</Button>
                  </div>
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
            <strong>Demo:</strong> Minimalist task view with focus on title and subtasks.
            • Description shows as preview text, click pencil icon to edit
            • Due date displays with smart formatting and color coding
            • Calendar widget for date selection with quick options
            • Beautiful attachment cards with file type indicators
          </p>
        </div>
      </div>
    </div>
  )
}