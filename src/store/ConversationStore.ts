import { create } from "zustand"
import axios from "axios"

// Define the Conversation type
export interface Conversation {
  id: string
  name: string
  img: string
  isGroup: boolean
  lastMessage: {
    id: string
    senderId: string
    type: number
    body: string
  } | null
  role: number
}

// Define the API response type
interface ConversationResponse {
  pageNumber: number
  pageSize: number
  totalCount: number
  nextPageToken: string | null
  datas: Conversation[]
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

// Message type
export interface ConversationMessage {
  id: string
  senderId: string
  type: number // 1: Text, 2: Image, 3: Video
  body: string
  time: string
}

// Message response type
interface MessageResponse {
  pageNumber: number
  pageSize: number
  totalCount: number
  nextPageToken: string | null
  datas: ConversationMessage[]
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

// Define the store state
type ConversationState = {
  conversations: Conversation[]
  isLoading: boolean
  error: string | null
  hasMore: boolean
  currentPage: number
  messages: ConversationMessage[]
  nextPageToken: string | null
  messagesLoading: boolean
}

// Define the store actions
type ConversationActions = {
  fetchConversations: (pageNumber?: number) => Promise<void>
  clearError: () => void
  clearConversations: () => void
  fetchMessages: (conversationId: string, pageSize?: number, nextPageToken?: string) => Promise<void>
  clearMessages: () => void
  createConversation: (targetId: string) => Promise<string | null>
  getConversationByUserId: (targetId: string) => Promise<Conversation | null>
  getConversationIdByUserId: (targetId: string) => Promise<string | null>
}

// Combine state and actions
export type ConversationStore = ConversationState & ConversationActions

// Create the store
export const useConversationStore = create<ConversationStore>((set, get) => ({
  conversations: [],
  isLoading: false,
  error: null,
  hasMore: true,
  currentPage: 1,
  messages: [],
  nextPageToken: null,
  messagesLoading: false,

  fetchConversations: async (pageNumber = 1) => {
    set({ isLoading: true, error: null })
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get<ConversationResponse>(
        `${import.meta.env.VITE_API_URL}/api/Conversation/list`,
        {
          params: {
            pageNumber
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (response.data.success) {
        const newConversations = response.data.datas || []
        set((state) => ({
          conversations: pageNumber === 1 ? newConversations : [...state.conversations, ...newConversations],
          hasMore: newConversations.length > 0,
          currentPage: pageNumber,
          isLoading: false
        }))
      } else {
        set({ 
          error: response.data.message || "Failed to fetch conversations", 
          isLoading: false 
        })
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error)
      set({
        error: error instanceof Error ? error.message : "Failed to fetch conversations",
        isLoading: false,
      })
    }
  },

  fetchMessages: async (conversationId: string, pageSize = 15, nextPageToken = "") => {
    set({ messagesLoading: true, error: null })
    try {
      const token = localStorage.getItem("token")
      const response = await axios.post<MessageResponse>(
        `${import.meta.env.VITE_API_URL}/api/Conversation/message/list`,
        {
          conditionItems: [
            {
              property: "conversationid",
              values: [conversationId]
            }
          ],
          pageSize,
          nexPageToken: nextPageToken || ""
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      if (response.data.success) {
        const newMessages = response.data.datas || []
        set((state) => ({
          messages: nextPageToken 
            ? [...state.messages, ...newMessages].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
            : newMessages.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()),
          nextPageToken: response.data.nextPageToken || null,
          messagesLoading: false
        }))
      } else {
        set({ error: response.data.message || "Failed to fetch messages", messagesLoading: false })
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch messages",
        messagesLoading: false,
      })
    }
  },

  clearMessages: () => {
    set({ messages: [], nextPageToken: null, messagesLoading: false })
  },

  clearError: () => {
    set({ error: null })
  },

  clearConversations: () => {
    set({ conversations: [], hasMore: true, currentPage: 1 })
  },

  getConversationByUserId: async (targetId: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/Conversation/byUserId`,
        {
          params: { targetId },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      if (response.data.success && response.data.datas && response.data.datas.length > 0) {
        return response.data.datas[0]
      }
      return null
    } catch (error) {
      console.error("Failed to get conversation by user id:", error)
      return null
    }
  },

  createConversation: async (targetId: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/Conversation/create`,
        JSON.stringify(targetId),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      )
      if (response.data.success && response.data.datas && response.data.datas.length > 0) {
        return response.data.datas[0]
      }
      return null
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to create conversation" })
      return null
    }
  },

  getConversationIdByUserId: async (targetId: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/Conversation/id`,
        {
          params: { targetId },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      if (response.data.success && response.data.datas) {
        return response.data.datas
      }
      return null
    } catch (error) {
      console.error("Failed to get conversation id by user id:", error)
      return null
    }
  }
})) 