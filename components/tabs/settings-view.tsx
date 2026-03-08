'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor, Check } from 'lucide-react'
import { builtInThemes } from '@/lib/theme-system/themes'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'

const COLOR_THEME_KEY = 'color-theme'

function useColorTheme() {
  const [colorTheme, setColorTheme] = useState('pink-zen')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem(COLOR_THEME_KEY)
    if (stored) {
      setColorTheme(stored)
    } else {
      const current = document.documentElement.getAttribute('data-theme')
      if (current) setColorTheme(current)
    }
  }, [])

  const applyColorTheme = (themeId: string) => {
    setColorTheme(themeId)
    document.documentElement.setAttribute('data-theme', themeId)
    localStorage.setItem(COLOR_THEME_KEY, themeId)
  }

  return { colorTheme, applyColorTheme, mounted }
}

function ThemeModeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) {
    return <div className="h-10 rounded-lg bg-secondary/50 animate-pulse" />
  }

  const options = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ]

  return (
    <div className="flex rounded-lg bg-secondary/60 p-1 gap-1">
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
            theme === value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          )}
        >
          <Icon className="h-4 w-4" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  )
}

interface ThemePreviewCardProps {
  theme: typeof builtInThemes[number]
  isActive: boolean
  onClick: () => void
}

function ThemePreviewCard({ theme, isActive, onClick }: ThemePreviewCardProps) {
  const lightColors = theme.colors.light
  const darkColors = theme.colors.dark

  const toHSL = (c: { h: number; s: number; l: number }) => `hsl(${c.h}, ${c.s}%, ${c.l}%)`

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative rounded-xl border p-3 transition-all duration-200 text-left w-full",
        "hover:scale-[1.01] active:scale-[0.99]",
        isActive
          ? "border-primary shadow-sm ring-1 ring-primary/15"
          : "border-border/60 hover:border-primary/40 hover:shadow-sm"
      )}
    >
      {isActive && (
        <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
          <Check className="h-3 w-3 text-primary-foreground" />
        </div>
      )}

      {/* Mini UI mockup */}
      <div className="flex gap-2 mb-3">
        {/* Light mode preview */}
        <div
          className="flex-1 rounded-lg overflow-hidden border"
          style={{
            backgroundColor: toHSL(lightColors.background),
            borderColor: toHSL(lightColors.border),
          }}
        >
          <div className="flex h-20">
            {/* Sidebar stripe */}
            <div
              className="w-5 shrink-0"
              style={{ backgroundColor: toHSL(lightColors.primary) }}
            />
            {/* Content area */}
            <div className="flex-1 p-1.5 flex flex-col gap-1">
              {/* Mock task items */}
              <div
                className="h-2.5 rounded-sm"
                style={{ backgroundColor: toHSL(lightColors.accent), width: '85%' }}
              />
              <div
                className="h-2.5 rounded-sm"
                style={{ backgroundColor: toHSL(lightColors.accent), width: '70%' }}
              />
              <div
                className="h-2.5 rounded-sm"
                style={{ backgroundColor: toHSL(lightColors.secondary), width: '55%' }}
              />
            </div>
          </div>
        </div>

        {/* Dark mode preview */}
        <div
          className="flex-1 rounded-lg overflow-hidden border"
          style={{
            backgroundColor: toHSL(darkColors.background),
            borderColor: toHSL(darkColors.border),
          }}
        >
          <div className="flex h-20">
            <div
              className="w-5 shrink-0"
              style={{ backgroundColor: toHSL(darkColors.primary) }}
            />
            <div className="flex-1 p-1.5 flex flex-col gap-1">
              <div
                className="h-2.5 rounded-sm"
                style={{ backgroundColor: toHSL(darkColors.accent), width: '85%' }}
              />
              <div
                className="h-2.5 rounded-sm"
                style={{ backgroundColor: toHSL(darkColors.accent), width: '70%' }}
              />
              <div
                className="h-2.5 rounded-sm"
                style={{ backgroundColor: toHSL(darkColors.secondary), width: '55%' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Theme info */}
      <div>
        <h3 className="text-sm font-medium text-foreground">{theme.name}</h3>
        <p className="text-xs text-muted-foreground">{theme.description}</p>
      </div>
    </button>
  )
}

const DUE_SOON_OPTIONS = [
  { value: 1, label: '1 day' },
  { value: 3, label: '3 days' },
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
]

export function SettingsView() {
  const { colorTheme, applyColorTheme, mounted } = useColorTheme()
  const dueSoonDays = useAppStore((state) => state.dueSoonDays)
  const setDueSoonDays = useAppStore((state) => state.setDueSoonDays)

  return (
    <div className="container max-w-2xl mx-auto py-12 px-6">
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-1">Settings</h2>
          <p className="text-muted-foreground text-sm">Customize your experience</p>
        </div>

        {/* Appearance Section */}
        <section className="space-y-5">
          <h3 className="text-base font-medium text-foreground">Appearance</h3>

          {/* Mode toggle */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Mode</label>
            <ThemeModeToggle />
          </div>

          {/* Color theme picker */}
          <div className="space-y-3">
            <label className="text-sm text-muted-foreground">Color theme</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {builtInThemes.map((theme) => (
                <ThemePreviewCard
                  key={theme.id}
                  theme={theme}
                  isActive={mounted && colorTheme === theme.id}
                  onClick={() => applyColorTheme(theme.id)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Task Behavior Section */}
        <section className="space-y-5">
          <h3 className="text-base font-medium text-foreground">Tasks</h3>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Due soon threshold</label>
            <p className="text-xs text-muted-foreground/70">Tasks within this window are marked as &quot;due soon&quot;</p>
            <div className="flex rounded-lg bg-secondary/60 p-1 gap-1">
              {DUE_SOON_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setDueSoonDays(value)}
                  className={cn(
                    "flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                    dueSoonDays === value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
