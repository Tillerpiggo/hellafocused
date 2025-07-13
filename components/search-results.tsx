"use client"

import { ChevronRight, ArrowRight, CheckCircle, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { SearchResult } from "@/lib/search-utils"
import { highlightText } from "@/lib/search-utils"

interface SearchResultsProps {
  results: SearchResult[]
  currentProjectResults: SearchResult[]
  otherProjectResults: SearchResult[]
  onNavigateToResult: (result: SearchResult) => void
  currentPath: string[]
  isInProject: boolean
  query: string
  className?: string
}

interface HighlightedTextProps {
  text: string
  query: string
  className?: string
}

function HighlightedText({ text, query, className }: HighlightedTextProps) {
  const parts = highlightText(text, query)
  
  return (
    <span className={className}>
      {parts.map((part, index) => 
        typeof part === 'string' ? (
          <span key={index}>{part}</span>
        ) : (
          <span key={index} className="font-bold bg-yellow-100 dark:bg-yellow-900/40 px-1 py-0.5 rounded text-yellow-900 dark:text-yellow-100">
            {part.text}
          </span>
        )
      )}
    </span>
  )
}

export function SearchResults({ 
  results, 
  currentProjectResults, 
  otherProjectResults, 
  onNavigateToResult,
  currentPath,
  isInProject,
  query,
  className 
}: SearchResultsProps) {
  if (results.length === 0) {
    return null
  }

  // Separate direct children from other results in current project
  const directChildren: SearchResult[] = []
  const otherCurrentProjectResults: SearchResult[] = []
  
  currentProjectResults.forEach(result => {
    // Check if this result is a direct child of the current path
    const isDirectChild = result.path.length === currentPath.length + 1 && 
                         result.path.slice(0, currentPath.length).join('/') === currentPath.join('/')
    
    if (isDirectChild) {
      directChildren.push(result)
    } else {
      otherCurrentProjectResults.push(result)
    }
  })

    return (
    <div className={cn("space-y-4", className)}>
      {/* Current Location Results */}
      {(directChildren.length > 0 || otherCurrentProjectResults.length > 0) && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            In this {isInProject ? "project" : "task"}
          </h3>
          <div className="space-y-1">
            {/* Direct Children - shown as normal task items */}
            {directChildren.map((result, index) => (
              <SearchTaskItem
                key={`direct-${index}`}
                result={result}
                query={query}
                onClick={() => onNavigateToResult(result)}
              />
            ))}
            
            {/* Other Current Project Results - shown as breadcrumb items */}
            {otherCurrentProjectResults.map((result, index) => (
              <SearchResultItem
                key={`current-${index}`}
                result={result}
                query={query}
                onClick={() => onNavigateToResult(result)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Other Results */}
      {otherProjectResults.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Other Results
          </h3>
          <div className="space-y-1">
            {otherProjectResults.map((result, index) => (
              <SearchResultItem
                key={`other-${index}`}
                result={result}
                query={query}
                onClick={() => onNavigateToResult(result)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface SearchResultItemProps {
  result: SearchResult
  query: string
  onClick: () => void
}

interface SearchTaskItemProps {
  result: SearchResult
  query: string
  onClick: () => void
}

function SearchTaskItem({ result, query, onClick }: SearchTaskItemProps) {
  const { task } = result
  
  return (
    <div
      className={cn(
        "flex items-start justify-between p-4 my-2 rounded-2xl border transition-all duration-300 group cursor-pointer",
        task.completed
          ? "bg-muted/50 opacity-60 border-border/30"
          : "hover:bg-accent/80 hover:border-primary/30 border-border/50 bg-background"
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-4 flex-grow min-w-0">
        <div className="flex items-center min-h-[2rem] pt-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0 rounded-full pointer-events-none"
          >
            {task.completed ? (
              <CheckCircle className="h-5 w-5 text-primary" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            )}
          </Button>
        </div>
        <div className="flex items-center min-h-[2rem] flex-grow min-w-0">
          <HighlightedText
            text={task.name}
            query={query}
            className={cn(
              "text-base font-medium break-words", 
              task.completed && "line-through text-muted-foreground"
            )}
          />
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0 ml-2 min-h-[2rem]">
        <ArrowRight className="h-4 w-4 group-hover:text-primary transition-colors" />
      </div>
    </div>
  )
}

function SearchResultItem({ result, query, onClick }: SearchResultItemProps) {
  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-between p-3 h-auto hover:bg-accent/60 transition-colors",
        result.task.completed && "opacity-60"
      )}
      onClick={onClick}
    >
      <div className="flex items-center min-w-0 flex-1">
        <div className="flex items-center gap-1 min-w-0 flex-1">
          <div className="flex items-center gap-1 min-w-0 flex-1 bg-muted/40 rounded-lg px-3 py-2">
            {result.breadcrumb.map((segment, index) => (
              <div key={index} className="flex items-center gap-1 min-w-0">
                <HighlightedText
                  text={segment}
                  query={query}
                  className={cn(
                    "text-sm truncate",
                    index === result.breadcrumb.length - 1 
                      ? "font-medium text-foreground" 
                      : "text-muted-foreground",
                    // Apply strikethrough to the target task if it's completed
                    index === result.breadcrumb.length - 1 && result.task.completed && "line-through"
                  )}
                />
                {index < result.breadcrumb.length - 1 && (
                  <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground ml-2 flex-shrink-0" />
    </Button>
  )
} 