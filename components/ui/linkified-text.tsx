"use client"

import Linkify from 'linkify-react'
import { cn } from '@/lib/utils'

interface LinkifiedTextProps {
  text: string
  className?: string
}

export function LinkifiedText({ text, className }: LinkifiedTextProps) {
  return (
    <Linkify
      options={{
        attributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
        className: cn(
          'text-pink-600 dark:text-pink-400 underline decoration-pink-300 dark:decoration-pink-600',
          'hover:text-pink-700 dark:hover:text-pink-300 transition-colors',
        ),
        validate: {
          url: (value) => /^https?:\/\//.test(value) || /^www\./.test(value),
        },
        defaultProtocol: 'https',
      }}
    >
      <span className={className}>{text}</span>
    </Linkify>
  )
}