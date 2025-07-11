import { create } from "zustand"
import axios from "axios"
import { toast } from "react-hot-toast"

interface Conversation {
  id: string
  title: string
  lastMessage?: string
  timestamp?: string
  messages?: ChatMessage[]
}

interface ChatMessage {
  id: string
  conversationId: string
  message: string
  time: string
  isHuman: boolean
}

interface ChatbotStore {
  conversations: Conversation[]
  activeConversation: string | null
  isLoading: boolean
  error: string | null
  fetchConversations: () => Promise<void>
  setActiveConversation: (id: string | null) => void
  createNewConversation: (firstPrompt: string) => Promise<string | null>
  deleteConversation: (id: string) => Promise<void>
  fetchMessages: (conversationId: string) => Promise<void>
}

export const useChatbotStore = create<ChatbotStore>((set, get) => ({
  conversations: [],
  activeConversation: null,
  isLoading: false,
  error: null,

  fetchConversations: async () => {
    try {
      set({ isLoading: true })
      const token = localStorage.getItem("token")
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/ChatBot/conversations`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      )
      const conversations = response.data.datas.map((conv: { id: string; title: string; lastMessage?: string; timestamp?: string; messages?: ChatMessage[] }) => ({
        ...conv,
        lastMessage: "",
        timestamp: new Date().toISOString(),
        messages: []
      }))
      set({ conversations, isLoading: false })
    } catch {
      toast.error("Failed to fetch conversations")
      set({ isLoading: false })
    }
  },

  setActiveConversation: (id) => {
    set({ activeConversation: id })
    if (id) {
      get().fetchMessages(id)
    }
  },

  fetchMessages: async (conversationId: string) => {
    try {
      set({ isLoading: true })
      const token = localStorage.getItem("token")
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/ChatBot/messages/${conversationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      )

      if (response.data.success) {
        const messages = response.data.datas.map((msg: { id: string; conversationId: string; message: string; time: string; isHuman: boolean }) => ({
          id: msg.id,
          conversationId: msg.conversationId,
          message: msg.message.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\'/g, "'"),
          time: msg.time,
          isHuman: msg.isHuman
        }))

        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? { ...conv, messages }
              : conv
          ),
          isLoading: false
        }))
      } else {
        toast.error(response.data.message || "Failed to fetch messages")
        set({ isLoading: false })
      }
    } catch {
      toast.error("Failed to fetch messages")
      set({ isLoading: false })
    }
  },

  createNewConversation: async (firstPrompt: string) => {
    try {
      set({ isLoading: true })
      const token = localStorage.getItem("token")
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/ChatBot/conversation/create`,
        {
          firstPrompt
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      )
      
      if (!response.data.success) {
        toast.error(response.data.message || "Failed to create conversation")
        set({ isLoading: false })
        return null
      }
      
      const conversationData = response.data.datas[0]
      const conversationId = conversationData.id
      const conversationTitle = conversationData.title
      
      const newConversation = {
        id: conversationId,
        title: conversationTitle,
        lastMessage: firstPrompt,
        timestamp: new Date().toISOString(),
        messages: []
      }
      
      set((state) => ({
        conversations: [newConversation, ...state.conversations],
        activeConversation: conversationId,
        isLoading: false
      }))
      
      return conversationId
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        toast.error(error.response.data.message)
      } else {
        toast.error("Failed to create conversation")
      }
      set({ isLoading: false })
      return null
    }
  },

  deleteConversation: async (id) => {
    try {
      set({ isLoading: true })
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/ChatBot/conversations/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json"
          }
        }
      )
      set((state) => ({
        conversations: state.conversations.filter((conv) => conv.id !== id),
        activeConversation: state.activeConversation === id ? null : state.activeConversation,
        isLoading: false
      }))
    } catch {
      toast.error("Failed to delete conversation")
      set({ isLoading: false })
    }
  }
})) 