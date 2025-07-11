"use client"

import { ChevronRight, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { SearchResult } from "@/lib/search-utils"

interface SearchResultsProps {
  results: SearchResult[]
  currentProjectResults: SearchResult[]
  otherProjectResults: SearchResult[]
  onNavigateToResult: (result: SearchResult) => void
  className?: string
}

export function SearchResults({ 
  results, 
  currentProjectResults, 
  otherProjectResults, 
  onNavigateToResult,
  className 
}: SearchResultsProps) {
  if (results.length === 0) {
    return null
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Current Project Results */}
      {currentProjectResults.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Current Project
          </h3>
          <div className="space-y-1">
            {currentProjectResults.map((result, index) => (
              <SearchResultItem
                key={`current-${index}`}
                result={result}
                onClick={() => onNavigateToResult(result)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Other Projects Results */}
      {otherProjectResults.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Other Projects
          </h3>
          <div className="space-y-1">
            {otherProjectResults.map((result, index) => (
              <SearchResultItem
                key={`other-${index}`}
                result={result}
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
  onClick: () => void
}

function SearchResultItem({ result, onClick }: SearchResultItemProps) {
  return (
    <Button
      variant="ghost"
      className="w-full justify-between p-3 h-auto hover:bg-accent/60 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center min-w-0 flex-1">
        <div className="flex items-center gap-1 min-w-0 flex-1">
          <div className="flex items-center gap-1 min-w-0 flex-1 bg-muted/40 rounded-lg px-3 py-2">
            {result.breadcrumb.map((segment, index) => (
              <div key={index} className="flex items-center gap-1 min-w-0">
                <span 
                  className={cn(
                    "text-sm truncate",
                    index === result.breadcrumb.length - 1 
                      ? "font-medium text-foreground" 
                      : "text-muted-foreground"
                  )}
                >
                  {segment}
                </span>
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