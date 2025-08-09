'use client'

import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SidebarTabs, type TabOption } from './sidebar-tabs'
import { cn } from '@/lib/utils'

interface SidebarLayoutProps {
  tabs: TabOption[]
  activeTab: string
  onTabChange: (value: string) => void
  children: React.ReactNode
  className?: string
}

export function SidebarLayout({ tabs, activeTab, onTabChange, children, className }: SidebarLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // Check if mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile && isSidebarOpen) {
        const sidebar = document.getElementById('sidebar')
        if (sidebar && !sidebar.contains(event.target as Node)) {
          setIsSidebarOpen(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMobile, isSidebarOpen])


  return (
    <div className={cn("flex min-h-screen", className)}>
      {/* Mobile hamburger button */}
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="fixed top-16 left-4 z-50 md:hidden bg-background/80 backdrop-blur-sm shadow-sm"
        >
          {isSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      )}

      {/* Sidebar backdrop for mobile */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        id="sidebar"
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
        className={cn(
          "bg-background border-r border-border transition-all duration-200 ease-out overflow-hidden",
          // Desktop: collapsed by default, expanded on hover
          !isMobile && "hidden md:block",
          !isMobile && !isHovered && "w-16",
          !isMobile && isHovered && "w-64",
          // Mobile: overlay when open
          isMobile && "fixed top-0 left-0 h-full z-50 shadow-lg w-64",
          isMobile && isSidebarOpen && "block",
          isMobile && !isSidebarOpen && "hidden"
        )}
      >
        {/* Mobile close button */}
        {isMobile && (
          <div className="flex justify-end mb-4 p-4 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Tab navigation */}
        <div className={cn("pt-6", !isMobile && !isHovered ? "px-2" : "px-6")}>
          <SidebarTabs 
            tabs={tabs}
            activeTab={activeTab}
            isCollapsed={!isMobile && !isHovered}
            onTabChange={(value) => {
              onTabChange(value)
              // Close mobile sidebar when tab is selected
              if (isMobile) {
                setIsSidebarOpen(false)
              }
            }}
          />
        </div>
      </aside>

      {/* Main content */}
      <main className={cn(
        "flex-1 transition-all duration-200 ease-out",
        // Adjust main content margin based on sidebar state
        !isMobile && !isHovered && "ml-0",
        !isMobile && isHovered && "ml-0",
        // Add left padding on mobile when hamburger button is visible
        isMobile && "pl-12"
      )}>
        {children}
      </main>
    </div>
  )
}