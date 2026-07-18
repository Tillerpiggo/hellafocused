import { Target } from "lucide-react"

export function FocusButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-foreground glass-dropdown shadow-lg transition-colors hover:bg-foreground/5"
    >
      <Target className="h-4 w-4" />
      Focus
    </button>
  )
}
