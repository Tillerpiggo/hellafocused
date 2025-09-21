'use client'

import React from 'react'

interface TasksViewProps {
  children: React.ReactNode
}

export function TasksView({ children }: TasksViewProps) {
  return (
    <div className="container max-w-4xl mx-auto py-12 px-6">
      {children}
    </div>
  )
}