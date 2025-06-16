"use client"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff } from "lucide-react"
import { useAppStore } from "@/store/app-store"

export function ShowCompletedToggle() {
  const showCompleted = useAppStore((state) => state.showCompleted)
  const toggleShowCompleted = useAppStore((state) => state.toggleShowCompleted)

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleShowCompleted}
      className="text-muted-foreground hover:text-foreground"
    >
      {showCompleted ? (
        <>
          <EyeOff className="h-4 w-4 mr-1" />
          Hide Completed
        </>
      ) : (
        <>
          <Eye className="h-4 w-4 mr-1" />
          Show Completed
        </>
      )}
    </Button>
  )
}
