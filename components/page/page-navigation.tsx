import { Button } from "@/components/ui/button"
import { ChevronLeft, Target } from "lucide-react"

interface PageNavigationProps {
  onBackClick: () => void
  isFocusMode: boolean
  onFocusClick: () => void
}

export function PageNavigation({
  onBackClick,
  isFocusMode,
  onFocusClick,
}: PageNavigationProps) {
  return (
    <div className="flex items-center justify-between">
      <Button
        variant="ghost"
        size="icon"
        onClick={onBackClick}
        className="rounded-full"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <Button
        variant={isFocusMode ? "secondary" : "outline"}
        size="sm"
        className="transition-all duration-200 hover:scale-105 flex-shrink-0"
        onClick={onFocusClick}
      >
        <Target className="h-4 w-4 mr-2" />
        Focus
      </Button>
    </div>
  )
} 