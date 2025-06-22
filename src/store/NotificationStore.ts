import { create } from "zustand"
import axios from "axios"

interface Notification {
  id: number
  recieverId: string
  senderName: string
  senderType: number
  senderAvatar: string
  recieverType: number
  title: string
  eventType: number
  body: string
  createdAt: string
  location: number
}

interface NotificationResponse {
  pageNumber: number
  pageSize: number
  totalCount: number
  nextPageToken: string | null
  datas: Notification[]
  success: boolean
  message: string | null
  errors: string[]
  validationFailure: unknown
}

interface NotificationStore {
  notifications: Notification[]
  pageNumber: number
  pageSize: number
  totalCount: number
  isLoading: boolean
  error: string | null
  hasMore: boolean
  fetchNotifications: (pageNumber: number, pageSize: number) => Promise<void>
  clearNotifications: () => void
  addNotification: (notification: Notification) => void
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  pageNumber: 1,
  pageSize: 10,
  totalCount: 0,
  isLoading: false,
  error: null,
  hasMore: true,

  fetchNotifications: async (pageNumber: number, pageSize: number) => {
    try {
      set({ isLoading: true, error: null })
      const token = localStorage.getItem("token")
      const response = await axios.get<NotificationResponse>(
        `${import.meta.env.VITE_API_URL}/api/Notification/list`,
        {
          params: {
            pageNumber,
            pageSize
          },
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      )

      const { datas, totalCount } = response.data
      
      set((state) => ({
        notifications: pageNumber === 1 ? datas : [...state.notifications, ...datas],
        pageNumber,
        pageSize,
        totalCount,
        hasMore: state.notifications.length + datas.length < totalCount,
        isLoading: false
      }))
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : "Failed to fetch notifications",
        isLoading: false 
      })
    }
  },

  clearNotifications: () => {
    set({
      notifications: [],
      pageNumber: 1,
      totalCount: 0,
      hasMore: true,
      error: null
    })
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
    }))
  },
})) 