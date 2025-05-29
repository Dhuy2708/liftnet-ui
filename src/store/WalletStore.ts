import { create } from "zustand"
import axios from "axios"

interface WalletStore {
  balance: number
  isLoading: boolean
  error: string | null
  getBalance: () => Promise<void>
}

interface ApiResponse {
  datas: number[]
  success: boolean
  message: string | null
  errors: string[]
  validationFailure: any
}

export const useWalletStore = create<WalletStore>((set) => ({
  balance: 0,
  isLoading: false,
  error: null,

  getBalance: async () => {
    set({ isLoading: true, error: null })
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get<ApiResponse>(
        `${import.meta.env.VITE_API_URL}/api/Wallet/getBalance`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      )

      if (response.data.success && response.data.datas.length > 0) {
        set({ balance: response.data.datas[0], isLoading: false })
      } else {
        set({
          error: response.data.message || "Failed to fetch balance",
          isLoading: false
        })
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch balance",
        isLoading: false
      })
    }
  }
})) 