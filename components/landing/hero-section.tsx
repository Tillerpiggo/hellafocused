"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { SegmentedControl } from "@/components/ui/segmented-control"
import Link from "next/link"
import { X, Plus, Check, Shuffle, ChevronRight, Split } from "lucide-react"

const examples = [
  { goal: "Write a book", task: "write one sentence" },
  { goal: "Learn Spanish", task: "download Duolingo" },
  { goal: "Get fit", task: "do 1 push-up" },
  { goal: "Start a business", task: "name a problem you have" },
  { goal: "Learn piano", task: "download a piano app" },
  { goal: "Clean my room", task: "put one sock in the hamper" },
  { goal: "Eat healthier", task: "find a calorie tracker" },
  { goal: "Save money", task: "put away 5 dollars" },
  { goal: "Make friends", task: "text one person 'how are you?'" },
  { goal: "Learn coding", task: "look up coding tutorials on YouTube" },
  { goal: "Meditate daily", task: "take a deep breath" },
  { goal: "Cook dinner", task: "turn on the stove" },
  { goal: "Network better", task: "text an old friend" },
  { goal: "Wake up earlier", task: "set your alarm 1 minute earlier" },
  { goal: "Start journaling", task: "write today's date on paper" }
];

interface HeroSectionProps {
  hasSession?: boolean | null
}

export function HeroSection({ hasSession }: HeroSectionProps) {
  const [currentExample, setCurrentExample] = useState(0)
  const [selectedView, setSelectedView] = useState('focus')
  const [isTaskChecked, setIsTaskChecked] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTaskChecked(true)
      
      // After a brief pause, move to next example and uncheck
      setTimeout(() => {
        const nextExample = (currentExample + 1) % examples.length
        setCurrentExample(nextExample)
        // Always reset to unchecked, and ensure first example stays unchecked
        setIsTaskChecked(false)
      }, 2000)
    }, 3000)

    return () => clearInterval(interval)
  }, [currentExample])

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50/20 via-background to-purple-50/10 dark:from-blue-950/10 dark:via-background dark:to-purple-950/5 pt-4 lg:pt-0">
      <div className="container max-w-screen-xl mx-auto px-8 sm:px-12 lg:px-16">
        <div className="text-center">
          {/* Hero Title - Bottom aligned to midpoint */}
          <div className="flex flex-col justify-end h-64 mb-8">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground leading-tight mb-4">
              {/* Break down <span className="text-primary font-bold italic">any goal.</span> */}
              {/* One task. Full screen. */}
              {/* Break down any goal. */}
              {/* Make anything easy. */}
              Bite-sized productivity.
            </h1>
            
            {/* Typing effect subtitle with todo styling */}
            <div className="text-xl sm:text-2xl lg:text-3xl font-normal text-muted-foreground leading-tight">
              <div 
                key={`example-${currentExample}`}
                className="flex flex-col sm:inline-flex sm:flex-row items-center gap-3 sm:gap-4 animate-wipe-in"
                style={{
                  animation: 'wipe-in 0.8s ease-out forwards'
                }}
              >
                {/* Goal todo item */}
                <div className="flex items-center gap-3 sm:gap-2 bg-muted/20 rounded-lg px-4 py-3 sm:px-3 sm:py-2 border border-border/30">
                  <div className="h-5 w-5 sm:h-4 sm:w-4 rounded-sm border-2 border-muted-foreground bg-transparent flex items-center justify-center">
                  </div>
                  <span className="text-muted-foreground">
                    {examples[currentExample].goal}
                  </span>
                </div>

                <span className="text-muted-foreground mx-0 sm:mx-2">becomes</span>

                {/* Task todo item */}
                <div className="flex items-center gap-3 sm:gap-2 bg-muted/20 rounded-lg px-4 py-3 sm:px-3 sm:py-2 border border-border/30">
                  <div 
                    className={`h-5 w-5 sm:h-4 sm:w-4 rounded-sm border-2 transition-all duration-300 flex items-center justify-center ${
                      isTaskChecked ? 'border-blue-500 bg-blue-500' : 'border-muted-foreground bg-transparent'
                    }`}
                  >
                    {isTaskChecked && (
                      <Check className="h-4 w-4 sm:h-3 sm:w-3 text-white animate-in zoom-in duration-200" />
                    )}
                  </div>
                  <span 
                    className={`text-muted-foreground transition-all duration-300 ${
                      isTaskChecked ? 'line-through' : ''
                    }`}
                  >
                    {examples[currentExample].task}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* CTA - Top aligned to midpoint */}
          <div className="flex flex-col justify-start">
            <div className="flex flex-col items-center mt-6">
              <Link href="/app">
                <Button size="lg" className="text-lg px-8 py-6">
                  {hasSession ? (
                    <>
                      <span className="sm:hidden">Continue by tapping here</span>
                      <span className="hidden sm:inline">Continue by clicking here</span>
                    </>
                  ) : (
                    <>
                      <span className="sm:hidden">Start by tapping here</span>
                      <span className="hidden sm:inline">Start by clicking here</span>
                    </>
                  )}
                </Button>
              </Link>
              {!hasSession && (
                <p className="text-sm text-muted-foreground mt-2">
                  No signup required.
                </p>
              )}
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
                      key={`visual-task-${currentExample}`}
                      className="text-3xl sm:text-4xl md:text-5xl font-light text-foreground leading-relaxed break-words animate-in fade-in duration-500"
                    >
                      {examples[currentExample].task}
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
