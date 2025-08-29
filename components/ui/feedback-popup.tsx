'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { triggerConfetti } from '@/lib/confetti'

interface FeedbackPopupProps {
  isOpen: boolean
  onClose: () => void
  buttonRef: React.RefObject<HTMLButtonElement | null>
}

type FeedbackStage = 'form' | 'success'

export function FeedbackPopup({ isOpen, onClose, buttonRef }: FeedbackPopupProps) {
  const [stage, setStage] = useState<FeedbackStage>('form')
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)

  // console.log('FeedbackPopup render - isOpen:', isOpen, 'stage:', stage)

  // Check when popup element is mounted/unmounted
  useEffect(() => {
    if (isOpen && popupRef.current) {
      // console.log('Popup element mounted to DOM:', popupRef.current)
      // console.log('Popup computed styles:', window.getComputedStyle(popupRef.current))
      // console.log('Popup bounding rect:', popupRef.current.getBoundingClientRect())
    }
  }, [isOpen])

  // No position calculation needed - using pure CSS positioning

  // Handle outside click
  useEffect(() => {
    // console.log('Outside click effect triggered - isOpen:', isOpen)
    
    const handleClickOutside = (event: MouseEvent) => {
      // console.log('Outside click detected - target:', event.target)
      // console.log('Popup ref current:', popupRef.current)
      // console.log('Button ref current:', buttonRef.current)
      
      if (
        isOpen &&
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        !buttonRef.current?.contains(event.target as Node)
      ) {
        // console.log('Calling onClose due to outside click')
        onClose()
      } else {
        // console.log('Outside click ignored')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    // console.log('Added mousedown listener')
    
    return () => {
      // console.log('Removing mousedown listener')
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose, buttonRef])

  // Reset stage when popup closes
  useEffect(() => {
    if (!isOpen) {
      // Reset after animation completes
      setTimeout(() => {
        setStage('form')
        setFeedback('')
        setIsSubmitting(false)
      }, 200)
    }
  }, [isOpen])

  const handleSubmit = async () => {
    if (!feedback.trim()) return

    setIsSubmitting(true)
    
    try {
      // Get current user for email if available
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error } = await supabase.from('feedback').insert({
        type: 'issue',
        message: feedback.trim(),
        user_email: user?.email || null,
        user_id: user?.id || null,
      })

      if (error) {
        console.error('Error submitting feedback:', error)
        // For now, just show success anyway since the user can't do anything about it
      }

      setStage('success')
      triggerConfetti()
    } catch (error) {
      console.error('Error submitting feedback:', error)
      setStage('success') // Show success anyway
      triggerConfetti()
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) {
    // console.log('Popup not rendering - isOpen is false')
    return null
  }

  // console.log('Popup rendering in top-right corner')
  // console.log('Popup element will be rendered to DOM')

  return (
    <div
      ref={popupRef}
      className="fixed z-50 w-80 bg-popover border border-border rounded-lg shadow-lg"
      style={{
        top: '70px',
        right: '20px'
      }}
      onMouseDown={(e) => {
        console.log('Popup mousedown event')
        e.stopPropagation()
      }}
    >
      <div className="p-4">
        {stage === 'form' && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Feedback</h3>
            <Textarea
              placeholder="Share anything - bugs, ideas, or just thoughts..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  if (feedback.trim()) {
                    handleSubmit()
                  }
                }
              }}
              className="min-h-[80px] resize-none text-sm"
              autoFocus
            />
            
            <Button
              onClick={handleSubmit}
              disabled={!feedback.trim() || isSubmitting}
              className="w-full"
              size="sm"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Feedback
                </>
              )}
            </Button>
          </div>
        )}

        {stage === 'success' && (
          <div className="space-y-3 text-center py-2">
            <div className="space-y-2">
              <div className="relative">
                <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto animate-in zoom-in-50 fade-in duration-300" />
                <div className="absolute inset-0 h-10 w-10 bg-emerald-500/20 rounded-full mx-auto animate-ping" />
              </div>
              <div className="space-y-1 animate-in slide-in-from-bottom-2 fade-in duration-300 delay-150">
                <h3 className="text-sm font-medium">Thank you, I really appreciate it!</h3>
                <p className="text-xs text-muted-foreground">
                  Your feedback is super helpful as I build hellafocused.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 