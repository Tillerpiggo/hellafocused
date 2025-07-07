"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { X, Plus, Check, Shuffle, ChevronRight, Split, ArrowRight } from "lucide-react"
import { useAppStore } from "@/store/app-store"

const placeholderGoals = [
  "Learn Spanish",
  "Write a book", 
  "Get in shape",
  "Start a business",
  "Learn to code",
  "Eat healthier",
  "Make new friends",
  "Learn piano",
  "Save money",
  "Get organized",
  "Learn guitar",
  "Start a podcast",
  "Run a marathon",
  "Learn photography",
  "Start cooking more"
];

interface HeroSectionProps {
  hasSession?: boolean | null
}

export function HeroSection({ hasSession }: HeroSectionProps) {
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0)
  const [selectedView, setSelectedView] = useState('focus')
  const [inputText, setInputText] = useState('')
  const router = useRouter()
  const { addProject, selectProject } = useAppStore()

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlaceholder((prev) => (prev + 1) % placeholderGoals.length)
    }, 4500)

    return () => clearInterval(interval)
  }, [])

  const handleContinue = () => {
    if (inputText.trim()) {
      // Store project name for creation after auth
      localStorage.setItem('pendingProjectName', inputText.trim())
      router.push('/app')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleContinue()
    }
  }

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50/20 via-background to-purple-50/10 dark:from-blue-950/10 dark:via-background dark:to-purple-950/5 pt-4 lg:pt-0">
      <div className="container max-w-screen-xl mx-auto px-8 sm:px-12 lg:px-16">
        <div className="text-center">
          {/* Hero Title - Bottom aligned to midpoint */}
          <div className="flex flex-col justify-end h-48 mb-6">
                          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-4">
                Break down <span className="text-accent-foreground font-black">anything</span>
              </h1>
            
            {/* Static subtitle */}
            <div className="text-lg sm:text-xl lg:text-2xl font-normal text-muted-foreground leading-tight">
              Turn projects into hierarchical subtasks.
            </div>
                      </div>

          {/* Interactive Text Area */}
          <div className="mt-12 mb-8 max-w-lg mx-auto">
            <div className="relative">
              <Textarea
                placeholder={placeholderGoals[currentPlaceholder] + "..."}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pr-12 text-lg resize-none min-h-[60px] rounded-xl border-2 border-border/50 focus:border-primary/50 bg-background/80 backdrop-blur placeholder:text-muted-foreground/70"
                rows={2}
              />
              <button
                onClick={handleContinue}
                disabled={!inputText.trim()}
                className={`absolute bottom-3 right-3 p-2 rounded-lg transition-all duration-200 ${
                  inputText.trim()
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                    : 'bg-muted text-muted-foreground/50 cursor-not-allowed'
                }`}
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>



          {/* View Selector */}
          <div className="mt-16 mb-8 flex justify-center">
            <SegmentedControl
              options={[
                { value: 'nested', label: 'Nested subtasks' },
                { value: 'focus', label: 'Focus mode' }
              ]}
              value={selectedView}
              onChange={setSelectedView}
            />
          </div>

          {/* Visual Demo */}
          <div className="-mx-4 sm:-mx-6 lg:-mx-8 relative">
            {selectedView === 'focus' ? (
              <div
                className="bg-background rounded-3xl border border-border/50 overflow-hidden shadow-2xl w-full mx-auto relative"
                style={{ height: "500px" }}
              >
                {/* Focus view layout matching actual app */}
                <div className="w-full h-full flex flex-col relative">
                {/* Exit button in top left (like actual app) */}
                <div className="absolute top-6 left-6 h-10 w-10 rounded-full bg-muted/20 flex items-center justify-center opacity-50">
                  <X className="h-5 w-5 text-muted-foreground" />
                </div>

                {/* Add tasks button in top right (like actual app) */}
                <div className="absolute top-6 right-6 h-10 w-10 rounded-full bg-muted/20 flex items-center justify-center opacity-50">
                  <Plus className="h-5 w-5 text-muted-foreground" />
                </div>

                {/* Main content area - centered like actual focus view */}
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center max-w-4xl">
                    <h1
                      key="visual-task-static"
                      className="text-3xl sm:text-4xl md:text-5xl font-light text-foreground leading-relaxed break-words animate-in fade-in duration-500"
                    >
                      set your alarm 5 minutes earlier
                    </h1>
                  </div>
                </div>

                {/* Bottom action buttons - positioned at absolute bottom */}
                <div className="absolute bottom-0 left-0 right-0 flex flex-col sm:flex-row gap-6 p-8 max-w-md mx-auto w-full">
                  <button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-4 rounded-full transition-all duration-300 hover:scale-105 shadow-lg flex items-center justify-center gap-2">
                    <Check className="h-5 w-5" />
                    Complete
                  </button>
                  <button className="flex-1 py-4 rounded-full transition-all duration-300 hover:scale-105 border-2 border-border flex items-center justify-center gap-2">
                    <Shuffle className="h-5 w-5" />
                    Next
                  </button>
                </div>
                </div>
              </div>
            ) : (
              // Nested subtasks view
              <div
                className="bg-background rounded-3xl border border-border/50 overflow-hidden shadow-2xl w-full mx-auto relative"
                style={{ height: "500px" }}
              >
                <div className="w-full h-full flex items-center justify-center p-8">
                  <div className="space-y-6 w-full max-w-md">
                    {/* Main task */}
                    <div className="flex items-center justify-between p-4 bg-primary/10 rounded-xl border border-primary/20">
                      <div className="flex items-center gap-3">
                        <div className="h-6 w-6 rounded-full border-2 border-primary"></div>
                        <span className="font-medium text-primary">Write a book</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-primary" />
                    </div>
                    
                    {/* Subtasks */}
                    <div className="ml-6 space-y-2">
                      <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-primary/5">
                        <div className="flex items-center gap-3">
                          <div className="h-4 w-4 rounded-sm border border-primary bg-primary"></div>
                          <Split className="h-3 w-3 text-primary" />
                          <span className="text-sm font-medium text-primary">Plan the book</span>
                        </div>
                        <ChevronRight className="h-3 w-3 text-primary" />
                      </div>
                      
                      <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 opacity-60">
                        <div className="flex items-center gap-3">
                          <div className="h-4 w-4 rounded-sm border border-muted-foreground"></div>
                          <Split className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Write chapters</span>
                        </div>
                      </div>
                      
                      {/* Sub-subtasks */}
                      <div className="ml-6 space-y-1">
                        <div className="flex items-center justify-between p-2 rounded-lg border border-primary/30 bg-primary/10">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-sm border border-primary bg-primary"></div>
                            <Split className="h-2 w-2 text-primary" />
                            <span className="text-xs font-medium text-primary">Research topic</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-2 rounded-lg border border-border/30 opacity-40">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-sm border border-muted-foreground"></div>
                            <Split className="h-2 w-2 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Create outline</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
