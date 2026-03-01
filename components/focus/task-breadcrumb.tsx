import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface BreadcrumbItem {
  id: string
  name: string
}

interface TaskBreadcrumbProps {
  items: BreadcrumbItem[]
  currentTaskName: string
  className?: string
  onItemClick?: (item: BreadcrumbItem) => void
}

export function TaskBreadcrumb({ 
  items, 
  currentTaskName, 
  className,
  onItemClick 
}: TaskBreadcrumbProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  
  // Don't truncate names - let them be full length for horizontal scroll
  const displayItems = items
  
  return (
    <div className={cn("relative group", className)}>
      {/* Breadcrumb container with horizontal scroll */}
      <div 
        id="breadcrumb-container"
        className="flex items-center gap-1 text-sm overflow-x-auto scrollbar-hide scroll-smooth pr-16"
      >
        {/* Home icon for project root */}
        {displayItems.length > 0 && (
          <div className="flex items-center">
            <button
              onClick={() => onItemClick?.(displayItems[0])}
              onMouseEnter={() => setHoveredIndex(0)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={cn(
                "group flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                "transition-all duration-300 ease-out",
                "hover:bg-white/10 dark:hover:bg-white/5",
                "relative overflow-hidden"
              )}
              disabled={displayItems[0].id === 'ellipsis'}
            >
              {/* Animated background glow on hover */}
              <div 
                className={cn(
                  "absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10",
                  "transition-all duration-500 ease-out",
                  hoveredIndex === 0 ? "opacity-100 scale-100" : "opacity-0 scale-95"
                )}
              />
              
              {/* Icon with smooth color transition */}
              <Home className={cn(
                "h-3.5 w-3.5 transition-all duration-300",
                hoveredIndex === 0 
                  ? "text-blue-600 dark:text-blue-400 scale-110" 
                  : "text-muted-foreground/60 scale-100"
              )} />
              
              {/* Text with smooth slide animation */}
              <span className={cn(
                "relative z-10 transition-all duration-300 whitespace-nowrap",
                "font-medium",
                hoveredIndex === 0
                  ? "text-blue-600 dark:text-blue-400 translate-x-0.5"
                  : "text-muted-foreground/80"
              )}>
                {displayItems[0].name}
              </span>
            </button>
            
            {/* Chevron separator with pulse animation on hover */}
            <ChevronRight className={cn(
              "h-3.5 w-3.5 mx-1 text-muted-foreground/40",
              "transition-all duration-300",
              hoveredIndex === 0 && "text-muted-foreground/60 scale-110"
            )} />
          </div>
        )}
        
        {/* Rest of the breadcrumb items */}
        {displayItems.slice(1).map((item, index) => {
          const actualIndex = index + 1
          
          return (
            <div key={item.id} className="flex items-center">
              <button
                onClick={() => onItemClick?.(item)}
                onMouseEnter={() => setHoveredIndex(actualIndex)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={cn(
                  "group px-3 py-1.5 rounded-full",
                  "transition-all duration-300 ease-out",
                  "hover:bg-white/10 dark:hover:bg-white/5",
                  "relative overflow-hidden"
                )}
              >
                {/* Animated background sweep on hover */}
                <div 
                  className={cn(
                    "absolute inset-0",
                    "bg-gradient-to-r from-transparent via-white/10 to-transparent dark:via-white/5",
                    "transition-all duration-500 ease-out",
                    "-translate-x-full",
                    hoveredIndex === actualIndex && "translate-x-0"
                  )}
                />
                
                {/* Text with color transition and slight scale */}
                <span className={cn(
                  "relative z-10 transition-all duration-300 whitespace-nowrap",
                  "font-medium",
                  hoveredIndex === actualIndex
                    ? "text-foreground scale-105"
                    : "text-muted-foreground/80 scale-100"
                )}>
                  {item.name}
                </span>
              </button>
              
              {/* Chevron separator */}
              {actualIndex < displayItems.length - 1 && (
                <ChevronRight className={cn(
                  "h-3.5 w-3.5 mx-1 text-muted-foreground/40",
                  "transition-all duration-300",
                  (hoveredIndex === actualIndex || hoveredIndex === actualIndex + 1) && 
                  "text-muted-foreground/60 scale-110"
                )} />
              )}
            </div>
          )
        })}
        
        {/* Current task (non-clickable) */}
        {displayItems.length > 0 && (
          <div className="flex items-center">
            <ChevronRight className={cn(
              "h-3.5 w-3.5 mx-1 text-muted-foreground/40",
              "transition-all duration-300",
              hoveredIndex === displayItems.length && "text-muted-foreground/60 scale-110"
            )} />
            <div 
              onMouseEnter={() => setHoveredIndex(displayItems.length)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={cn(
                "px-3 py-1.5 rounded-full",
                "bg-gradient-to-r from-currentTask-from/10 to-currentTask-to/10",
                "border border-currentTask-border/20 dark:border-currentTask-border/20",
                "transition-all duration-300",
                "relative overflow-hidden",
                hoveredIndex === displayItems.length && "scale-105 shadow-lg shadow-currentTask-shadow/10"
              )}
            >
              {/* Animated shimmer effect */}
              <div
                className={cn(
                  "absolute inset-0",
                  "bg-gradient-to-r from-transparent via-white/20 to-transparent",
                  "transition-all duration-1000 ease-out",
                  "-translate-x-full",
                  hoveredIndex === displayItems.length && "translate-x-full"
                )}
              />

              <span className={cn(
                "relative z-10 font-semibold whitespace-nowrap",
                "text-currentTask-text dark:text-currentTask-text",
                "transition-all duration-300"
              )}>
                {currentTaskName}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}