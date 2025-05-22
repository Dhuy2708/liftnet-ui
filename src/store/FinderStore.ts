import { create } from "zustand"
import axios from "axios"

export interface FinderPoster {
  id: string
  email: string
  username: string
  firstName: string
  lastName: string
  role: number
  avatar: string
  isDeleted: boolean
  isSuspended: boolean
  isFollowing: boolean
}

export interface FinderPost {
  id: string
  poster: FinderPoster
  title: string
  description: string
  startTime: string
  endTime: string
  startPrice: number
  endPrice: number
  lat: number
  lng: number
  hideAddress: boolean
  repeatType: number
  status: number
  createdAt: string
}

interface FinderStoreState {
  posts: FinderPost[]
  isLoading: boolean
  error: string | null
  pageNumber: number
  pageSize: number
  totalCount: number
  fetchFinders: (params: {
    status?: string
    search?: string
    pageNumber?: number
    pageSize?: number
  }) => Promise<void>
}

export const useFinderStore = create<FinderStoreState>((set) => ({
  posts: [],
  isLoading: false,
  error: null,
  pageNumber: 1,
  pageSize: 10,
  totalCount: 0,
  fetchFinders: async ({ status = "1", search = "", pageNumber = 1, pageSize = 10 }) => {
    set({ isLoading: true, error: null })
    try {
      const body = {
        conditionItems: [
          {
            property: "status",
            operator: 1,
            values: [status],
            type: 0
          }
        ],
        search: search || null,
        pageNumber,
        pageSize
      }
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/Finder/list`, body, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      })
      set({
        posts: res.data.datas || [],
        pageNumber: res.data.pageNumber,
        pageSize: res.data.pageSize,
        totalCount: res.data.totalCount,
        isLoading: false,
        error: null
      })
    } catch (err: any) {
      set({ isLoading: false, error: err?.message || "Failed to fetch finders" })
    }
  }
})) 