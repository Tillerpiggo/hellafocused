import type { ProjectData } from "./types"

export const initialProjectsData: ProjectData[] = [
  {
    id: "proj-1",
    name: "HellaFocused App Features",
    tasks: [
      {
        id: "task-1-1",
        name: "Core UI Components",
        completed: false,
        subtasks: [
          { id: "task-1-1-1", name: "Task Item Card", completed: false, subtasks: [] },
          { id: "task-1-1-2", name: "Project View Layout", completed: false, subtasks: [] },
          { id: "task-1-1-3", name: "Recursive Subtask Display", completed: false, subtasks: [] },
        ],
      },
      {
        id: "task-1-2",
        name: "Focus Mode Implementation",
        completed: false,
        subtasks: [
          { id: "task-1-2-1", name: "Leaf Node Identification Logic", completed: false, subtasks: [] },
          { id: "task-1-2-2", name: "Random Task Selector UI", completed: false, subtasks: [] },
          { id: "task-1-2-3", name: "Focus Mode Theme Styling", completed: false, subtasks: [] },
        ],
      },
      { id: "task-1-3", name: "Setup Red Theme & Dark Mode", completed: true, subtasks: [] },
    ],
  },
  {
    id: "proj-2",
    name: "Weekend Chores",
    tasks: [
      {
        id: "task-2-1",
        name: "Grocery Shopping",
        completed: false,
        subtasks: [
          { id: "task-2-1-1", name: "Buy milk", completed: false, subtasks: [] },
          { id: "task-2-1-2", name: "Buy eggs", completed: false, subtasks: [] },
        ],
      },
      { id: "task-2-2", name: "Clean the house", completed: false, subtasks: [] },
      { id: "task-2-3", name: "Mow the lawn", completed: false, subtasks: [] },
    ],
  },
  {
    id: "proj-3",
    name: "Learn Next.js",
    tasks: [
      { id: "task-3-1", name: "App Router Basics", completed: false, subtasks: [] },
      { id: "task-3-2", name: "Server Components", completed: false, subtasks: [] },
      { id: "task-3-3", name: "Client Components", completed: false, subtasks: [] },
    ],
  },
]
