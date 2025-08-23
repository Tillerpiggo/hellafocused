'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { X, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FeedbackPopup } from '@/components/ui/feedback-popup'
import { SidebarTabs, type TabOption } from './sidebar-tabs'
import { cn } from '@/lib/utils'

interface SidebarLayoutProps {
  tabs: TabOption[]
  activeTab: string
  onTabChange: (value: string) => void
  children: React.ReactNode
  className?: string
  isSidebarOpen?: boolean
  setIsSidebarOpen?: (open: boolean) => void
}

export function SidebarLayout({ 
  tabs, 
  activeTab, 
  onTabChange, 
  children, 
  className,
  isSidebarOpen: propIsSidebarOpen,
  setIsSidebarOpen: propSetIsSidebarOpen
}: SidebarLayoutProps) {
  const [localIsSidebarOpen, setLocalIsSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
  const feedbackButtonRef = useRef<HTMLButtonElement>(null)

  // Use props if provided, otherwise use local state
  const isSidebarOpen = propIsSidebarOpen ?? localIsSidebarOpen
  const setIsSidebarOpen = propSetIsSidebarOpen ?? setLocalIsSidebarOpen

  // Check if mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640) // sm breakpoint - actual mobile screens
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
    <div className={cn("flex h-screen", className)}>

      {/* Sidebar backdrop for mobile */}
      {isMobile && (
        <div 
          className={cn(
            "fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ease-in-out",
            isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside
          id="desktop-sidebar"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={cn(
            "glass-morphism border-r border-white/20 overflow-hidden",
            "fixed top-14 left-0 bottom-0 z-40",
            "transition-[width] duration-300 ease-in-out",
            isHovered ? "w-64" : "w-16"
          )}
        >
          <div className="pt-2 px-2">
            <SidebarTabs 
              tabs={tabs}
              activeTab={activeTab}
              isCollapsed={!isHovered}
              onTabChange={onTabChange}
            />
          </div>
        </aside>
      )}

      {/* Mobile Sidebar */}
      {isMobile && (
        <aside
          id="mobile-sidebar"
          className={cn(
            "glass-mobile-sidebar border-r border-white/20 overflow-hidden",
            "fixed top-0 left-0 h-full z-50 shadow-2xl w-64",
            "transition-transform duration-300 ease-in-out",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Mobile header with logo and close button */}
          <div className="flex justify-between items-center px-4 py-3">
            <Link href="/?from=app" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              hellafocused
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Tab navigation */}
          <div className="px-2">
            <SidebarTabs 
              tabs={tabs}
              activeTab={activeTab}
              isCollapsed={false}
              onTabChange={(value) => {
                onTabChange(value)
                setIsSidebarOpen(false)
              }}
            />
          </div>

          {/* Mobile-only Feedback and Discord section */}
          <div className="px-4 py-4 border-t border-border mt-4">
            <div className="flex flex-col space-y-3">
              <button 
                ref={feedbackButtonRef}
                onClick={() => setIsFeedbackOpen(!isFeedbackOpen)}
                className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Share Feedback</span>
              </button>
              <Link 
                href="https://discord.gg/UQYybzN3Ac" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.445.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                <span>Join Discord</span>
              </Link>
            </div>
          </div>
        </aside>
      )}

      <FeedbackPopup
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        buttonRef={feedbackButtonRef}
      />

      {/* Main content */}
      <main className={cn(
        "flex-1 min-w-0 transition-all duration-200 ease-out overflow-y-auto",
        // Desktop: account for fixed top bar and sidebar
        !isMobile && "pt-14",
        !isMobile && "ml-16",
        // Mobile: account for fixed single-tier top bar (h-14)
        isMobile && "pt-14"
      )}>
        {children}
      </main>
    </div>
  )
}