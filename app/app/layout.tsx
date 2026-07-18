import type React from "react"
import { AppInitializationShell } from "@/components/app-initialization-shell"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppInitializationShell>{children}</AppInitializationShell>
}
