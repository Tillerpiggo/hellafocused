'use client'

import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

export type TabOption = {
  value: string
  label: string
  icon: LucideIcon
}

interface SidebarTabsProps {
  tabs: TabOption[]
  activeTab: string
  onTabChange: (value: string) => void
  isCollapsed?: boolean
  className?: string
}

export function SidebarTabs({ tabs, activeTab, onTabChange, isCollapsed = false, className }: SidebarTabsProps) {
  return (
    <div className={cn("flex flex-col space-y-1", className)}>
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.value
        
        return (
          <button
            key={tab.value}
            onClick={() => onTabChange(tab.value)}
            className={cn(
              "w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              "flex items-center gap-3",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              isCollapsed && "justify-center px-2"
            )}
          >
            <Icon className={cn("h-4 w-4 shrink-0", isCollapsed && "h-5 w-5")} />
            {!isCollapsed && <span className="truncate">{tab.label}</span>}
          </button>
        )
      })}
    </div>
  )
}