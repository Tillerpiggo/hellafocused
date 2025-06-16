"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAppStore } from "@/store/app-store"
import { Plus, X } from "lucide-react"

interface BreakIntoSubtasksModalProps {
  isOpen: boolean
  onClose: () => void
  taskName: string
}

export function BreakIntoSubtasksModal({ isOpen, onClose, taskName }: BreakIntoSubtasksModalProps) {
  const [subtasks, setSubtasks] = useState<string[]>([])
  const [newSubtaskName, setNewSubtaskName] = useState("")
  const { breakTaskIntoSubtasks } = useAppStore()

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setSubtasks([])
      setNewSubtaskName("")
    }
  }, [isOpen])

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault()
    if (newSubtaskName.trim()) {
      setSubtasks([...subtasks, newSubtaskName.trim()])
      setNewSubtaskName("")
    }
  }

  const handleRemoveSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index))
  }

  const handleConfirm = () => {
    if (subtasks.length > 0) {
      breakTaskIntoSubtasks(subtasks)
      onClose()
    }
  }

  const handleCancel = () => {
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Break into Subtasks</DialogTitle>
        </DialogHeader>

        {/* Current Task */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">Breaking down:</div>
          <div className="font-medium">{taskName}</div>
        </div>

        {/* Add Subtask Form */}
        <form onSubmit={handleAddSubtask} className="flex gap-2">
          <Input
            value={newSubtaskName}
            onChange={(e) => setNewSubtaskName(e.target.value)}
            placeholder="Add a subtask..."
            className="flex-1"
          />
          <Button type="submit" size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </form>

        {/* Subtasks List */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {subtasks.length > 0 ? (
            subtasks.map((subtask, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                <div className="flex-1">{subtask}</div>
                <Button variant="ghost" size="sm" onClick={() => handleRemoveSubtask(index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-8">Add subtasks above to break down this task</div>
          )}
        </div>

        <div className="flex justify-between pt-3 border-t">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={subtasks.length === 0}>
            Break into {subtasks.length} subtask{subtasks.length !== 1 ? "s" : ""}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
