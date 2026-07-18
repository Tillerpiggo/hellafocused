import { Loader2 } from "lucide-react"

export function AppLoadingState() {
  return (
    <main className="h-full flex items-center justify-center pt-14">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-app-spinner text-muted-foreground" />
        <div className="text-sm text-muted-foreground">Initializing...</div>
      </div>
    </main>
  )
}
