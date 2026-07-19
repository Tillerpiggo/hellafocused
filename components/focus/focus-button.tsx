export function FocusButton({
  onClick,
  label = "Focus",
  title,
}: {
  onClick: () => void
  label?: "Focus" | "Continue" | "Superfocus"
  title?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="group fixed bottom-6 right-6 z-[60] flex items-center gap-2.5 rounded-full py-2.5 pl-4 pr-[1.15rem] text-sm font-medium tracking-wide text-foreground/75 glass-dropdown outline-none transition-all duration-300 ease-out hover:-translate-y-0.5 hover:text-primary hover:shadow-[0_12px_32px_-6px_hsl(var(--primary)/0.35),0_4px_12px_rgba(0,0,0,0.08)] focus-visible:ring-2 focus-visible:ring-primary/40 active:translate-y-0 active:scale-[0.97] active:duration-150"
    >
      <span className="pointer-events-none absolute inset-0 rounded-full bg-primary/0 transition-colors duration-300 group-hover:bg-primary/5" />
      <span className="relative flex h-2 w-2">
        <span className="focus-dot-ripple absolute inset-0 rounded-full bg-primary" />
        <span className="relative h-2 w-2 rounded-full bg-primary/90 transition-colors duration-300 group-hover:bg-primary" />
      </span>
      <span className="relative">{label}</span>
    </button>
  )
}
