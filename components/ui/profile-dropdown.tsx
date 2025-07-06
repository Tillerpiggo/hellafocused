import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { User, LogOut, Sun, Moon, Monitor, ArrowRight, Target } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { useUIStore } from '@/store/ui-store'
import { supabase, getBaseUrl } from '@/lib/supabase'
import { syncEngine } from '@/lib/sync-engine'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface ProfileDropdownProps {
  user: SupabaseUser
  showBackToApp?: boolean
  showFocusButton?: boolean
}

export function ProfileDropdown({ user, showBackToApp = false, showFocusButton = false }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const { isFocusMode, setFocusMode } = useUIStore()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      // Clear local state before signing out
      syncEngine.clearAllLocalState()
      
      await supabase.auth.signOut()
      
      // Redirect to the appropriate base URL
      window.location.href = getBaseUrl()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleBackToApp = () => {
    router.push('/app')
  }

  const handleFocusMode = () => {
    setFocusMode(!isFocusMode)
  }

  // Generate first letter from email
  const getInitial = (email: string) => {
    return email.charAt(0).toUpperCase()
  }

  // Get truncated email for display
  const getTruncatedEmail = (email: string) => {
    if (email.length <= 20) return email
    return email.substring(0, 17) + '...'
  }

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ]

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative h-8 rounded-full p-0 flex items-center gap-2 hover:bg-muted/50"
        >
          <div className="h-8 w-8 rounded-full bg-muted border flex items-center justify-center text-sm font-medium flex-shrink-0">
            {user.email ? getInitial(user.email) : <User className="h-4 w-4" />}
          </div>
          <span className="text-sm text-muted-foreground hidden sm:inline-block animate-email-swipe-in">
            {user.email ? getTruncatedEmail(user.email) : 'Signed in'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex items-center space-x-2 p-2">
          <div className="h-8 w-8 rounded-full bg-muted border flex items-center justify-center text-sm font-medium flex-shrink-0">
            {user.email ? getInitial(user.email) : <User className="h-4 w-4" />}
          </div>
          <div className="flex flex-col space-y-1 min-w-0">
            <p className="text-sm font-medium leading-none truncate">
              {user.email || 'Signed in'}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator />
        {showBackToApp && (
          <>
            <DropdownMenuItem onClick={handleBackToApp} className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/85 hover:text-primary-foreground focus:bg-primary/85 focus:text-primary-foreground">
              <span>Go to app</span>
              <ArrowRight className="ml-auto h-4 w-4" />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {showFocusButton && (
          <>
            <DropdownMenuItem onClick={handleFocusMode} className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/85 hover:text-primary-foreground focus:bg-primary/85 focus:text-primary-foreground">
              <Target className="mr-2 h-4 w-4" />
              <span>{isFocusMode ? 'Exit focus' : 'Focus'}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {themeOptions.map((option) => {
          const Icon = option.icon
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setTheme(option.value)}
              className="cursor-pointer"
            >
              <Icon className="mr-2 h-4 w-4" />
              <span>{option.label}</span>
              {theme === option.value && (
                <span className="ml-auto text-xs text-muted-foreground">✓</span>
              )}
            </DropdownMenuItem>
          )
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 