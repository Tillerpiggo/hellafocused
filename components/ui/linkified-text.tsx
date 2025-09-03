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
          'text-link dark:text-link underline decoration-link-decoration dark:decoration-link-decoration',
          'hover:text-link-hover dark:hover:text-link-hover transition-colors',
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