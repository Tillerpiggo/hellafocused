import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface PageNavigationProps {
  backButtonText: string
  onBackClick: () => void
}

export function PageNavigation({
  backButtonText,
  onBackClick,
}: PageNavigationProps) {
  return (
    <div className="flex items-center justify-between">
      <Button
        variant="ghost"
        onClick={onBackClick}
        className="text-muted-foreground hover:text-foreground gap-2 py-2 h-auto font-normal rounded-lg max-w-[calc(100%-120px)] min-w-0"
      >
        <ArrowLeft className="h-4 w-4 flex-shrink-0" />
        <span className="truncate">{backButtonText}</span>
      </Button>
    </div>
  )
}
