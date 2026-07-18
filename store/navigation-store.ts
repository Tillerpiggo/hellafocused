import { create } from "zustand"
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware"
import { isProject, isProjectList, isTaskDescendantOf } from "@/lib/task-utils"

interface NavigationState {
  currentPath: string[]
  navigationContext: string[]
  selectProject: (projectId: string | null) => void
  navigateToTask: (taskId: string) => void
  navigateToPath: (path: string[]) => void
  navigateBack: () => void
  resetNavigation: () => void
}

const NAVIGATION_STORAGE_KEY = "navigation-storage"
const LEGACY_APP_STORAGE_KEY = "app-storage"

function getNavigationStorage(): StateStorage {
  if (typeof window === "undefined") throw new Error("Browser storage is unavailable")

  return {
    getItem: (name) => {
      const savedNavigation = window.localStorage.getItem(name)
      if (savedNavigation !== null) return savedNavigation

      const legacyValue = window.localStorage.getItem(LEGACY_APP_STORAGE_KEY)
      if (!legacyValue) return null

      try {
        const legacy = JSON.parse(legacyValue) as {
          state?: { currentPath?: unknown; navigationContext?: unknown }
        }
        const currentPath = Array.isArray(legacy.state?.currentPath)
          ? legacy.state.currentPath.filter((segment): segment is string => typeof segment === "string")
          : []
        const navigationContext = Array.isArray(legacy.state?.navigationContext)
          ? legacy.state.navigationContext.filter((segment): segment is string => typeof segment === "string")
          : currentPath

        return JSON.stringify({
          state: { currentPath, navigationContext },
          version: 0,
        })
      } catch {
        return null
      }
    },
    setItem: (name, value) => window.localStorage.setItem(name, value),
    removeItem: (name) => window.localStorage.removeItem(name),
  }
}

export const useNavigationStore = create<NavigationState>()(
  persist(
    (set) => ({
      currentPath: [],
      navigationContext: [],

      selectProject: (projectId) => {
        const path = projectId ? [projectId] : []
        set({ currentPath: path, navigationContext: path })
      },

      navigateToTask: (taskId) => set((state) => {
        const path = [...state.currentPath, taskId]
        return { currentPath: path, navigationContext: path }
      }),

      navigateToPath: (path) => set((state) => {
        let navigationContext = state.navigationContext

        if (isProjectList(path)) {
          navigationContext = []
        } else if (isProject(path)) {
          navigationContext = path
        } else if (navigationContext.length > 0 && path[0] !== navigationContext[0]) {
          navigationContext = path
        } else if (!isTaskDescendantOf(navigationContext, path)) {
          navigationContext = path
        }

        return { currentPath: path, navigationContext }
      }),

      navigateBack: () => set((state) => ({
        currentPath: isProjectList(state.currentPath)
          ? []
          : state.currentPath.slice(0, -1),
      })),

      resetNavigation: () => set({ currentPath: [], navigationContext: [] }),
    }),
    {
      name: NAVIGATION_STORAGE_KEY,
      storage: createJSONStorage(getNavigationStorage),
      partialize: (state) => ({
        currentPath: state.currentPath,
        navigationContext: state.navigationContext,
      }),
    }
  )
)
