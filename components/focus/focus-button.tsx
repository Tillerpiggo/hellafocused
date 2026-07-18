import { Target } from "lucide-react"

export function FocusButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group fixed bottom-6 right-6 z-40 flex items-center gap-2 overflow-hidden rounded-full px-4 py-2.5 text-sm font-medium text-foreground glass-dropdown shadow-lg transition-colors hover:text-primary"
    >
      <span className="pointer-events-none absolute inset-0 bg-primary/0 transition-colors duration-200 group-hover:bg-primary/10" />
      <Target className="relative h-4 w-4" />
      <span className="relative">Focus</span>
    </button>
  )
}
