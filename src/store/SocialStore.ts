import { create } from "zustand"
import axios from "axios"

interface ValidationFailure {
  propertyName: string
  errorMessage: string
  attemptedValue: string
  customState: string
  severity: number
  errorCode: string
  formattedMessagePlaceholderValues: Record<string, string>
}

interface ProfileData {
  id: string
  isSelf: boolean
  userName: string
  email: string
  isFollowing: boolean
  following: number
  follower: number
  role: number
  firstName: string
  lastName: string
  avatar: string
}

interface SocialState {
  profile: ProfileData | null
  isLoading: boolean
  error: string | null
}

interface SocialActions {
  getProfile: (userId: string) => Promise<void>
  clearError: () => void
}

type SocialStore = SocialState & SocialActions

export const useSocialStore = create<SocialStore>()((set) => ({
  profile: null,
  isLoading: false,
  error: null,

  getProfile: async (userId: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/Social/profile/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      )

      if (response.data.success && response.data.datas.length > 0) {
        set({ profile: response.data.datas[0] })
      } else {
        set({ error: response.data.message || "Failed to fetch profile" })
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch profile",
      })
    } finally {
      set({ isLoading: false })
    }
  },

  clearError: () => {
    set({ error: null })
  },
})) 