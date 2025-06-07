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

interface PlanningState {
  physicalStats: PhysicalStats | null
  isLoading: boolean
  error: string | null
  isSaving: boolean
}

interface PlanningActions {
  fetchPhysicalStats: () => Promise<void>
  setPhysicalStats: (stats: PhysicalStats) => Promise<void>
}

type PlanningStore = PlanningState & PlanningActions

export const usePlanningStore = create<PlanningStore>((set) => ({
  physicalStats: null,
  isLoading: false,
  error: null,
  isSaving: false,

  fetchPhysicalStats: async () => {
    set({ isLoading: true, error: null })
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
      set({ isLoading: false })
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
})) 