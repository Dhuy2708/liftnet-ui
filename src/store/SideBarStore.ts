import { create } from "zustand"
import axios from "axios"

// Define the unread count response type
interface UnreadCountResponse {
  datas: Array<{
    finder: number
    appointment: number
    chat: number
  }>
}

// Define the store state
type SideBarState = {
  unreadCounts: {
    finder: number
    appointment: number
    chat: number
  }
  isLoading: boolean
  error: string | null
}

// Define the store actions
type SideBarActions = {
  fetchUnreadCounts: () => Promise<void>
  clearError: () => void
}

// Combine state and actions
export type SideBarStore = SideBarState & SideBarActions

// Create the store
export const useSideBarStore = create<SideBarStore>((set) => ({
  unreadCounts: {
    finder: 0,
    appointment: 0,
    chat: 0
  },
  isLoading: false,
  error: null,

  fetchUnreadCounts: async () => {
    set({ isLoading: true, error: null })
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get<UnreadCountResponse>(
        `${import.meta.env.VITE_API_URL}/api/SideBar/unreadCount`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (response.status === 200 && response.data.datas && response.data.datas.length > 0) {
        set({ 
          unreadCounts: response.data.datas[0],
          isLoading: false 
        })
      } else {
        set({ 
          error: "No unread count data received", 
          isLoading: false 
        })
      }
    } catch (error) {
      // Ignore errors and do not update state
      // console.error("Failed to fetch unread counts:", error)
      set({ isLoading: false })
    }
  },

  clearError: () => {
    set({ error: null })
  }
})) 