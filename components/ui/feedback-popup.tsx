'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Bug, Lightbulb, Send, CheckCircle, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface FeedbackPopupProps {
  isOpen: boolean
  onClose: () => void
  buttonRef: React.RefObject<HTMLButtonElement | null>
}

type FeedbackStage = 'select' | 'form' | 'success'
type FeedbackType = 'issue' | 'idea'

export function FeedbackPopup({ isOpen, onClose, buttonRef }: FeedbackPopupProps) {
  const [stage, setStage] = useState<FeedbackStage>('select')
  const [feedbackType, setFeedbackType] = useState<FeedbackType | null>(null)
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)

  console.log('FeedbackPopup render - isOpen:', isOpen, 'stage:', stage)

  // Check when popup element is mounted/unmounted
  useEffect(() => {
    if (isOpen && popupRef.current) {
      console.log('Popup element mounted to DOM:', popupRef.current)
      console.log('Popup computed styles:', window.getComputedStyle(popupRef.current))
      console.log('Popup bounding rect:', popupRef.current.getBoundingClientRect())
    }
  }, [isOpen])

  // No position calculation needed - using pure CSS positioning

  // Handle outside click
  useEffect(() => {
    console.log('Outside click effect triggered - isOpen:', isOpen)
    
    const handleClickOutside = (event: MouseEvent) => {
      console.log('Outside click detected - target:', event.target)
      console.log('Popup ref current:', popupRef.current)
      console.log('Button ref current:', buttonRef.current)
      
      if (
        isOpen &&
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        !buttonRef.current?.contains(event.target as Node)
      ) {
        console.log('Calling onClose due to outside click')
        onClose()
      } else {
        console.log('Outside click ignored')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    console.log('Added mousedown listener')
    
    return () => {
      console.log('Removing mousedown listener')
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose, buttonRef])

  // Reset stage when popup closes
  useEffect(() => {
    if (!isOpen) {
      // Reset after animation completes
      setTimeout(() => {
        setStage('select')
        setFeedbackType(null)
        setFeedback('')
        setIsSubmitting(false)
      }, 200)
    }
  }, [isOpen])

  const handleTypeSelect = (type: FeedbackType) => {
    setFeedbackType(type)
    setStage('form')
  }

  const handleSubmit = async () => {
    if (!feedback.trim() || !feedbackType) return

    setIsSubmitting(true)
    
    try {
      // Get current user for email if available
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error } = await supabase.from('feedback').insert({
        type: feedbackType,
        message: feedback.trim(),
        user_email: user?.email || null,
        user_id: user?.id || null,
      })

      if (error) {
        console.error('Error submitting feedback:', error)
        // For now, just show success anyway since the user can't do anything about it
      }

      setStage('success')
    } catch (error) {
      console.error('Error submitting feedback:', error)
      setStage('success') // Show success anyway
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBack = () => {
    setStage('select')
    setFeedbackType(null)
  }

  if (!isOpen) {
    console.log('Popup not rendering - isOpen is false')
    return null
  }

  console.log('Popup rendering in top-right corner')
  console.log('Popup element will be rendered to DOM')

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
        {stage === 'select' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">What would you like to share?</h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={onClose}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start h-auto p-3 text-left"
                onClick={() => handleTypeSelect('issue')}
              >
                <Bug className="h-4 w-4 mr-3 text-red-500" />
                <div>
                  <div className="font-medium">Issue</div>
                  <div className="text-xs text-muted-foreground">Report a bug or problem</div>
                </div>
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start h-auto p-3 text-left"
                onClick={() => handleTypeSelect('idea')}
              >
                <Lightbulb className="h-4 w-4 mr-3 text-yellow-500" />
                <div>
                  <div className="font-medium">Idea</div>
                  <div className="text-xs text-muted-foreground">Suggest an improvement</div>
                </div>
              </Button>
            </div>
          </div>
        )}

        {stage === 'form' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs px-0"
                onClick={handleBack}
              >
                ←  Back
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={onClose}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              {feedbackType === 'issue' ? (
                <Bug className="h-4 w-4 text-red-500" />
              ) : (
                <Lightbulb className="h-4 w-4 text-yellow-500" />
              )}
              <h3 className="text-sm font-medium">
                {feedbackType === 'issue' ? 'Report Issue' : 'Share Idea'}
              </h3>
            </div>
            
            <Textarea
              placeholder={
                feedbackType === 'issue'
                  ? 'Describe the issue you encountered...'
                  : 'Tell us about your idea...'
              }
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[80px] resize-none text-sm"
              autoFocus
            />
            
            <Button
              onClick={handleSubmit}
              disabled={!feedback.trim() || isSubmitting}
              className="w-full"
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
          <div className="space-y-4 text-center">
            <div className="flex items-center justify-end">
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={onClose}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="space-y-2">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <h3 className="text-sm font-medium">Thank you!</h3>
              <p className="text-xs text-muted-foreground">
                Feedback like yours helps us improve.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 