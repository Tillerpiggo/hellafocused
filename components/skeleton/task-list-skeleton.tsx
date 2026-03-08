"use client"

const ROW_WIDTHS = [65, 45, 55, 70, 40]

function ShimmerBar({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={className}
      style={{
        background: "linear-gradient(90deg, hsl(var(--muted) / 0.3) 25%, hsl(var(--muted) / 0.5) 50%, hsl(var(--muted) / 0.3) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.8s ease-in-out infinite",
        ...style,
      }}
    />
  )
}

export function TaskListSkeleton() {
  return (
    <div className="space-y-2">
      {ROW_WIDTHS.map((width, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-4 rounded-2xl glass-card"
        >
          <div className="flex items-center gap-4 flex-grow">
            <ShimmerBar
              className="h-5 w-5 rounded-full flex-shrink-0"
              style={{ animationDelay: `${i * 80}ms` }}
            />
            <ShimmerBar
              className="h-4 rounded"
              style={{ width: `${width}%`, animationDelay: `${i * 80}ms` }}
            />
          </div>
          <ShimmerBar
            className="h-4 w-4 rounded ml-4 flex-shrink-0"
            style={{ animationDelay: `${i * 80}ms` }}
          />
        </div>
      ))}
    </div>
  )
}
