"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Target } from "lucide-react"
import { useAppStore } from "@/store/app-store"

export function TopBar() {
  const selectProject = useAppStore((state) => state.selectProject)
  const enterFocusMode = useAppStore((state) => state.enterFocusMode)
  const isFocusMode = useAppStore((state) => state.isFocusMode)
  const exitFocusMode = useAppStore((state) => state.exitFocusMode)

  const handleHomeClick = () => {
    selectProject(null) // Go to project list view
  }

  const handleFocusClick = () => {
    if (isFocusMode) {
      exitFocusMode()
    } else {
      enterFocusMode() // Store handles logic if project not selected
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4">
        {/* Left side - empty for balance */}
        <div className="w-24"></div>

        {/* Centered Title */}
        <Link href="/" onClick={handleHomeClick} className="text-lg font-medium text-primary tracking-wide">
          hellafocused
        </Link>

        {/* Right side - Focus Button */}
        <div className="w-24 flex justify-end">
          <Button
            variant={isFocusMode ? "secondary" : "outline"}
            size="sm"
            className="transition-all duration-200 hover:scale-105"
            onClick={handleFocusClick}
          >
            <Target className="h-4 w-4 mr-2" />
            {isFocusMode ? "Exit" : "Focus"}
          </Button>
        </div>
      </div>
    </header>
  )
}
