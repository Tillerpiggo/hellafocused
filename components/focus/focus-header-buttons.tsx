import { Button } from "@/components/ui/button"
import { X, Plus } from "lucide-react"

interface FocusHeaderButtonsProps {
  onExitFocus: () => void
  onShowAddTasks: () => void
}

export function FocusHeaderButtons({ onExitFocus, onShowAddTasks }: FocusHeaderButtonsProps) {
  return (
    <>
      {/* Exit button in top left */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-6 left-6 h-10 w-10 rounded-full opacity-50 hover:opacity-100 transition-opacity z-10"
        onClick={onExitFocus}
      >
        <X className="h-5 w-5" />
        <span className="sr-only">Exit focus mode</span>
      </Button>

      {/* Add tasks button in top right */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-6 right-6 h-10 w-10 rounded-full opacity-50 hover:opacity-100 transition-opacity z-10"
        onClick={onShowAddTasks}
      >
        <Plus className="h-5 w-5" />
        <span className="sr-only">Add tasks</span>
      </Button>
    </>
  )
} 