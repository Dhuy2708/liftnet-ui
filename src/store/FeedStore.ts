import { create } from "zustand"
import axios from "axios"

// Define the Post type
export interface Post {
  id: string
  userId: string
  schema: number
  createdAt: string
  modifiedAt: string
  content: string
  medias: string[]
  likeCount: number
  isLiked: boolean
  // Additional fields for UI display
  userFirstName?: string
  userLastName?: string
  userAvatar?: string
  userRole?: number
}

// Define the API response type
interface FeedResponse {
  success: boolean
  message: string
  errors?: string[]
  validationFailure?: Array<{
    propertyName: string
    errorMessage: string
    attemptedValue: string
    customState: string
    severity: number
    errorCode: string
    formattedMessagePlaceholderValues: Record<string, string>
  }>
  datas?: Post[]
}

// Define the store state
type FeedState = {
  posts: Post[]
  isLoading: boolean
  error: string | null
}

// Define the store actions
type FeedActions = {
  fetchPosts: () => Promise<void>
  fetchProfilePosts: (userId: string) => Promise<void>
  createPost: (content: string, mediaFiles?: File[], userId?: string) => Promise<boolean>
  likePost: (postId: string) => Promise<boolean>
  deletePost: (postId: string) => Promise<boolean>
  clearError: () => void
}

// Combine state and actions
export type FeedStore = FeedState & FeedActions

// Create the store
export const useFeedStore = create<FeedStore>((set, get) => ({
  posts: [],
  isLoading: false,
  error: null,

  fetchPosts: async () => {
    set({ isLoading: true, error: null })
    try {

      // Simulate API call with sample data
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const samplePosts = generateSamplePosts()
      set({ posts: samplePosts, isLoading: false })
    } catch (error) {
      console.error("Failed to fetch posts:", error)
      set({
        error: error instanceof Error ? error.message : "Failed to fetch posts",
        isLoading: false,
      })
    }
  },

  fetchProfilePosts: async (userId: string) => {
    set({ isLoading: true, error: null })
    try {
      const token = localStorage.getItem("token")
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/Feed/list/${userId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (response.data.success) {
        set({ posts: response.data.datas, isLoading: false })
      } else {
        set({ error: response.data.message || "Failed to fetch profile posts", isLoading: false })
      }
    } catch (error) {
      console.error("Failed to fetch profile posts:", error)
      set({
        error: error instanceof Error ? error.message : "Failed to fetch profile posts",
        isLoading: false,
      })
    }
  },

  createPost: async (content: string, mediaFiles?: File[], userId?: string) => {
    set({ isLoading: true, error: null })
    try {
      const formData = new FormData()
      formData.append("Content", content)

      // Add media files if they exist
      if (mediaFiles && mediaFiles.length > 0) {
        mediaFiles.forEach((file) => {
          formData.append("MediaFiles", file)
        })
      }

      const token = localStorage.getItem("token")

      const response = await axios.post<FeedResponse>(
        `${import.meta.env.VITE_API_URL || "http://103.249.200.168:8080"}/api/Feed/post`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (response.status === 200 && response.data.success) {
        // Always refresh profile posts if userId is provided
        if (userId) {
          await get().fetchProfilePosts(userId)
        }
        return true
      } else {
        // Handle API error
        const errorMessage =
          response.data.message ||
          (response.data.errors && response.data.errors.length > 0 ? response.data.errors[0] : "Failed to create post")
        set({ error: errorMessage, isLoading: false })
        return false
      }
    } catch (error) {
      console.error("Failed to create post:", error)
      set({
        error: error instanceof Error ? error.message : "Failed to create post",
        isLoading: false,
      })
      return false
    } finally {
      set({ isLoading: false })
    }
  },

  likePost: async (postId: string) => {
    // Implement when you have the API endpoint
    // For now, just return true
    return true
  },

  deletePost: async (postId: string) => {
    // Implement when you have the API endpoint
    // For now, just return true
    return true
  },

  clearError: () => {
    set({ error: null })
  },
}))
