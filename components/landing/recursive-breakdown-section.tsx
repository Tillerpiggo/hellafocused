"use client"

import { useEffect, useState } from "react"
import { Split, ChevronRight } from "lucide-react"

export function RecursiveBreakdownSection() {
  const [animationStep, setAnimationStep] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationStep((prev) => (prev + 1) % 4) // 4 steps in the animation
    }, 2000) // Slightly slower for better comprehension

    return () => clearInterval(interval)
  }, [])

  return (
    <section className="min-h-screen flex flex-col bg-muted/20">
      <div className="container max-w-screen-xl mx-auto px-8 sm:px-12 lg:px-16 py-20">
        {/* Title */}
        <div className="mb-16">
          <div className="text-center lg:text-left lg:max-w-2xl">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light leading-tight text-foreground">
              Each to-do becomes effortless.
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed mt-6">
              With nested subtasks, you can keep subdividing subtasks until they&apos;re embarrassingly easy.
            </p>
          </div>
        </div>

        {/* Full screen visual area with more vertical space */}
        <div className="flex-1 flex items-center justify-center">
          <div
            className="w-full max-w-6xl bg-background rounded-3xl border border-border/50 overflow-hidden shadow-2xl p-8 lg:p-12"
            style={{ minHeight: "600px" }}
          >
            <div className="space-y-4 w-full h-full flex flex-col justify-center">
              {/* Main task - always visible, matching actual app style */}
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

              {/* Level 1 subtasks - appear in step 1 with staggered animation */}
              <div
                className={`ml-8 space-y-3 transition-all duration-700 ease-out ${
                  animationStep >= 1
                    ? "opacity-100 transform translate-y-0 scale-100"
                    : "opacity-0 transform translate-y-8 scale-95"
                }`}
                style={{
                  transitionDelay: animationStep >= 1 ? "0ms" : "0ms",
                  transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
                }}
              >
                <div
                  className={`flex items-center justify-between p-4 my-2 rounded-2xl border transition-all duration-500 border-border/50 ${
                    animationStep >= 1 ? "animate-in slide-in-from-left-4 fade-in" : ""
                  }`}
                  style={{ animationDelay: "100ms", animationFillMode: "both" }}
                >
                  <div className="flex items-center gap-4 flex-grow min-w-0">
                    <div className="h-8 w-8 flex-shrink-0 rounded-full flex items-center justify-center">
                      <div className="h-5 w-5 text-muted-foreground border-2 border-muted-foreground rounded-sm"></div>
                    </div>
                    <Split className="h-4 w-4 text-muted-foreground" />
                    <span className="text-base font-medium text-muted-foreground">Plan the book</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0 ml-2">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>

                <div
                  className={`flex items-center justify-between p-4 my-2 rounded-2xl border transition-all duration-500 border-border/50 ${
                    animationStep >= 1 ? "animate-in slide-in-from-left-4 fade-in" : ""
                  }`}
                  style={{ animationDelay: "200ms", animationFillMode: "both" }}
                >
                  <div className="flex items-center gap-4 flex-grow min-w-0">
                    <div className="h-8 w-8 flex-shrink-0 rounded-full flex items-center justify-center">
                      <div className="h-5 w-5 text-muted-foreground border-2 border-muted-foreground rounded-sm"></div>
                    </div>
                    <Split className="h-4 w-4 text-muted-foreground" />
                    <span className="text-base font-medium text-muted-foreground">Write chapters</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0 ml-2">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>

                {/* Level 2 subtasks - appear in step 2 with enhanced animation */}
                <div
                  className={`ml-8 space-y-2 transition-all duration-600 ease-out ${
                    animationStep >= 2
                      ? "opacity-100 transform translate-y-0 scale-100"
                      : "opacity-0 transform translate-y-6 scale-98"
                  }`}
                  style={{
                    transitionDelay: animationStep >= 2 ? "150ms" : "0ms",
                    transitionTimingFunction: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                  }}
                >
                  <div
                    className={`flex items-center justify-between p-3 my-1 rounded-2xl border transition-all duration-400 border-border/50 opacity-70 ${
                      animationStep >= 2 ? "animate-in slide-in-from-left-3 fade-in" : ""
                    }`}
                    style={{ animationDelay: "250ms", animationFillMode: "both" }}
                  >
                    <div className="flex items-center gap-3 flex-grow min-w-0">
                      <div className="h-6 w-6 flex-shrink-0 rounded-full flex items-center justify-center">
                        <div className="h-4 w-4 text-muted-foreground border border-muted-foreground rounded-sm"></div>
                      </div>
                      <Split className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Create outline</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0 ml-2">
                      <ChevronRight className="h-3 w-3" />
                    </div>
                  </div>

                  <div
                    className={`flex items-center justify-between p-3 my-1 rounded-2xl border transition-all duration-400 border-border/50 opacity-70 ${
                      animationStep >= 2 ? "animate-in slide-in-from-left-3 fade-in" : ""
                    }`}
                    style={{ animationDelay: "350ms", animationFillMode: "both" }}
                  >
                    <div className="flex items-center gap-3 flex-grow min-w-0">
                      <div className="h-6 w-6 flex-shrink-0 rounded-full flex items-center justify-center">
                        <div className="h-4 w-4 text-muted-foreground border border-muted-foreground rounded-sm"></div>
                      </div>
                      <Split className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Research topic</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0 ml-2">
                      <ChevronRight className="h-3 w-3" />
                    </div>
                  </div>

                  {/* Level 3 subtasks - appear in step 3 with bouncy animation */}
                  <div
                    className={`ml-8 space-y-1 transition-all duration-500 ease-out ${
                      animationStep >= 3
                        ? "opacity-100 transform translate-y-0 scale-100"
                        : "opacity-0 transform translate-y-4 scale-96"
                    }`}
                    style={{
                      transitionDelay: animationStep >= 3 ? "200ms" : "0ms",
                      transitionTimingFunction: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
                    }}
                  >
                    <div
                      className={`flex items-center justify-between p-2 my-1 rounded-xl border transition-all duration-300 border-border/50 opacity-50 ${
                        animationStep >= 3 ? "animate-in slide-in-from-left-2 fade-in" : ""
                      }`}
                      style={{ animationDelay: "300ms", animationFillMode: "both" }}
                    >
                      <div className="flex items-center gap-2 flex-grow min-w-0">
                        <div className="h-5 w-5 flex-shrink-0 rounded-full flex items-center justify-center">
                          <div className="h-3 w-3 text-muted-foreground border border-muted-foreground rounded-sm"></div>
                        </div>
                        <Split className="h-2 w-2 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">Open Google Docs</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0 ml-2">
                        <ChevronRight className="h-2 w-2" />
                      </div>
                    </div>

                    <div
                      className={`flex items-center justify-between p-2 my-1 rounded-xl border transition-all duration-300 border-border/50 opacity-50 ${
                        animationStep >= 3 ? "animate-in slide-in-from-left-2 fade-in" : ""
                      }`}
                      style={{ animationDelay: "400ms", animationFillMode: "both" }}
                    >
                      <div className="flex items-center gap-2 flex-grow min-w-0">
                        <div className="h-5 w-5 flex-shrink-0 rounded-full flex items-center justify-center">
                          <div className="h-3 w-3 text-muted-foreground border border-muted-foreground rounded-sm"></div>
                        </div>
                        <Split className="h-2 w-2 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">Write chapter titles</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0 ml-2">
                        <ChevronRight className="h-2 w-2" />
                      </div>
                    </div>

                    <div
                      className={`flex items-center justify-between p-2 my-1 rounded-xl border transition-all duration-300 border-border/50 opacity-50 ${
                        animationStep >= 3 ? "animate-in slide-in-from-left-2 fade-in" : ""
                      }`}
                      style={{ animationDelay: "500ms", animationFillMode: "both" }}
                    >
                      <div className="flex items-center gap-2 flex-grow min-w-0">
                        <div className="h-5 w-5 flex-shrink-0 rounded-full flex items-center justify-center">
                          <div className="h-3 w-3 text-muted-foreground border border-muted-foreground rounded-sm"></div>
                        </div>
                        <Split className="h-2 w-2 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">Find 3 sources</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0 ml-2">
                        <ChevronRight className="h-2 w-2" />
                      </div>
                    </div>

                    {/* Final level - using enhanced staggered animation */}
                    <div className="ml-6 space-y-1">
                      <div
                        className={`flex items-center justify-between p-2 my-1 rounded-lg border transition-all duration-300 border-border/50 opacity-30 ${
                          animationStep >= 3 ? "animate-in slide-in-from-left-1 fade-in" : ""
                        }`}
                        style={{ animationDelay: "600ms", animationFillMode: "both" }}
                      >
                        <div className="flex items-center gap-2 flex-grow min-w-0">
                          <div className="h-4 w-4 flex-shrink-0 rounded-full flex items-center justify-center">
                            <div className="h-2 w-2 text-muted-foreground border border-muted-foreground rounded-sm"></div>
                          </div>
                          <Split className="h-1 w-1 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground">Drink water</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0 ml-2">
                          <ChevronRight className="h-1 w-1" />
                        </div>
                      </div>
                      <div
                        className={`flex items-center justify-between p-2 my-1 rounded-lg border transition-all duration-300 border-border/50 opacity-30 ${
                          animationStep >= 3 ? "animate-in slide-in-from-left-1 fade-in" : ""
                        }`}
                        style={{ animationDelay: "700ms", animationFillMode: "both" }}
                      >
                        <div className="flex items-center gap-2 flex-grow min-w-0">
                          <div className="h-4 w-4 flex-shrink-0 rounded-full flex items-center justify-center">
                            <div className="h-2 w-2 text-muted-foreground border border-muted-foreground rounded-sm"></div>
                          </div>
                          <Split className="h-1 w-1 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground">Take a deep breath</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0 ml-2">
                          <ChevronRight className="h-1 w-1" />
                        </div>
                      </div>
                      <div
                        className={`flex items-center justify-between p-2 my-1 rounded-lg border transition-all duration-300 border-border/50 opacity-30 ${
                          animationStep >= 3 ? "animate-in slide-in-from-left-1 fade-in" : ""
                        }`}
                        style={{ animationDelay: "800ms", animationFillMode: "both" }}
                      >
                        <div className="flex items-center gap-2 flex-grow min-w-0">
                          <div className="h-4 w-4 flex-shrink-0 rounded-full flex items-center justify-center">
                            <div className="h-2 w-2 text-muted-foreground border border-muted-foreground rounded-sm"></div>
                          </div>
                          <Split className="h-1 w-1 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground">Open browser</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0 ml-2">
                          <ChevronRight className="h-1 w-1" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
