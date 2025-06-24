import { create } from "zustand"
import axios from "axios"

interface PhysicalStats {
  age: number | null
  gender: string | null
  height: number | null
  mass: number | null
  bdf: number | null
  activityLevel: string | null
  goal: string | null
}

export interface Exercise {
  id: string
  order: number | null
  bodyPart: string
  equipment: string
  gifUrl: string
  name: string
  target: string
  secondaryMuscles: string[]
  instructions: string[]
  category: string
  difficulty: string
  description: string
}

interface PlanningDay {
  id: number
  dayOfWeek: number
  exercises: Exercise[]
}

interface PlanningListResponse {
  pageNumber: number
  pageSize: number
  totalCount: number
  nextPageToken: string | null
  datas: PlanningDay[]
  success: boolean
  message: string | null
  errors: string[]
  validationFailure: unknown
}

interface ExerciseListResponse {
  pageNumber: number
  pageSize: number
  totalCount: number
  nextPageToken: string | null
  datas: Exercise[][]
  success: boolean
  message: string | null
  errors: string[]
  validationFailure: unknown
}

export interface PlanningState {
  physicalStats: PhysicalStats | null
  planningList: PlanningDay[] | null
  exerciseList: Exercise[] | null
  loading: boolean
  error: string | null
  isSaving: boolean
  exerciseLoading: boolean
  exerciseError: string | null
}

interface PlanningActions {
  fetchPhysicalStats: () => Promise<void>
  setPhysicalStats: (stats: PhysicalStats) => Promise<void>
  fetchPlanningList: () => Promise<void>
  fetchExerciseList: (search?: string | null, pageNumber?: number, pageSize?: number) => Promise<void>
  addExerciseToDay: (dayOfWeek: number, exerciseId: string) => Promise<void>
  removeExerciseFromDay: (dayOfWeek: number, order: number, exerciseId: string) => Promise<void>
  reorderExercise: (sourceDayOfWeek: number, sourceOrder: number, targetDayOfWeek: number, targetOrder: number, exerciseId: string) => Promise<void>
}

type PlanningStore = PlanningState & PlanningActions

export const usePlanningStore = create<PlanningStore>((set) => ({
  physicalStats: null,
  planningList: null,
  exerciseList: null,
  loading: false,
  error: null,
  isSaving: false,
  exerciseLoading: false,
  exerciseError: null,

  fetchPhysicalStats: async () => {
    set({ loading: true, error: null })
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/Planning/getPhysicalStat`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      )

      if (response.data.success && response.data.datas && response.data.datas.length > 0) {
        set({ physicalStats: response.data.datas[0] })
      } else {
        set({ physicalStats: null })
      }
    } catch (error) {
      set({ error: "Failed to fetch physical stats" })
      console.error("Error fetching physical stats:", error)
    } finally {
      set({ loading: false })
    }
  },

  setPhysicalStats: async (stats: PhysicalStats) => {
    set({ isSaving: true, error: null })
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/Planning/setPhysicalStat`,
        stats,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      )

      if (response.data.success) {
        set({ physicalStats: stats })
      } else {
        set({ error: "Failed to save physical stats" })
      }
    } catch (error) {
      set({ error: "Failed to save physical stats" })
      console.error("Error saving physical stats:", error)
    } finally {
      set({ isSaving: false })
    }
  },

  fetchPlanningList: async () => {
    set({ loading: true, error: null })
    try {
      const response = await axios.get<PlanningListResponse>(
        `${import.meta.env.VITE_API_URL}/api/Planning/list`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      )

      if (response.data.success && response.data.datas) {
        set({ planningList: response.data.datas })
      } else {
        set({ planningList: null })
      }
    } catch (error) {
      set({ error: "Failed to fetch planning list" })
      console.error("Error fetching planning list:", error)
    } finally {
      set({ loading: false })
    }
  },

  fetchExerciseList: async (search = "", pageNumber = 1, pageSize = 10) => {
    set({ exerciseLoading: true, exerciseError: null })
    try {
      const response = await axios.get<ExerciseListResponse>(
        `${import.meta.env.VITE_API_URL}/api/Planning/exercise/list`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          params: {
            search,
            pageNumber,
            pageSize,
          },
        }
      )

      if (response.data.success && response.data.datas && response.data.datas.length > 0) {
        // Flatten the nested array structure
        const exercises = response.data.datas.flat()
        set({ exerciseList: exercises })
      } else {
        set({ exerciseList: [] })
      }
    } catch (error) {
      set({ exerciseError: "Failed to fetch exercise list" })
      console.error("Error fetching exercise list:", error)
    } finally {
      set({ exerciseLoading: false })
    }
  },

  addExerciseToDay: async (dayOfWeek: number, exerciseId: string) => {
    set({ isSaving: true, error: null })
    try {
      // Get userId from localStorage or basicInfo
      const basicInfo = localStorage.getItem("basicInfo")
      let userId = ""
      if (basicInfo) {
        try {
          const parsed = JSON.parse(basicInfo)
          userId = parsed.id || ""
        } catch {
          console.error("Failed to parse basicInfo")
        }
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/Planning/exercise/add`,
        { 
          userId, 
          dayOfWeek, 
          exerciseId 
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      )

      if (response.data.success) {
        // Refresh the planning list to get updated data
        const planningResponse = await axios.get<PlanningListResponse>(
          `${import.meta.env.VITE_API_URL}/api/Planning/list`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        )
        
        if (planningResponse.data.success && planningResponse.data.datas) {
          set({ planningList: planningResponse.data.datas })
        }
      } else {
        set({ error: "Failed to add exercise to day" })
      }
    } catch (error) {
      set({ error: "Failed to add exercise to day" })
      console.error("Error adding exercise to day:", error)
    } finally {
      set({ isSaving: false })
    }
  },

  removeExerciseFromDay: async (dayOfWeek: number, order: number, exerciseId: string) => {
    set({ isSaving: true, error: null })
    try {
      // Get userId from localStorage or basicInfo
      const basicInfo = localStorage.getItem("basicInfo")
      let userId = ""
      if (basicInfo) {
        try {
          const parsed = JSON.parse(basicInfo)
          userId = parsed.id || ""
        } catch {
          console.error("Failed to parse basicInfo")
        }
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/Planning/exercise/remove`,
        { 
          userId, 
          dayOfWeek, 
          order, 
          exerciseId 
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      )

      if (response.data.success) {
        // Refresh the planning list to get updated data
        const planningResponse = await axios.get<PlanningListResponse>(
          `${import.meta.env.VITE_API_URL}/api/Planning/list`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        )
        
        if (planningResponse.data.success && planningResponse.data.datas) {
          set({ planningList: planningResponse.data.datas })
        }
      } else {
        set({ error: "Failed to remove exercise from day" })
      }
    } catch (error) {
      set({ error: "Failed to remove exercise from day" })
      console.error("Error removing exercise from day:", error)
    } finally {
      set({ isSaving: false })
    }
  },

  reorderExercise: async (sourceDayOfWeek: number, sourceOrder: number, targetDayOfWeek: number, targetOrder: number, exerciseId: string) => {
    set({ isSaving: true, error: null })
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/Planning/exercise/reorder`,
        { 
          sourceDayOfWeek, 
          sourceOrder, 
          targetDayOfWeek, 
          targetOrder, 
          exerciseId 
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      )

      if (response.data.success) {
        // Refresh the planning list to get updated data
        const planningResponse = await axios.get<PlanningListResponse>(
          `${import.meta.env.VITE_API_URL}/api/Planning/list`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        )
        
        if (planningResponse.data.success && planningResponse.data.datas) {
          set({ planningList: planningResponse.data.datas })
        }
      } else {
        set({ error: "Failed to reorder exercise" })
      }
    } catch (error) {
      set({ error: "Failed to reorder exercise" })
      console.error("Error reordering exercise:", error)
    } finally {
      set({ isSaving: false })
    }
  },
})) 