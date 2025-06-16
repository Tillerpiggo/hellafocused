"use client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface TaskCompletionDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  taskName: string
  subtaskCount: number
}

export function TaskCompletionDialog({
  isOpen,
  onClose,
  onConfirm,
  taskName,
  subtaskCount,
}: TaskCompletionDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete Task with Subtasks?</DialogTitle>
          <DialogDescription>
            "{taskName}" has {subtaskCount} incomplete subtask{subtaskCount !== 1 ? "s" : ""}. Completing this task will
            also mark all its subtasks as complete.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm} className="bg-green-600 hover:bg-green-700 text-white">
            Complete Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
