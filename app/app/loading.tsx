import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <main className="h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <div className="text-sm text-muted-foreground">Initializing...</div>
      </div>
    </main>
  )
}
