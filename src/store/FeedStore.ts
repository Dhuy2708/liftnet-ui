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
  createPost: (content: string, mediaFiles?: File[]) => Promise<boolean>
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
      // For now, we'll use sample data since we don't have the actual API endpoint
      // In a real implementation, you would call your API here
      // const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/Feed/posts`)

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

  createPost: async (content: string, mediaFiles?: File[]) => {
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
        // Refresh posts after successful creation
        await get().fetchPosts()
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

// Helper function to generate sample posts for development
function generateSamplePosts(): Post[] {
  const samplePosts = []

  for (let i = 0; i < 10; i++) {
    samplePosts.push({
      id: `post-${i}`,
      userId: `user-${i % 2}`,
      schema: 0,
      createdAt: new Date(Date.now() - i * 3600000).toISOString(),
      modifiedAt: new Date(Date.now() - i * 3600000).toISOString(),
      content:
        i % 3 === 0
          ? "Just finished an amazing HIIT session with my clients! Remember, consistency is key to achieving your fitness goals. 💪"
          : i % 3 === 1
            ? "New personal best on my deadlift today! 315 lbs x 5 reps. Thanks to everyone who's been supporting my journey."
            : "Today's workout was tough but worth it. Focusing on form over weight has really improved my results.",
      medias: i % 4 === 0 ? [`https://images.unsplash.com/photo-${1517836357463 + i}-d25dfeac3438`] : [],
      // Additional fields for UI display
      userFirstName: i % 2 === 0 ? "Sarah" : "Mike",
      userLastName: i % 2 === 0 ? "Johnson" : "Thompson",
      userAvatar: `https://randomuser.me/api/portraits/${i % 2 === 0 ? "women" : "men"}/${20 + i}.jpg`,
      userRole: i % 2 === 0 ? 2 : 1, // 2 for PT, 1 for Seeker
    })
  }

  return samplePosts
}
