import { create } from "zustand"
import axios from "axios"

interface Address {
  placeName: string
  shortPlaceName: string
  lat: number
  lng: number
  placeId: string
}

interface AddressResponse {
  datas: Address[] | null
  success: boolean
  message: string | null
  errors: string[]
  validationFailure: null | Array<{
    propertyName: string
    errorMessage: string
    attemptedValue: string
    customState: string
    severity: number
    errorCode: string
    formattedMessagePlaceholderValues: Record<string, string>
  }>
}

type UploadAvatarResponse = {
  success: boolean
  message: string
  errors?: string[]
  datas?: unknown
}

type ProfileState = {
  address: Address | null
  isLoading: boolean
  error: string | null
}

type ProfileActions = {
  fetchAddress: () => Promise<boolean>
  clearError: () => void
}

type ProfileStore = ProfileState & ProfileActions & {
  uploadAvatar: (file: File) => Promise<boolean>
}

export const useProfileStore = create<ProfileStore>((set) => ({
  address: null,
  isLoading: false,
  error: null,

  fetchAddress: async () => {
    set({ isLoading: true, error: null })
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get<AddressResponse>(
        `${import.meta.env.VITE_API_URL}/api/Profile/address`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (response.data.success) {
        if (response.data.datas && response.data.datas.length > 0) {
          set({ address: response.data.datas[0], isLoading: false })
          return true
        } else {
          set({ address: null, isLoading: false })
          return false
        }
      } else {
        set({ 
          error: response.data.message || "Failed to fetch address", 
          isLoading: false 
        })
        return false
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch address",
        isLoading: false,
      })
      return false
    }
  },

  clearError: () => {
    set({ error: null })
  },

  uploadAvatar: async (file: File) => {
    try {
      const token = localStorage.getItem("token")
      const formData = new FormData()
      formData.append("Image", file)
      const response = await axios.post<UploadAvatarResponse>(
        `${import.meta.env.VITE_API_URL}/api/Profile/upload/avatar`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "accept": "application/json",
            "Content-Type": "multipart/form-data"
          },
        }
      )
      return response.data.success
    } catch {
      return false
    }
  },
})) 