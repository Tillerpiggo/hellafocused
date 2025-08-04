"use client"

import { useEffect, useState } from "react"
import { Split, ChevronRight, Check, Shuffle, X, Plus, Target } from "lucide-react"

export function StickyScrollSection() {
  const [activeStep, setActiveStep] = useState(1)

  // Step 1 typing animation
  const [typingText, setTypingText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const fullText = "Write a book"

  // Step 2 cascading animation
  const [cascadeLevel, setCascadeLevel] = useState(0)

  // Step 3 focus mode animation
  const [focusAnimationStep, setFocusAnimationStep] = useState(0) // 0: task view, 1: focus mode with buttons

  useEffect(() => {
    const handleScroll = () => {
      const element = document.getElementById("how-it-works-section")
      if (!element) return

      const rect = element.getBoundingClientRect()
      const sectionHeight = element.offsetHeight
      const viewportHeight = window.innerHeight

      // Calculate how far we've scrolled through the section
      const scrollProgress = Math.max(0, Math.min(1, -rect.top / (sectionHeight - viewportHeight)))

      // Divide into 3 equal parts for the 3 steps
      if (scrollProgress < 0.33) {
        setActiveStep(1)
      } else if (scrollProgress < 0.66) {
        setActiveStep(2)
      } else {
        setActiveStep(3)
      }
    }

    window.addEventListener("scroll", handleScroll)
    handleScroll() // Check initial state

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Step 1: Typing animation
  useEffect(() => {
    if (activeStep === 1) {
      const startTyping = () => {
        setIsTyping(true)
        setTypingText("")

        let currentIndex = 0
        const typeInterval = setInterval(() => {
          if (currentIndex <= fullText.length) {
            setTypingText(fullText.slice(0, currentIndex))
            currentIndex++
          } else {
            clearInterval(typeInterval)
            setTimeout(() => {
              setIsTyping(false)
              setTimeout(startTyping, 1000) // Wait 1s before restarting
            }, 2000) // Show complete text for 2s
          }
        }, 100) // Type each character every 100ms
      }

      startTyping()
    }
  }, [activeStep])

  // Step 2: Cascading animation
  useEffect(() => {
    if (activeStep === 2) {
      const cascadeInterval = setInterval(() => {
        setCascadeLevel((prev) => (prev + 1) % 4) // 4 levels: 0, 1, 2, 3
      }, 2000) // Change level every 2 seconds

      return () => clearInterval(cascadeInterval)
    }
  }, [activeStep])

  // Step 3: Focus mode animation
  useEffect(() => {
    if (activeStep === 3) {
      const focusSequence = () => {
        // Start with task view
        setFocusAnimationStep(0)

        // After 2 seconds, "press" focus button and transition to focus mode
        setTimeout(() => {
          setFocusAnimationStep(1)

          // After showing focus mode for a while, restart the sequence
          setTimeout(() => {
            focusSequence()
          }, 3000)
        }, 2000)
      }

      focusSequence()
    }
  }, [activeStep])

  const handleStepClick = (step: number) => {
    setActiveStep(step)
    // Reset animations when manually clicking
    if (step === 1) {
      setTypingText("")
      setIsTyping(false)
    } else if (step === 2) {
      setCascadeLevel(0)
    } else if (step === 3) {
      setFocusAnimationStep(0)
    }

    // Optionally scroll to the appropriate section
    const element = document.getElementById("how-it-works-section")
    if (element) {
      const rect = element.getBoundingClientRect()
      const sectionHeight = element.offsetHeight
      const viewportHeight = window.innerHeight
      const scrollableHeight = sectionHeight - viewportHeight

      let targetProgress = 0
      if (step === 1)
        targetProgress = 0.16 // Middle of first third
      else if (step === 2)
        targetProgress = 0.5 // Middle of second third
      else targetProgress = 0.83 // Middle of third third

      const targetScroll = window.scrollY + rect.top + scrollableHeight * targetProgress
      window.scrollTo({ top: targetScroll, behavior: "smooth" })
    }
  }

  const getStepVisual = () => {
    switch (activeStep) {
      case 1:
        return (
          <div className="bg-background rounded-2xl p-8 border border-border/50 h-full flex items-center justify-center">
            <div className="space-y-4 w-full">
              {/* Static project cards */}
              <div className="cursor-pointer hover:shadow-md transition-all duration-300 hover:border-primary/30 border-border/50 rounded-2xl group bg-card border p-6">
                <div className="flex justify-between items-center">
                  <div className="text-foreground font-medium text-lg group-hover:text-primary transition-colors">
                    Plan weekend trip
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
              <div className="cursor-pointer hover:shadow-md transition-all duration-300 hover:border-primary/30 border-border/50 rounded-2xl group bg-card border p-6">
                <div className="flex justify-between items-center">
                  <div className="text-foreground font-medium text-lg group-hover:text-primary transition-colors">
                    Learn Spanish
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>

              {/* Typing animation card */}
              <div className="cursor-pointer hover:shadow-md transition-all duration-300 hover:border-primary/30 border-border/50 rounded-2xl group bg-card border p-6">
                <div className="flex justify-between items-center">
                  <div className="text-foreground font-medium text-lg group-hover:text-primary transition-colors flex items-center">
                    {typingText}
                    {isTyping && <span className="ml-1 animate-pulse">|</span>}
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            </div>
          </div>
        )
      case 2:
        return (
          <div className="bg-background rounded-2xl p-8 border border-border/50 h-full flex items-center justify-center">
            <div className="space-y-4 w-full">
              {/* Dynamic cascading view */}
              {cascadeLevel === 0 && (
                <div className="animate-slide-up-in">
                  <div className="flex items-center justify-between p-4 my-2 rounded-2xl border transition-all duration-300 border-primary/50 bg-primary/5">
                    <div className="flex items-center gap-4 flex-grow min-w-0">
                      <div className="h-8 w-8 flex-shrink-0 rounded-full flex items-center justify-center">
                        <div className="h-5 w-5 text-primary border-2 border-primary rounded-sm"></div>
                      </div>
                      <span className="text-base font-medium text-primary">Write a book</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-primary flex-shrink-0 ml-2">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              )}

              {cascadeLevel === 1 && (
                <div className="animate-slide-up-in">
                  <div className="flex items-center justify-between p-4 my-2 rounded-2xl border transition-all duration-300 border-border/50">
                    <div className="flex items-center gap-4 flex-grow min-w-0">
                      <div className="h-8 w-8 flex-shrink-0 rounded-full flex items-center justify-center">
                        <div className="h-5 w-5 text-muted-foreground border-2 border-muted-foreground rounded-sm"></div>
                      </div>
                      <span className="text-base font-medium">Write a book</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0 ml-2">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="ml-8 space-y-2">
                    <div className="flex items-center justify-between p-3 my-1 rounded-2xl border transition-all duration-300 border-primary/50 bg-primary/5">
                      <div className="flex items-center gap-3 flex-grow min-w-0">
                        <div className="h-6 w-6 flex-shrink-0 rounded-full flex items-center justify-center">
                          <div className="h-4 w-4 text-primary border-2 border-primary rounded-sm"></div>
                        </div>
                        <Split className="h-3 w-3 text-primary" />
                        <span className="text-sm font-medium text-primary">Plan the book</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-primary flex-shrink-0 ml-2">
                        <ChevronRight className="h-3 w-3" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 my-1 rounded-2xl border transition-all duration-300 border-border/50 opacity-60">
                      <div className="flex items-center gap-3 flex-grow min-w-0">
                        <div className="h-6 w-6 flex-shrink-0 rounded-full flex items-center justify-center">
                          <div className="h-4 w-4 text-muted-foreground border border-muted-foreground rounded-sm"></div>
                        </div>
                        <Split className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">Write chapters</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 my-1 rounded-2xl border transition-all duration-300 border-border/50 opacity-60">
                      <div className="flex items-center gap-3 flex-grow min-w-0">
                        <div className="h-6 w-6 flex-shrink-0 rounded-full flex items-center justify-center">
                          <div className="h-4 w-4 text-muted-foreground border border-muted-foreground rounded-sm"></div>
                        </div>
                        <Split className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">Edit and revise</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {cascadeLevel === 2 && (
                <div className="animate-slide-up-in">
                  <div className="flex items-center justify-between p-4 my-2 rounded-2xl border transition-all duration-300 border-border/50">
                    <div className="flex items-center gap-4 flex-grow min-w-0">
                      <div className="h-8 w-8 flex-shrink-0 rounded-full flex items-center justify-center">
                        <div className="h-5 w-5 text-muted-foreground border-2 border-muted-foreground rounded-sm"></div>
                      </div>
                      <span className="text-base font-medium">Write a book</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0 ml-2">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="ml-8 space-y-2">
                    <div className="flex items-center justify-between p-3 my-1 rounded-2xl border transition-all duration-300 border-border/50">
                      <div className="flex items-center gap-3 flex-grow min-w-0">
                        <div className="h-6 w-6 flex-shrink-0 rounded-full flex items-center justify-center">
                          <div className="h-4 w-4 text-muted-foreground border border-muted-foreground rounded-sm"></div>
                        </div>
                        <Split className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">Plan the book</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0 ml-2">
                        <ChevronRight className="h-3 w-3" />
                      </div>
                    </div>
                    <div className="ml-8 space-y-1">
                      <div className="flex items-center justify-between p-2 my-1 rounded-xl border transition-all duration-300 border-primary/50 bg-primary/5">
                        <div className="flex items-center gap-2 flex-grow min-w-0">
                          <div className="h-5 w-5 flex-shrink-0 rounded-full flex items-center justify-center">
                            <div className="h-3 w-3 text-primary border border-primary rounded-sm"></div>
                          </div>
                          <Split className="h-2 w-2 text-primary" />
                          <span className="text-xs font-medium text-primary">Create outline</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-primary flex-shrink-0 ml-2">
                          <ChevronRight className="h-2 w-2" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-2 my-1 rounded-xl border transition-all duration-300 border-border/50 opacity-40">
                        <div className="flex items-center gap-2 flex-grow min-w-0">
                          <div className="h-5 w-5 flex-shrink-0 rounded-full flex items-center justify-center">
                            <div className="h-3 w-3 text-muted-foreground border border-muted-foreground rounded-sm"></div>
                          </div>
                          <Split className="h-2 w-2 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground">Research topic</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-2 my-1 rounded-xl border transition-all duration-300 border-border/50 opacity-40">
                        <div className="flex items-center gap-2 flex-grow min-w-0">
                          <div className="h-5 w-5 flex-shrink-0 rounded-full flex items-center justify-center">
                            <div className="h-3 w-3 text-muted-foreground border border-muted-foreground rounded-sm"></div>
                          </div>
                          <Split className="h-2 w-2 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground">Set writing schedule</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 my-1 rounded-2xl border transition-all duration-300 border-border/50 opacity-60">
                      <div className="flex items-center gap-3 flex-grow min-w-0">
                        <div className="h-6 w-6 flex-shrink-0 rounded-full flex items-center justify-center">
                          <div className="h-4 w-4 text-muted-foreground border border-muted-foreground rounded-sm"></div>
                        </div>
                        <Split className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">Write chapters</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 my-1 rounded-2xl border transition-all duration-300 border-border/50 opacity-60">
                      <div className="flex items-center gap-3 flex-grow min-w-0">
                        <div className="h-6 w-6 flex-shrink-0 rounded-full flex items-center justify-center">
                          <div className="h-4 w-4 text-muted-foreground border border-muted-foreground rounded-sm"></div>
                        </div>
                        <Split className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">Edit and revise</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {cascadeLevel === 3 && (
                <div className="animate-slide-up-in">
                  {/* Show full hierarchy with Create outline as the active supertask */}
                  <div className="flex items-center justify-between p-4 my-2 rounded-2xl border transition-all duration-300 border-border/50">
                    <div className="flex items-center gap-4 flex-grow min-w-0">
                      <div className="h-8 w-8 flex-shrink-0 rounded-full flex items-center justify-center">
                        <div className="h-5 w-5 text-muted-foreground border-2 border-muted-foreground rounded-sm"></div>
                      </div>
                      <span className="text-base font-medium">Write a book</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0 ml-2">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="ml-8 space-y-2">
                    <div className="flex items-center justify-between p-3 my-1 rounded-2xl border transition-all duration-300 border-border/50">
                      <div className="flex items-center gap-3 flex-grow min-w-0">
                        <div className="h-6 w-6 flex-shrink-0 rounded-full flex items-center justify-center">
                          <div className="h-4 w-4 text-muted-foreground border border-muted-foreground rounded-sm"></div>
                        </div>
                        <Split className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">Plan the book</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0 ml-2">
                        <ChevronRight className="h-3 w-3" />
                      </div>
                    </div>
                    <div className="ml-8 space-y-1">
                      {/* Create outline as the active supertask */}
                      <div className="flex items-center justify-between p-2 my-1 rounded-xl border transition-all duration-300 border-primary/50 bg-primary/5">
                        <div className="flex items-center gap-2 flex-grow min-w-0">
                          <div className="h-5 w-5 flex-shrink-0 rounded-full flex items-center justify-center">
                            <div className="h-3 w-3 text-primary border border-primary rounded-sm"></div>
                          </div>
                          <Split className="h-2 w-2 text-primary" />
                          <span className="text-xs font-medium text-primary">Create outline</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-primary flex-shrink-0 ml-2">
                          <ChevronRight className="h-2 w-2" />
                        </div>
                      </div>
                      {/* Subtasks of Create outline */}
                      <div className="ml-6 space-y-1">
                        <div className="flex items-center justify-between p-2 my-1 rounded-lg border transition-all duration-300 border-primary/50 bg-primary/10">
                          <div className="flex items-center gap-2 flex-grow min-w-0">
                            <div className="h-4 w-4 flex-shrink-0 rounded-full flex items-center justify-center">
                              <div className="h-2 w-2 text-primary border border-primary rounded-sm"></div>
                            </div>
                            <Split className="h-1 w-1 text-primary" />
                            <span className="text-xs font-medium text-primary">Open Google Docs</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-2 my-1 rounded-lg border transition-all duration-300 border-border/50 opacity-30">
                          <div className="flex items-center gap-2 flex-grow min-w-0">
                            <div className="h-4 w-4 flex-shrink-0 rounded-full flex items-center justify-center">
                              <div className="h-2 w-2 text-muted-foreground border border-muted-foreground rounded-sm"></div>
                            </div>
                            <Split className="h-1 w-1 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">List main chapters</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-2 my-1 rounded-lg border transition-all duration-300 border-border/50 opacity-30">
                          <div className="flex items-center gap-2 flex-grow min-w-0">
                            <div className="h-4 w-4 flex-shrink-0 rounded-full flex items-center justify-center">
                              <div className="h-2 w-2 text-muted-foreground border border-muted-foreground rounded-sm"></div>
                            </div>
                            <Split className="h-1 w-1 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">Add chapter summaries</span>
                          </div>
                        </div>
                      </div>
                      {/* Other subtasks of Plan the book */}
                      <div className="flex items-center justify-between p-2 my-1 rounded-xl border transition-all duration-300 border-border/50 opacity-40">
                        <div className="flex items-center gap-2 flex-grow min-w-0">
                          <div className="h-5 w-5 flex-shrink-0 rounded-full flex items-center justify-center">
                            <div className="h-3 w-3 text-muted-foreground border border-muted-foreground rounded-sm"></div>
                          </div>
                          <Split className="h-2 w-2 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground">Research topic</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-2 my-1 rounded-xl border transition-all duration-300 border-border/50 opacity-40">
                        <div className="flex items-center gap-2 flex-grow min-w-0">
                          <div className="h-5 w-5 flex-shrink-0 rounded-full flex items-center justify-center">
                            <div className="h-3 w-3 text-muted-foreground border border-muted-foreground rounded-sm"></div>
                          </div>
                          <Split className="h-2 w-2 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground">Set writing schedule</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      case 3:
        return (
          <div className="bg-background rounded-2xl border border-border/50 overflow-hidden h-full relative">
            {/* Task view - shown initially */}
            {focusAnimationStep === 0 && (
              <div className="w-full h-full p-6 animate-slide-up-in">
                {/* Header with focus button */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-light">Write a book</h2>
                  <button
                    className={`px-4 py-2 rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 flex items-center gap-2 text-sm ${
                      focusAnimationStep === 0 ? "animate-pulse" : ""
                    }`}
                  >
                    <Target className="h-4 w-4" />
                    Focus
                  </button>
                </div>

                {/* Task list */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20">
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 border-2 border-muted-foreground rounded-sm"></div>
                      <span className="text-sm">Plan the book</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20">
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 border-2 border-muted-foreground rounded-sm"></div>
                      <span className="text-sm">Write chapters</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20">
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 border-2 border-muted-foreground rounded-sm"></div>
                      <span className="text-sm">Edit and revise</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            )}

            {/* Focus mode - final state with buttons */}
            {focusAnimationStep === 1 && (
              <div className="w-full h-full flex flex-col relative animate-gentle-spring-up">
                <div className="absolute top-4 left-4 h-8 w-8 rounded-full bg-muted/20 flex items-center justify-center opacity-50">
                  <X className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="absolute top-4 right-4 h-8 w-8 rounded-full bg-muted/20 flex items-center justify-center opacity-50">
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 flex items-center justify-center p-6">
                  <div className="text-center">
                    <h1 className="text-2xl sm:text-3xl font-light text-foreground leading-relaxed">
                      Open Google Docs
                    </h1>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-4 p-6 max-w-sm mx-auto w-full sm:flex-row sm:gap-4">
                  <button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-full transition-all duration-300 shadow-lg flex items-center justify-center gap-2 text-sm">
                    <Check className="h-4 w-4" />
                    Complete
                  </button>
                  <button className="flex-1 py-3 rounded-full border-2 border-border flex items-center justify-center gap-2 text-sm">
                    <Shuffle className="h-4 w-4" />
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      default:
        return null
    }
  }

  return (
    <>
      {/* How It Works Section - Desktop Sticky, Mobile Traditional */}
      <section id="how-it-works-section" className="py-20 bg-muted/20">
        <div className="container max-w-screen-xl mx-auto px-8 sm:px-12 lg:px-16">
                     {/* Section Header - Only visible on mobile */}
           <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-4">
              How it works
            </h2>
          </div>

                     {/* Desktop Version - Sticky */}
           <div className="hidden" style={{ minHeight: "200vh" }}>
            <div className="sticky top-20">
              {/* Section Header - now part of the sticky element */}
              <div className="text-center mb-16">
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light text-foreground mb-4">
                  How it works
                </h2>
              </div>
              <div className="grid lg:grid-cols-2 gap-16">
                {/* Left side - All steps visible and sticky */}
                <div className="space-y-12">
                  {/* Step 1 */}
                  <button
                    onClick={() => handleStepClick(1)}
                    className={`flex items-center gap-6 transition-all duration-500 ease-out w-full text-left group ${
                      activeStep === 1 ? "opacity-100 scale-105 transform" : "opacity-40 scale-100 hover:opacity-70"
                    }`}
                  >
                    <div
                      className={`bg-primary text-primary-foreground rounded-full flex items-center justify-center font-medium text-lg flex-shrink-0 transition-all duration-500 ${
                        activeStep === 1 ? "w-12 h-12 shadow-lg" : "w-10 h-10 group-hover:w-11 group-hover:h-11"
                      }`}
                    >
                      1
                    </div>
                    <div className="flex items-center">
                      <h3
                        className={`font-medium text-foreground transition-all duration-500 ${
                          activeStep === 1 ? "text-2xl" : "text-xl"
                        }`}
                      >
                        Add tasks
                      </h3>
                    </div>
                  </button>

                  {/* Step 2 */}
                  <button
                    onClick={() => handleStepClick(2)}
                    className={`flex items-center gap-6 transition-all duration-500 ease-out w-full text-left group ${
                      activeStep === 2 ? "opacity-100 scale-105 transform" : "opacity-40 scale-100 hover:opacity-70"
                    }`}
                  >
                    <div
                      className={`bg-primary text-primary-foreground rounded-full flex items-center justify-center font-medium text-lg flex-shrink-0 transition-all duration-500 ${
                        activeStep === 2 ? "w-12 h-12 shadow-lg" : "w-10 h-10 group-hover:w-11 group-hover:h-11"
                      }`}
                    >
                      2
                    </div>
                    <div className="flex items-center">
                      <h3
                        className={`font-medium text-foreground transition-all duration-500 ${
                          activeStep === 2 ? "text-2xl" : "text-xl"
                        }`}
                      >
                        Break tasks into subtasks
                      </h3>
                    </div>
                  </button>

                  {/* Step 3 */}
                  <button
                    onClick={() => handleStepClick(3)}
                    className={`flex items-center gap-6 transition-all duration-500 ease-out w-full text-left group ${
                      activeStep === 3 ? "opacity-100 scale-105 transform" : "opacity-40 scale-100 hover:opacity-70"
                    }`}
                  >
                    <div
                      className={`bg-primary text-primary-foreground rounded-full flex items-center justify-center font-medium text-lg flex-shrink-0 transition-all duration-500 ${
                        activeStep === 3 ? "w-12 h-12 shadow-lg" : "w-10 h-10 group-hover:w-11 group-hover:h-11"
                      }`}
                    >
                      3
                    </div>
                    <div className="flex items-center">
                      <h3
                        className={`font-medium text-foreground transition-all duration-500 ${
                          activeStep === 3 ? "text-2xl" : "text-xl"
                        }`}
                      >
                        Click &apos;focus&apos; to start working
                      </h3>
                    </div>
                  </button>
                </div>

                {/* Right side - Sticky visual */}
                <div className="h-[28rem]">
                  <div className="transition-all duration-500 ease-out h-full w-full">{getStepVisual()}</div>
                </div>
              </div>
            </div>
          </div>

                     {/* Mobile Version - Traditional with animations */}
           <div className="space-y-16">
            {/* Step 1 */}
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="bg-primary text-primary-foreground w-10 h-10 rounded-full flex items-center justify-center font-medium text-lg flex-shrink-0">
                  1
                </div>
                <div className="flex items-center">
                  <h3 className="text-2xl font-medium text-foreground">Add tasks</h3>
                </div>
              </div>
              <div className="bg-background rounded-2xl p-6 border border-border/50" style={{ minHeight: "400px" }}>
                <div className="space-y-3">
                  <div className="cursor-pointer hover:shadow-md transition-all duration-300 hover:border-primary/30 border-border/50 rounded-2xl group bg-card border p-4">
                    <div className="flex justify-between items-center">
                      <div className="text-foreground font-medium group-hover:text-primary transition-colors">
                        Plan weekend trip
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                  <div className="cursor-pointer hover:shadow-md transition-all duration-300 hover:border-primary/30 border-border/50 rounded-2xl group bg-card border p-4">
                    <div className="flex justify-between items-center">
                      <div className="text-foreground font-medium group-hover:text-primary transition-colors">
                        Learn Spanish
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                  {/* Typing animation card for mobile */}
                  <div className="cursor-pointer hover:shadow-md transition-all duration-300 hover:border-primary/30 border-border/50 rounded-2xl group bg-card border p-4">
                    <div className="flex justify-between items-center">
                      <div className="text-foreground font-medium group-hover:text-primary transition-colors flex items-center">
                        {typingText}
                        {isTyping && <span className="ml-1 animate-pulse">|</span>}
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="bg-primary text-primary-foreground w-10 h-10 rounded-full flex items-center justify-center font-medium text-lg flex-shrink-0">
                  2
                </div>
                <div className="flex items-center">
                  <h3 className="text-2xl font-medium text-foreground">Break tasks into subtasks</h3>
                </div>
              </div>
              <div className="bg-background rounded-2xl p-6 border border-border/50" style={{ minHeight: "400px" }}>
                {/* Mobile cascading animation - same logic as desktop */}
                <div className="space-y-4 w-full">
                  {cascadeLevel === 0 && (
                    <div className="animate-slide-up-in">
                      <div className="flex items-center justify-between p-4 my-2 rounded-2xl border transition-all duration-300 border-primary/50 bg-primary/5">
                        <div className="flex items-center gap-4 flex-grow min-w-0">
                          <div className="h-8 w-8 flex-shrink-0 rounded-full flex items-center justify-center">
                            <div className="h-5 w-5 text-primary border-2 border-primary rounded-sm"></div>
                          </div>
                          <span className="text-base font-medium text-primary">Write a book</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-primary flex-shrink-0 ml-2">
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  )}

                  {cascadeLevel === 1 && (
                    <div className="animate-slide-up-in">
                      <div className="flex items-center justify-between p-4 my-2 rounded-2xl border transition-all duration-300 border-border/50">
                        <div className="flex items-center gap-4 flex-grow min-w-0">
                          <div className="h-8 w-8 flex-shrink-0 rounded-full flex items-center justify-center">
                            <div className="h-5 w-5 text-muted-foreground border-2 border-muted-foreground rounded-sm"></div>
                          </div>
                          <span className="text-base font-medium">Write a book</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0 ml-2">
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="ml-8 space-y-2">
                        <div className="flex items-center justify-between p-3 my-1 rounded-2xl border transition-all duration-300 border-primary/50 bg-primary/5">
                          <div className="flex items-center gap-3 flex-grow min-w-0">
                            <div className="h-6 w-6 flex-shrink-0 rounded-full flex items-center justify-center">
                              <div className="h-4 w-4 text-primary border-2 border-primary rounded-sm"></div>
                            </div>
                            <Split className="h-3 w-3 text-primary" />
                            <span className="text-sm font-medium text-primary">Plan the book</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-primary flex-shrink-0 ml-2">
                            <ChevronRight className="h-3 w-3" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 my-1 rounded-2xl border transition-all duration-300 border-border/50 opacity-60">
                          <div className="flex items-center gap-3 flex-grow min-w-0">
                            <div className="h-6 w-6 flex-shrink-0 rounded-full flex items-center justify-center">
                              <div className="h-4 w-4 text-muted-foreground border border-muted-foreground rounded-sm"></div>
                            </div>
                            <Split className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm font-medium text-muted-foreground">Write chapters</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 my-1 rounded-2xl border transition-all duration-300 border-border/50 opacity-60">
                          <div className="flex items-center gap-3 flex-grow min-w-0">
                            <div className="h-6 w-6 flex-shrink-0 rounded-full flex items-center justify-center">
                              <div className="h-4 w-4 text-muted-foreground border border-muted-foreground rounded-sm"></div>
                            </div>
                            <Split className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm font-medium text-muted-foreground">Edit and revise</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {cascadeLevel === 2 && (
                    <div className="animate-slide-up-in">
                      <div className="flex items-center justify-between p-4 my-2 rounded-2xl border transition-all duration-300 border-border/50">
                        <div className="flex items-center gap-4 flex-grow min-w-0">
                          <div className="h-8 w-8 flex-shrink-0 rounded-full flex items-center justify-center">
                            <div className="h-5 w-5 text-muted-foreground border-2 border-muted-foreground rounded-sm"></div>
                          </div>
                          <span className="text-base font-medium">Write a book</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0 ml-2">
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="ml-8 space-y-2">
                        <div className="flex items-center justify-between p-3 my-1 rounded-2xl border transition-all duration-300 border-border/50">
                          <div className="flex items-center gap-3 flex-grow min-w-0">
                            <div className="h-6 w-6 flex-shrink-0 rounded-full flex items-center justify-center">
                              <div className="h-4 w-4 text-muted-foreground border border-muted-foreground rounded-sm"></div>
                            </div>
                            <Split className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm font-medium text-muted-foreground">Plan the book</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0 ml-2">
                            <ChevronRight className="h-3 w-3" />
                          </div>
                        </div>
                        <div className="ml-8 space-y-1">
                          <div className="flex items-center justify-between p-2 my-1 rounded-xl border transition-all duration-300 border-primary/50 bg-primary/5">
                            <div className="flex items-center gap-2 flex-grow min-w-0">
                              <div className="h-5 w-5 flex-shrink-0 rounded-full flex items-center justify-center">
                                <div className="h-3 w-3 text-primary border border-primary rounded-sm"></div>
                              </div>
                              <Split className="h-2 w-2 text-primary" />
                              <span className="text-xs font-medium text-primary">Create outline</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-primary flex-shrink-0 ml-2">
                              <ChevronRight className="h-2 w-2" />
                            </div>
                          </div>
                          <div className="flex items-center justify-between p-2 my-1 rounded-xl border transition-all duration-300 border-border/50 opacity-40">
                            <div className="flex items-center gap-2 flex-grow min-w-0">
                              <div className="h-5 w-5 flex-shrink-0 rounded-full flex items-center justify-center">
                                <div className="h-3 w-3 text-muted-foreground border border-muted-foreground rounded-sm"></div>
                              </div>
                              <Split className="h-2 w-2 text-muted-foreground" />
                              <span className="text-xs font-medium text-muted-foreground">Research topic</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between p-2 my-1 rounded-xl border transition-all duration-300 border-border/50 opacity-40">
                            <div className="flex items-center gap-2 flex-grow min-w-0">
                              <div className="h-5 w-5 flex-shrink-0 rounded-full flex items-center justify-center">
                                <div className="h-3 w-3 text-muted-foreground border border-muted-foreground rounded-sm"></div>
                              </div>
                              <Split className="h-2 w-2 text-muted-foreground" />
                              <span className="text-xs font-medium text-muted-foreground">Set writing schedule</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 my-1 rounded-2xl border transition-all duration-300 border-border/50 opacity-60">
                          <div className="flex items-center gap-3 flex-grow min-w-0">
                            <div className="h-6 w-6 flex-shrink-0 rounded-full flex items-center justify-center">
                              <div className="h-4 w-4 text-muted-foreground border border-muted-foreground rounded-sm"></div>
                            </div>
                            <Split className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm font-medium text-muted-foreground">Write chapters</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 my-1 rounded-2xl border transition-all duration-300 border-border/50 opacity-60">
                          <div className="flex items-center gap-3 flex-grow min-w-0">
                            <div className="h-6 w-6 flex-shrink-0 rounded-full flex items-center justify-center">
                              <div className="h-4 w-4 text-muted-foreground border border-muted-foreground rounded-sm"></div>
                            </div>
                            <Split className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm font-medium text-muted-foreground">Edit and revise</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {cascadeLevel === 3 && (
                    <div className="animate-slide-up-in">
                      {/* Show full hierarchy with Create outline as the active supertask */}
                      <div className="flex items-center justify-between p-4 my-2 rounded-2xl border transition-all duration-300 border-border/50">
                        <div className="flex items-center gap-4 flex-grow min-w-0">
                          <div className="h-8 w-8 flex-shrink-0 rounded-full flex items-center justify-center">
                            <div className="h-5 w-5 text-muted-foreground border-2 border-muted-foreground rounded-sm"></div>
                          </div>
                          <span className="text-base font-medium">Write a book</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0 ml-2">
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="ml-8 space-y-2">
                        <div className="flex items-center justify-between p-3 my-1 rounded-2xl border transition-all duration-300 border-border/50">
                          <div className="flex items-center gap-3 flex-grow min-w-0">
                            <div className="h-6 w-6 flex-shrink-0 rounded-full flex items-center justify-center">
                              <div className="h-4 w-4 text-muted-foreground border border-muted-foreground rounded-sm"></div>
                            </div>
                            <Split className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm font-medium text-muted-foreground">Plan the book</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0 ml-2">
                            <ChevronRight className="h-3 w-3" />
                          </div>
                        </div>
                        <div className="ml-8 space-y-1">
                          {/* Create outline as the active supertask */}
                          <div className="flex items-center justify-between p-2 my-1 rounded-xl border transition-all duration-300 border-primary/50 bg-primary/5">
                            <div className="flex items-center gap-2 flex-grow min-w-0">
                              <div className="h-5 w-5 flex-shrink-0 rounded-full flex items-center justify-center">
                                <div className="h-3 w-3 text-primary border border-primary rounded-sm"></div>
                              </div>
                              <Split className="h-2 w-2 text-primary" />
                              <span className="text-xs font-medium text-primary">Create outline</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-primary flex-shrink-0 ml-2">
                              <ChevronRight className="h-2 w-2" />
                            </div>
                          </div>
                          {/* Subtasks of Create outline */}
                          <div className="ml-6 space-y-1">
                            <div className="flex items-center justify-between p-2 my-1 rounded-lg border transition-all duration-300 border-primary/50 bg-primary/10">
                              <div className="flex items-center gap-2 flex-grow min-w-0">
                                <div className="h-4 w-4 flex-shrink-0 rounded-full flex items-center justify-center">
                                  <div className="h-2 w-2 text-primary border border-primary rounded-sm"></div>
                                </div>
                                <Split className="h-1 w-1 text-primary" />
                                <span className="text-xs font-medium text-primary">Open Google Docs</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between p-2 my-1 rounded-lg border transition-all duration-300 border-border/50 opacity-30">
                              <div className="flex items-center gap-2 flex-grow min-w-0">
                                <div className="h-4 w-4 flex-shrink-0 rounded-full flex items-center justify-center">
                                  <div className="h-2 w-2 text-muted-foreground border border-muted-foreground rounded-sm"></div>
                                </div>
                                <Split className="h-1 w-1 text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground">List main chapters</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between p-2 my-1 rounded-lg border transition-all duration-300 border-border/50 opacity-30">
                              <div className="flex items-center gap-2 flex-grow min-w-0">
                                <div className="h-4 w-4 flex-shrink-0 rounded-full flex items-center justify-center">
                                  <div className="h-2 w-2 text-muted-foreground border border-muted-foreground rounded-sm"></div>
                                </div>
                                <Split className="h-1 w-1 text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground">Add chapter summaries</span>
                              </div>
                            </div>
                          </div>
                          {/* Other subtasks of Plan the book */}
                          <div className="flex items-center justify-between p-2 my-1 rounded-xl border transition-all duration-300 border-border/50 opacity-40">
                            <div className="flex items-center gap-2 flex-grow min-w-0">
                              <div className="h-5 w-5 flex-shrink-0 rounded-full flex items-center justify-center">
                                <div className="h-3 w-3 text-muted-foreground border border-muted-foreground rounded-sm"></div>
                              </div>
                              <Split className="h-2 w-2 text-muted-foreground" />
                              <span className="text-xs font-medium text-muted-foreground">Research topic</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between p-2 my-1 rounded-xl border transition-all duration-300 border-border/50 opacity-40">
                            <div className="flex items-center gap-2 flex-grow min-w-0">
                              <div className="h-5 w-5 flex-shrink-0 rounded-full flex items-center justify-center">
                                <div className="h-3 w-3 text-muted-foreground border border-muted-foreground rounded-sm"></div>
                              </div>
                              <Split className="h-2 w-2 text-muted-foreground" />
                              <span className="text-xs font-medium text-muted-foreground">Set writing schedule</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="bg-primary text-primary-foreground w-10 h-10 rounded-full flex items-center justify-center font-medium text-lg flex-shrink-0">
                  3
                </div>
                <div className="flex items-center">
                  <h3 className="text-2xl font-medium text-foreground">Click &apos;focus&apos; to start working</h3>
                </div>
              </div>
              <div
                className="bg-background rounded-2xl border border-border/50 overflow-hidden relative"
                style={{ height: "600px" }}
              >
                {/* Mobile focus mode animation - same as desktop */}
                {focusAnimationStep === 0 && (
                  <div className="w-full h-full p-6 animate-slide-up-in">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-light">Write a book</h2>
                      <button
                        className={`px-4 py-2 rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 flex items-center gap-2 text-sm ${
                          focusAnimationStep === 0 ? "animate-pulse" : ""
                        }`}
                      >
                        <Target className="h-4 w-4" />
                        Focus
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20">
                        <div className="flex items-center gap-3">
                          <div className="h-5 w-5 border-2 border-muted-foreground rounded-sm"></div>
                          <span className="text-sm">Plan the book</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20">
                        <div className="flex items-center gap-3">
                          <div className="h-5 w-5 border-2 border-muted-foreground rounded-sm"></div>
                          <span className="text-sm">Write chapters</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20">
                        <div className="flex items-center gap-3">
                          <div className="h-5 w-5 border-2 border-muted-foreground rounded-sm"></div>
                          <span className="text-sm">Edit and revise</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                )}

                {focusAnimationStep === 1 && (
                  <div className="w-full h-full flex flex-col relative animate-gentle-spring-up">
                    <div className="absolute top-4 left-4 h-8 w-8 rounded-full bg-muted/20 flex items-center justify-center opacity-50">
                      <X className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="absolute top-4 right-4 h-8 w-8 rounded-full bg-muted/20 flex items-center justify-center opacity-50">
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 flex items-center justify-center p-6">
                      <div className="text-center">
                        <h1 className="text-2xl font-light text-foreground leading-relaxed">Open Google Docs</h1>
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-3 p-6 max-w-sm mx-auto w-full">
                      <button className="w-full bg-primary text-primary-foreground py-3 rounded-full flex items-center justify-center gap-2 text-sm">
                        <Check className="h-4 w-4" />
                        Complete
                      </button>
                      <button className="w-full py-3 rounded-full border-2 border-border flex items-center justify-center gap-2 text-sm">
                        <Shuffle className="h-4 w-4" />
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
