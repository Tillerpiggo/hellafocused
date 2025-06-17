export function NoTasksAvailableView() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
      <div className="w-24 h-24 mb-8 rounded-full bg-muted/50 flex items-center justify-center">
        <div className="w-3 h-3 bg-muted-foreground/30 rounded-full"></div>
      </div>
      <h2 className="text-2xl sm:text-3xl font-light mb-4 text-muted-foreground">Peaceful moment</h2>
      <p className="text-muted-foreground text-base sm:text-lg max-w-md leading-relaxed">
        No tasks await your attention right now. Rest in this quiet space.
      </p>
    </div>
  )
} 