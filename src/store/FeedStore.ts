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
  commentCount: number
  userOverview: {
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
  hasMore: boolean
}

// Define the store actions
type FeedActions = {
  fetchProfilePosts: (userId: string) => Promise<void>
  fetchFeedList: () => Promise<Post[]>
  createPost: (content: string, mediaFiles?: File[], userId?: string) => Promise<boolean>
  reactPost: (feedId: string, type: number, feedOwnerId: string) => Promise<boolean>
  deletePost: (postId: string) => Promise<boolean>
  clearError: () => void
  clearPosts: () => void
  addComment: (feedId: string, comment: string, parentId?: string) => Promise<boolean>
}

// Combine state and actions
export type FeedStore = FeedState & FeedActions

// Create the store
export const useFeedStore = create<FeedStore>((set, get) => ({
  posts: [],
  isLoading: false,
  error: null,
  hasMore: true,

  clearPosts: () => {
    set({ 
      posts: [],
      isLoading: false,
      error: null,
      hasMore: true
    })
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

  fetchFeedList: async () => {
    set({ isLoading: true, error: null })
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/Feed/list`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (response.data.success) {
        const datas = response.data.datas || []
        if (datas.length > 0) {
          set((state) => ({ 
            posts: [...state.posts, ...datas],
            isLoading: false,
            hasMore: true
          }))
        } else {
          set({ 
            isLoading: false,
            hasMore: false
          })
        }
        return datas
      } else {
        set({ 
          error: response.data.message || "Failed to fetch feed list", 
          isLoading: false,
          hasMore: false
        })
        return []
      }
    } catch (error) {
      console.error("Failed to fetch feed list:", error)
      set({
        error: error instanceof Error ? error.message : "Failed to fetch feed list",
        isLoading: false,
        hasMore: false
      })
      return []
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

  reactPost: async (feedId: string, type: number, feedOwnerId: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/Feed/react`,
        {
          feedOwnerId,
          feedId,
          type
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (response.status === 200) {
        set((state) => ({
          posts: state.posts.map((post) =>
            post.id === feedId
              ? {
                  ...post,
                  isLiked: type === 1,
                  likeCount: type === 1 ? post.likeCount + 1 : post.likeCount - 1,
                }
              : post
          ),
        }))
        return true
      }
      return false
    } catch (error) {
      console.error("Failed to react to post:", error)
      return false
    }
  },

  deletePost: async (postId: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/Feed/${postId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      return response.status === 200
    } catch (error) {
      console.error("Failed to delete post:", error)
      return false
    }
  },

  clearError: () => {
    set({ error: null })
  },

  addComment: async (feedId: string, comment: string, parentId?: string) => {
    set({ isLoading: true, error: null })
    try {
      const token = localStorage.getItem("token")
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/Feed/comment`,
        {
          feedId,
          comment,
          parentId: parentId || null,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      )
      if (response.status === 200 && response.data.success) {
        return true
      } else {
        set({ error: response.data.message || "Failed to add comment", isLoading: false })
        return false
      }
    } catch (error) {
      console.error("Failed to add comment:", error)
      set({
        error: error instanceof Error ? error.message : "Failed to add comment",
        isLoading: false,
      })
      return false
    } finally {
      set({ isLoading: false })
    }
  },
}))
