import { create } from "zustand"
import axios from "axios"

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
  searchResults: ProfileData[]
  hasMore: boolean
  currentPage: number
}

interface SocialActions {
  getProfile: (userId: string) => Promise<void>
  clearError: () => void
  followUser: (targetId: string) => Promise<boolean>
  unfollowUser: (targetId: string) => Promise<boolean>
  searchFollowedUsers: (search: string, pageNumber?: number) => Promise<ProfileData[]>
  searchPrioritizedUsers: (search: string, pageNumber?: number) => Promise<ProfileData[]>
  clearSearchResults: () => void
}

export interface SuggestedFriend {
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

type SocialStore = SocialState & SocialActions & {
  suggestFriends: () => Promise<SuggestedFriend[]>
}

export const useSocialStore = create<SocialStore>()((set) => ({
  profile: null,
  isLoading: false,
  error: null,
  searchResults: [],
  hasMore: true,
  currentPage: 1,

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

  followUser: async (targetId: string) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/Social/follow?targetId=${targetId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      )

      if (response.status === 200) {
        set((state) => ({
          profile: state.profile ? {
            ...state.profile,
            isFollowing: true,
            follower: state.profile.follower + 1
          } : null
        }))
        return true
      }
      return false
    } catch (error) {
      console.error("Failed to follow user:", error)
      return false
    }
  },

  unfollowUser: async (targetId: string) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/Social/unfollow?targetId=${targetId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      )

      if (response.status === 200) {
        set((state) => ({
          profile: state.profile ? {
            ...state.profile,
            isFollowing: false,
            follower: state.profile.follower - 1
          } : null
        }))
        return true
      }
      return false
    } catch (error) {
      console.error("Failed to unfollow user:", error)
      return false
    }
  },

  searchFollowedUsers: async (search: string, pageNumber = 1) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/Social/search/followed`,
        {
          pageNumber,
          search
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json"
          },
        }
      );
      if (response.data.success && Array.isArray(response.data.datas)) {
        return response.data.datas;
      }
      return [];
    } catch {
      return [];
    }
  },

  searchPrioritizedUsers: async (search: string, pageNumber = 1) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/Social/search/prioritized`,
        {
          pageNumber,
          search
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json"
          },
        }
      );

      if (response.data.success && Array.isArray(response.data.datas)) {
        const newResults = response.data.datas;
        set((state) => ({
          searchResults: pageNumber === 1 ? newResults : [...state.searchResults, ...newResults],
          hasMore: newResults.length > 0,
          currentPage: pageNumber
        }));
        return newResults;
      }
      return [];
    } catch (error) {
      console.error("Failed to search users:", error);
      return [];
    }
  },

  clearSearchResults: () => {
    set({ searchResults: [], hasMore: true, currentPage: 1 });
  },

  clearError: () => {
    set({ error: null })
  },

  suggestFriends: async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/Social/suggestFriends`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "accept": "application/json"
          },
        }
      )
      if (response.data.success && Array.isArray(response.data.datas)) {
        return response.data.datas
      }
      return []
    } catch (error) {
      console.error("Failed to fetch suggested friends:", error)
      return []
    }
  },
})) 