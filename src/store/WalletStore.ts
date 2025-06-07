import { create } from "zustand"
import axios from "axios"

export enum TransactionType {
  None = 0,
  Topup = 1,
  Transfer = 2,
  Withdraw = 3
}

export enum PaymentMethod {
  None = 0,
  VnPay = 1
}

export enum TransactionStatus {
  None = 0,
  Pending = 1,
  Success = 2,
  Failed = 3,
  Hold = 4
}

export interface Transaction {
  id: string
  transactionId: string
  amount: number
  description: string
  type: TransactionType
  paymentMethod: PaymentMethod
  status: TransactionStatus
}

interface ValidationFailure {
  propertyName: string
  errorMessage: string
  attemptedValue: unknown
}

interface TransactionResponse {
  pageNumber: number
  pageSize: number
  totalCount: number
  nextPageToken: string | null
  datas: Transaction[]
  success: boolean
  message: string | null
  errors: string[]
  validationFailure: ValidationFailure[] | null
}

interface WalletStore {
  balance: number
  transactions: Transaction[]
  isLoading: boolean
  error: string | null
  getBalance: () => Promise<void>
  getTransactions: (pageNumber: number) => Promise<void>
}

interface ApiResponse {
  datas: number[]
  success: boolean
  message: string | null
  errors: string[]
  validationFailure: ValidationFailure[] | null
}

export const useWalletStore = create<WalletStore>((set) => ({
  balance: 0,
  transactions: [],
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
  },

  getTransactions: async (pageNumber: number) => {
    set({ isLoading: true, error: null })
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get<TransactionResponse>(
        `${import.meta.env.VITE_API_URL}/api/Wallet/paymentTransactions`,
        {
          params: { pageNumber },
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      )

      if (response.data.success) {
        set({ transactions: response.data.datas, isLoading: false })
      } else {
        set({
          error: response.data.message || "Failed to fetch transactions",
          isLoading: false
        })
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch transactions",
        isLoading: false
      })
    }
  }
})) 