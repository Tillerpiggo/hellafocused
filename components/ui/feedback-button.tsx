'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { MessageSquare } from 'lucide-react'
import { FeedbackPopup } from './feedback-popup'

interface FeedbackButtonProps {
  variant?: 'default' | 'ghost'
  size?: 'default' | 'sm'
  className?: string
}

export function FeedbackButton({ 
  variant = 'ghost', 
  size = 'sm', 
  className = '' 
}: FeedbackButtonProps) {
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleClick = () => {
    // console.log('Feedback button clicked - current state:', isPopupOpen, 'new state:', !isPopupOpen)
    setIsPopupOpen(!isPopupOpen)
  }

  return (
    <>
      <Button
        ref={buttonRef}
        variant={variant}
        size={size}
        onClick={handleClick}
        className={`text-sm text-muted-foreground hover:text-foreground transition-colors ${className}`}
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        Feedback
      </Button>
      
      <FeedbackPopup
        isOpen={isPopupOpen}
        onClose={() => {
          // console.log('FeedbackPopup onClose called')
          setIsPopupOpen(false)
        }}
        buttonRef={buttonRef}
      />
    </>
  )
} 