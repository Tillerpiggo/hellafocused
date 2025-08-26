# Task Description Field Refactor Plan

## Overview
Transform the description from a toggle-based editor (activated by pencil button) to an always-visible textarea below the task title, styled like the mockup when the details panel is NOT active.

## Detailed Implementation Plan

### 1. Create New Component: `TaskDescriptionField.tsx`
**Location**: `/components/task/task-description-field.tsx`

**Purpose**: Simple, always-visible description field without toggle logic

**Key Features**:
- Auto-save on blur (when user clicks away)
- No cancel functionality (changes persist automatically)
- Styled to match mockup's non-expanded state

**Functions to implement**:
```typescript
// Component props
interface TaskDescriptionFieldProps {
  description?: string
  onDescriptionChange: (newDescription: string) => void
  placeholder?: string // default: "Add a description..."
}

// Main component
function TaskDescriptionField({ description, onDescriptionChange, placeholder }):
  - useState(description) for local value
  - useEffect to sync when description prop changes
  - handleBlur(): call onDescriptionChange(value.trim())
  - handleKeyDown(): Save on Cmd/Ctrl+Enter (optional enhancement)
  - render: simple div with Textarea, no container styling
```

### 2. Modify `TaskPageHeader.tsx`
**File**: `/components/task/task-page-header.tsx`

**Remove**:
- Line 46: `showDescriptionEditor` state
- Line 47: `descriptionEditorRef` ref
- Lines 53-62: `handleDetailsClick()` function (or simplify to just logging)
- Lines 68-73: `handleDescriptionSave()` function
- Lines 75-78: `handleDescriptionCancel()` function
- Lines 91-103: Edit2/pencil button from iconButtons
- Lines 165-175: Conditional rendering of TaskDescriptionEditor

**Keep**:
- `description` and `onDescriptionChange` props
- Search and Calendar buttons in iconButtons

**Add**:
- Import the new `TaskDescriptionField` component
- Render `TaskDescriptionField` directly after `</PageHeader>` (always visible)

### 3. Style the TaskDescriptionField Component
Based on mockup analysis (minimalist-task-view.tsx lines 228-234), the styling should be:

**Textarea styling**:
```css
w-full                          /* full width */
bg-transparent                  /* transparent background */
border-0                        /* no border */
p-0                            /* no padding */
resize-none                     /* no resize handle */
text-muted-foreground          /* secondary text color */
placeholder:text-muted-foreground/50  /* faded placeholder */
min-h-[60px]                   /* slightly smaller than current 80px */
rounded-none                   /* no rounding */
focus:ring-0 focus:outline-none /* no focus indicators */
```

**Wrapper div**:
- `mt-3` (small margin top to separate from title)
- No background gradients or borders (clean, minimal look)

### 4. Update app/app/page.tsx
**File**: `/app/app/page.tsx`

**Remove all console.log statements** added for debugging:
- Line 98: Remove `console.log('Page: currentTask description:', currentTask?.description)`
- Lines 184-186: Remove console.logs in `handleDescriptionChange`

### 5. Clean up store/app-store.ts
**File**: `/store/app-store.ts`

**Remove debugging console.logs** from `updateTaskDescription`:
- Lines 324-338: Remove all console.log statements
- Keep the actual logic intact

### 6. Clean up or remove components/task/task-description-editor.tsx
**Options**:
1. Delete the file entirely (recommended if not needed elsewhere)
2. Keep for potential future use but remove console.log statements (lines 34, 43)

## Implementation Code Templates

### TaskDescriptionField Component (New File)
```typescript
"use client"

import { useState, useEffect, useRef } from "react"
import { Textarea } from "@/components/ui/textarea"

interface TaskDescriptionFieldProps {
  description?: string
  onDescriptionChange: (newDescription: string) => void
  placeholder?: string
}

export function TaskDescriptionField({
  description = "",
  onDescriptionChange,
  placeholder = "Add a description..."
}: TaskDescriptionFieldProps) {
  const [value, setValue] = useState(description)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Sync with prop changes
  useEffect(() => {
    setValue(description)
  }, [description])

  const handleBlur = () => {
    const trimmed = value.trim()
    if (trimmed !== description) {
      onDescriptionChange(trimmed)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleBlur()
      textareaRef.current?.blur()
    }
  }

  return (
    <div className="mt-3">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full bg-transparent border-0 p-0 resize-none text-muted-foreground placeholder:text-muted-foreground/50 min-h-[60px] rounded-none focus:ring-0 focus:outline-none"
        style={{
          outline: 'none !important',
          border: 'none !important',
          boxShadow: 'none !important',
        }}
      />
    </div>
  )
}
```

### Modified TaskPageHeader (Key Changes)
```typescript
import { PageHeader } from "@/components/page/page-header"
import { TaskOptionsMenu } from "./task-options-menu"
import { TaskDescriptionField } from "./task-description-field"  // NEW IMPORT
import { Button } from "@/components/ui/button"
import { Check, X, Search, Calendar } from "lucide-react"  // REMOVED Edit2
import { forwardRef } from "react"  // REMOVED useState, useRef
// ... rest of imports

export const TaskPageHeader = forwardRef<EditableTitleRef, TaskPageHeaderProps>(({
  // ... props
}, ref) => {
  // REMOVED: showDescriptionEditor state and ref
  
  const handleSearchClick = () => {
    console.log("Search subtasks - coming soon")
  }

  const handleDueDateClick = () => {
    console.log("Set due date - coming soon")
  }

  // REMOVED: handleDetailsClick, handleDescriptionSave, handleDescriptionCancel

  const iconButtons = (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleSearchClick}
        className="h-8 w-8 rounded-full opacity-60 hover:opacity-100 transition-opacity"
        title="Search subtasks"
      >
        <Search className="h-4 w-4" />
      </Button>
      {/* REMOVED: Edit2 button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDueDateClick}
        className="h-8 w-8 rounded-full opacity-60 hover:opacity-100 transition-opacity"
        title="Set due date"
      >
        <Calendar className="h-4 w-4" />
      </Button>
    </div>
  )

  // ... actionButtons stays the same

  return (
    <>
      <PageHeader
        ref={ref}
        title={title}
        onTitleChange={onTitleChange}
        isCompleted={isCompleted}
        iconButtons={iconButtons}
        optionsMenu={/* ... */}
        actionButtons={actionButtons}
      />
      <TaskDescriptionField
        description={description}
        onDescriptionChange={onDescriptionChange}
      />
      {/* REMOVED: Conditional TaskDescriptionEditor */}
    </>
  )
})
```

## Expected Result
- Description field always visible below task title
- Clean, minimal appearance matching the mockup
- Auto-saves when user clicks away (blur event)
- No toggle/edit button needed
- Simpler code with fewer state variables and handlers
- Better UX with immediate visibility of description content