import { Button } from "@/components/ui/button"
import { ArrowLeft, Target } from "lucide-react"

interface PageNavigationProps {
  backButtonText: string
  onBackClick: () => void
  isFocusMode: boolean
  onFocusClick: () => void
}

export function PageNavigation({
  backButtonText,
  onBackClick,
  isFocusMode,
  onFocusClick,
}: PageNavigationProps) {
  return (
    <div className="flex items-center justify-between">
      <Button
        variant="ghost"
        onClick={onBackClick}
        className="text-muted-foreground hover:text-foreground px-0 py-3 h-auto font-normal -ml-2 pl-2 pr-4 rounded-lg"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        {backButtonText}
      </Button>
      <Button
        variant={isFocusMode ? "secondary" : "outline"}
        size="sm"
        className="transition-all duration-200 hover:scale-105"
        onClick={onFocusClick}
      >
        <Target className="h-4 w-4 mr-2" />
        Focus
      </Button>
    </div>
  )
} 