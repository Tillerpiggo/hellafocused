"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { ChevronRight } from "lucide-react"

interface FAQItem {
  question: string
  answer: string
}

const faqData: FAQItem[] = [
  {
    question: "How is this different from other task apps?",
    answer:
      "Most apps just let you make lists. We force you to break tasks down until they're actually doable, then feed them to you one at a time.",
  },
  {
    question: "What if I don't want to break down every task?",
    answer: "You can use hellafocused like a regular to-do app too. The breakdown feature is there when you need it.",
  },
  {
    question: "What if I don't like the task it gives me?",
    answer:
      "You can always press 'Next' to get a different task. Or, if you're just having trouble starting, you can break down the task into smaller tasks even while in Focus Mode.",
  },
  {
    question: "Is it free?",
    answer: "Yes! Basic hellafocused is completely free. Premium features coming soon.",
  },
  {
    question: "Does it work on mobile?",
    answer: "Absolutely. Hellafocused works great on all devices.",
  },
]

export function FAQSection() {
  const [openIndices, setOpenIndices] = useState<Set<number>>(new Set())

  const toggleAccordion = (index: number) => {
    setOpenIndices((prevIndices) => {
      const newIndices = new Set(prevIndices)
      if (newIndices.has(index)) {
        newIndices.delete(index)
      } else {
        newIndices.add(index)
      }
      return newIndices
    })
  }

  return (
    <section className="py-20 bg-muted/20">
      <div className="container max-w-4xl mx-auto px-8 sm:px-12 lg:px-16">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-light text-foreground mb-4">Frequently Asked Questions</h2>
        </div>

        <div className="bg-background rounded-lg border border-border/50">
          {faqData.map((item, index) => (
            <div key={index}>
              <button
                className={cn(
                  "flex items-center justify-between w-full p-6 text-left text-lg font-medium hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  index > 0 && "border-t border-border/50",
                )}
                onClick={() => toggleAccordion(index)}
              >
                <span>{item.question}</span>
                <ChevronRight
                  className={cn(
                    "h-6 w-6 shrink-0 transition-transform duration-300 ease-in-out",
                    openIndices.has(index) ? "rotate-90" : "",
                  )}
                />
              </button>
              <div
                className={cn(
                  "overflow-hidden transition-all duration-300 ease-in-out",
                  openIndices.has(index) ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
                )}
              >
                <div className="p-6 pt-0 text-muted-foreground leading-relaxed">{item.answer}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
