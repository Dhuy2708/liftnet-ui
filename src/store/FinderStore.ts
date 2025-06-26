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
  poster: FinderPoster | null
  title: string
  description: string
  startTime: string
  endTime: string
  startPrice: number
  endPrice: number
  lat: number | null
  lng: number | null
  placeName: string | null
  distanceAway: number
  hideAddress: boolean
  repeatType: number
  status: number // 0: None, 1: Open, 2: Closed
  applyingStatus: number // 0: None, 1: Applying, 2: Canceled
  createdAt: string
  isAnonymous: boolean
  notiCount: number
}

export interface FinderApplicant {
  id: number
  postId: string
  trainer: FinderPoster
  message: string
  cancelReason: string | null
  status: number
  createdAt: string
  modifiedAt: string
}

export interface SeekerRecommendation {
  seeker: FinderPoster
  description: string
  recommendedAt: string
}

interface FinderStoreState {
  posts: FinderPost[]
  applicants: FinderApplicant[]
  seekerRecommendations: SeekerRecommendation[]
  isLoading: boolean
  isLoadingApplicants: boolean
  isLoadingRecommendations: boolean
  error: string | null
  pageNumber: number
  pageSize: number
  totalCount: number
  hasMore: boolean
  fetchFinders: (params: {
    status?: string
    search?: string
    pageNumber?: number
    pageSize?: number
  }) => Promise<void>
  fetchApplicants: (postId: string) => Promise<void>
  fetchExplorePosts: (maxDistance: number, pageNumber?: number) => Promise<void>
  fetchAppliedPosts: (pageNumber?: number) => Promise<void>
  fetchSeekerRecommendations: () => Promise<void>
  applyToPost: (postId: string, message: string) => Promise<boolean>
  respondToApplicant: (applicantId: number, status: number, postId: string) => Promise<boolean>
}

export const useFinderStore = create<FinderStoreState>((set, get) => ({
  posts: [],
  applicants: [],
  seekerRecommendations: [],
  isLoading: false,
  isLoadingApplicants: false,
  isLoadingRecommendations: false,
  error: null,
  pageNumber: 1,
  pageSize: 10,
  totalCount: 0,
  hasMore: true,
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch finders"
      set({ isLoading: false, error: errorMessage })
    }
  },
  fetchApplicants: async (postId: string) => {
    set({ isLoadingApplicants: true, error: null })
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/Finder/applicants/${postId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      })
      if (res.data.success) {
        set({
          applicants: res.data.datas || [],
          isLoadingApplicants: false,
          error: null
        })
      } else {
        set({
          isLoadingApplicants: false,
          error: res.data.message || "Failed to fetch applicants"
        })
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch applicants"
      set({ 
        isLoadingApplicants: false, 
        error: errorMessage
      })
    }
  },
  fetchExplorePosts: async (maxDistance: number, pageNumber = 1) => {
    set({ isLoading: true, error: null })
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/Finder/explore`, {
        params: { maxDistance, pageNumber },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      })
      if (res.data.success) {
        const newPosts = res.data.datas || []
        set((state) => ({
          posts: pageNumber === 1 ? newPosts : [...state.posts, ...newPosts],
          pageNumber,
          hasMore: newPosts.length > 0,
          isLoading: false,
          error: null
        }))
      } else {
        set({
          isLoading: false,
          error: res.data.message || "Failed to fetch posts"
        })
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch posts"
      set({ 
        isLoading: false, 
        error: errorMessage
      })
    }
  },
  fetchAppliedPosts: async (pageNumber = 1) => {
    set({ isLoading: true, error: null })
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/Finder/applieds`, {
        params: { pageNumber },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      })
      if (res.data.success) {
        const newPosts = res.data.datas || []
        set((state) => ({
          posts: pageNumber === 1 ? newPosts : [...state.posts, ...newPosts],
          pageNumber,
          hasMore: newPosts.length >= 10,
          isLoading: false,
          error: null
        }))
      } else {
        set({
          isLoading: false,
          error: res.data.message || "Failed to fetch applied posts"
        })
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch applied posts"
      set({ 
        isLoading: false, 
        error: errorMessage
      })
    }
  },
  fetchSeekerRecommendations: async () => {
    set({ isLoadingRecommendations: true, error: null })
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/Finder/seekerRecommendations`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      })
      if (res.data.success) {
        set({
          seekerRecommendations: res.data.datas?.[0] || [],
          isLoadingRecommendations: false,
          error: null
        })
      } else {
        set({
          isLoadingRecommendations: false,
          error: res.data.message || "Failed to fetch seeker recommendations"
        })
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch seeker recommendations"
      set({ 
        isLoadingRecommendations: false, 
        error: errorMessage
      })
    }
  },
  applyToPost: async (postId: string, message: string) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/Finder/apply`, {
        postId,
        message
      }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      return true
    } catch {
      return false
    }
  },
  respondToApplicant: async (applicantId: number, status: number, postId: string) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/Finder/applicant/response`, {
        applicantId,
        status
      }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      // Refresh applicants
      await get().fetchApplicants(postId)
      return true
    } catch {
      return false
    }
  }
})) 