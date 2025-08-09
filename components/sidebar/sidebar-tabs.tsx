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
              "h-12 text-left text-sm font-medium rounded-lg transition-all duration-150 ease-out overflow-hidden",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              "flex items-center pl-4 pr-4",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              isCollapsed ? "w-12" : "w-full"
            )}
          >
            <Icon className="h-4 w-4 shrink-0 mr-3" />
            <span className={cn(
              "whitespace-nowrap transition-opacity duration-100 ease-out",
              isCollapsed ? "opacity-0" : "opacity-100"
            )}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}