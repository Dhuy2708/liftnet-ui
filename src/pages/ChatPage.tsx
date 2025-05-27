"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { signalRService } from "../services/signalRService"
import { useConversationStore, type Conversation } from "@/store/ConversationStore"
import { useSocialStore } from "@/store/SocialStore"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Send,
  Search,
  MoreVertical,
  Phone,
  Video,
  Users,
  User,
  Bell,
  FileText,
  ArrowLeft,
  Loader2,
  Mail,
  Calendar,
  Check,
  XCircle,
  MessageSquare,
  Smile,
  Paperclip,
  Mic,
} from "lucide-react"
import axios from "axios"
import { useNavigate, useParams } from "react-router-dom"

interface ChatItem {
  id: string
  name: string
  avatar: string
  lastMessage: string
  lastTime: string
  unread: number
  isGroup?: boolean
  role?: number
}

interface ConversationMessage {
  id: string
  senderId: string
  type: number
  body: string
  conversationId: string
  time?: string
}

interface SidebarInfo {
  id: string
  name: string
  avatar: string
  email?: string
  role?: number
  isFollowing?: boolean
  isGroup: boolean
  username?: string
  isDeleted?: boolean
  isSuspended?: boolean
}

interface MessageWithStatus extends ConversationMessage {
  status: "sending" | "sent" | "failed"
  trackId: string
  conversationId: string
}

export function ChatPage() {
  const [newMessage, setNewMessage] = useState("")
  const [selectedChat, setSelectedChat] = useState<ChatItem | null>(null)
  const [showTimeMsg, setShowTimeMsg] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [localMessages, setLocalMessages] = useState<MessageWithStatus[]>([])
  const [isLoadingSidebar, setIsLoadingSidebar] = useState(false)
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null)
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const connection = signalRService.getConnection()
  const {
    conversations,
    fetchConversations,
    isLoading,
    messages,
    fetchMessages,
    nextPageToken,
    clearMessages,
    messagesLoading,
    createConversation,
    getConversationByUserId,
  } = useConversationStore()
  const { searchResults, searchPrioritizedUsers, clearSearchResults } = useSocialStore()
  const [sidebarInfo, setSidebarInfo] = useState<SidebarInfo | null>(null)
  const navigate = useNavigate()
  const { conversationId } = useParams()
  const basicInfo = localStorage.getItem("basicInfo")
  const currentUserId = basicInfo ? JSON.parse(basicInfo).id : null

  // Mock user info for sidebar
  const userInfo = {
    name: "Le Ngoc Phuong Khanh",
    avatar: "https://ui-avatars.com/api/?name=Le+Ngoc+Phuong+Khanh",
    encrypted: true,
  }

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // Only fetch messages when user selects a new conversation
  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const found = conversations.find((c) => c.id === conversationId)
      if (found && (!selectedChat || selectedChat.id !== found.id)) {
        handleConversationClick({
          id: found.id,
          name: found.name,
          avatar: found.img,
          lastMessage: found.lastMessage?.body || "",
          lastTime: "Just now",
          unread: 0,
          isGroup: found.isGroup,
          role: found.role,
        })
      }
    }
    // eslint-disable-next-line
  }, [conversationId, conversations])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = original
    }
  }, [])

  useEffect(() => {
    if (connection) {
      const handleMessageSent = (data: { trackId: string; messageId: string; status: number }) => {
        setLocalMessages((prev) => {
          const updated = prev
            .map((msg) =>
              msg.trackId === data.trackId
                ? { ...msg, id: data.messageId, status: data.status === 1 ? ("sent" as const) : ("failed" as const) }
                : msg,
            )
            .sort((a, b) => new Date(a.time || "").getTime() - new Date(b.time || "").getTime())
          setTimeout(() => {
            if (messagesEndRef.current) {
              messagesEndRef.current.scrollIntoView({ behavior: "auto" })
            }
          }, 0)
          return updated
        })
      }
      const handleRecieveMessage = (message: ConversationMessage) => {
        if (selectedChat?.id === message.conversationId) {
          setLocalMessages((prev) => {
            const updated = [
              ...prev,
              {
                ...message,
                status: "sent" as const,
                trackId: "",
                time: message.time || new Date().toISOString(),
              },
            ].sort((a, b) => new Date(a.time || "").getTime() - new Date(b.time || "").getTime())
            setTimeout(() => {
              if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: "auto" })
              }
            }, 0)
            return updated
          })
        }

        // Update conversation list
        const updatedConversations = conversations.map((conv) => {
          if (conv.id === message.conversationId) {
            return {
              ...conv,
              lastMessage: message,
            }
          }
          return conv
        })

        // Sort conversations to put the updated one at the top
        updatedConversations.sort((a, b) => {
          if (a.id === message.conversationId) return -1
          if (b.id === message.conversationId) return 1
          return 0
        })

        // Update the conversations in the store
        useConversationStore.setState({ conversations: updatedConversations })
      }
      connection.off("MessageSent")
      connection.off("RecieveMessage")
      connection.on("MessageSent", handleMessageSent)
      connection.on("RecieveMessage", handleRecieveMessage)
      return () => {
        connection.off("MessageSent", handleMessageSent)
        connection.off("RecieveMessage", handleRecieveMessage)
      }
    }
  }, [connection, conversations, selectedChat])

  useEffect(() => {
    if (messages.length > 0) {
      setLocalMessages(
        messages
          .map((msg) => ({
            ...msg,
            status: "sent" as const,
            trackId: "",
            conversationId: selectedChat?.id || "",
          }))
          .sort((a, b) => new Date(a.time || "").getTime() - new Date(b.time || "").getTime()),
      )
    }
  }, [messages, selectedChat])

  const handleMouseEnter = (id: string) => {
    hoverTimeout.current = setTimeout(() => {
      setShowTimeMsg(id)
    }, 500)
  }
  const handleMouseLeave = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current)
    setShowTimeMsg(null)
  }

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setShowSearchResults(true)

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }

    if (value.trim()) {
      setIsSearching(true)
      searchTimeout.current = setTimeout(() => {
        searchPrioritizedUsers(value).finally(() => {
          setIsSearching(false)
        })
      }, 500)
    } else {
      setIsSearching(false)
      clearSearchResults()
    }
  }

  const handleBackToConversations = () => {
    setIsSearching(false)
    setShowSearchResults(false)
    setSearchQuery("")
    clearSearchResults()
  }

  // Helper to send message via SignalR
  const sendSignalRMessage = async (conversationId: string, recieverIds: string[], body: string) => {
    if (!connection) return
    const trackId = Math.random().toString()
    const message = {
      trackId,
      conversationId: conversationId,
      time: new Date().toISOString(),
      type: 1, // Text
      body: body,
    }

    // Add message to local state with 'sending' status
    const newLocalMessage: MessageWithStatus = {
      id: "", // Will be set by server
      senderId: currentUserId || "",
      type: 1,
      body: body,
      status: "sending",
      trackId: trackId,
      conversationId: conversationId,
      time: new Date().toISOString(),
    }
    setLocalMessages((prev) =>
      [...prev, newLocalMessage].sort((a, b) => new Date(a.time || "").getTime() - new Date(b.time || "").getTime()),
    )

    await connection.invoke("SendMessage", recieverIds, message)
  }

  // Send message logic
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return

    try {
      // Get the receiver ID from the sidebar info
      const receiverId = sidebarInfo?.isGroup ? null : sidebarInfo?.id
      if (!receiverId) {
        console.error("Failed to get receiver ID")
        return
      }

      // Send the message with the correct receiver ID
      await sendSignalRMessage(selectedChat.id, [receiverId], newMessage)

      // Update local state
      const updatedConversations = conversations.map((conv) => {
        if (conv.id === selectedChat.id) {
          return {
            ...conv,
            lastMessage: {
              id: "",
              senderId: currentUserId || "",
              type: 1,
              body: newMessage,
              conversationId: selectedChat.id,
            },
          }
        }
        return conv
      })
      updatedConversations.sort((a, b) => {
        if (a.id === selectedChat.id) return -1
        if (b.id === selectedChat.id) return 1
        return 0
      })
      useConversationStore.setState({ conversations: updatedConversations })
      setNewMessage("")
    } catch (error) {
      console.error("Failed to send message:", error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleConversationClick = async (chat: ChatItem) => {
    if (selectedChat && selectedChat.id === chat.id) return // Prevent reloading same chat
    navigate(`/chat/${chat.id}`)
    setSelectedChat({ ...chat })
    clearMessages()
    setLocalMessages([])
    setIsLoadingSidebar(true)
    await fetchMessages(chat.id)
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/Conversation`, {
        params: { conversationId: chat.id },
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.data.success && response.data.datas && response.data.datas.length > 0) {
        const conv = response.data.datas[0]
        if (!conv.isGroup && conv.otherMembers && conv.otherMembers.length > 0) {
          const member = conv.otherMembers[0]
          setSidebarInfo({
            id: member.id,
            name: `${member.firstName} ${member.lastName}`,
            avatar: member.avatar,
            email: member.email,
            role: member.role,
            isFollowing: member.isFollowing,
            isGroup: false,
            username: member.username,
            isDeleted: member.isDeleted,
            isSuspended: member.isSuspended,
          })
        } else {
          setSidebarInfo({
            id: conv.id,
            name: conv.name,
            avatar: chat.avatar,
            isGroup: true,
          })
        }
      }
    } catch {
      setSidebarInfo(null)
    } finally {
      setIsLoadingSidebar(false)
    }
  }

  // Infinite scroll: load more messages when scroll to top
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const handleMessagesScroll = async () => {
    const el = messagesContainerRef.current
    if (!el || !selectedChat || !nextPageToken) return
    if (el.scrollTop === 0) {
      await fetchMessages(selectedChat.id, 15, nextPageToken)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-orange-200 border-t-[#de9151] rounded-full animate-spin mx-auto mb-4"></div>
            <div
              className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-orange-300 rounded-full animate-spin mx-auto"
              style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
            ></div>
          </div>
          <p className="text-gray-800 font-medium text-sm">Loading your conversations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 overflow-hidden">
      <div className="flex w-full bg-white shadow-2xl shadow-gray-900/10 overflow-hidden">
        {/* Chat List */}
        <div className="w-1/4 min-w-[280px] max-w-[380px] border-r border-gray-200 bg-white flex flex-col h-full">
          <div className="p-5 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center gap-3">
              {showSearchResults && (
                <button
                  onClick={handleBackToConversations}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-105 group"
                >
                  <ArrowLeft className="h-4 w-4 text-gray-500 group-hover:text-gray-700" />
                </button>
              )}
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5 flex-1 border border-gray-200 hover:border-gray-300 transition-all duration-200 focus-within:border-[#de9151] focus-within:bg-white">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => setShowSearchResults(true)}
                  className="bg-transparent outline-none flex-1 text-sm text-gray-700 placeholder-gray-400"
                  placeholder={showSearchResults ? "Search people..." : "Search conversations"}
                />
              </div>
            </div>
          </div>
          <div className="overflow-y-auto flex-1 px-3 py-3 gap-y-1 flex flex-col custom-scrollbar">
            {showSearchResults ? (
              <>
                {isSearching && searchResults.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40">
                    <div className="relative">
                      <div className="w-10 h-10 border-3 border-orange-200 border-t-[#de9151] rounded-full animate-spin mb-3"></div>
                    </div>
                    <p className="text-xs text-gray-500 font-medium">Searching...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 px-3 py-3 mb-1 rounded-xl cursor-pointer hover:bg-orange-50 transition-all duration-300 group border border-transparent hover:border-orange-200 hover:shadow-md hover:shadow-orange-100/50 hover:-translate-y-0.5"
                      onClick={async () => {
                        setIsSearching(true)
                        try {
                          // First check if conversation exists
                          const conversation = await getConversationByUserId(user.id)
                          if (conversation) {
                            // Case 1: Conversation exists
                            setSelectedChat({
                              id: conversation.id,
                              name: `${user.firstName} ${user.lastName}`,
                              avatar: user.avatar,
                              lastMessage: "",
                              lastTime: "Just now",
                              unread: 0,
                              isGroup: false,
                              role: user.role,
                            })
                            setShowSearchResults(false)
                            setSearchQuery("")
                            clearSearchResults()
                            clearMessages()
                            setLocalMessages([])
                            await fetchMessages(conversation.id)
                            navigate(`/chat/${conversation.id}`)
                          } else {
                            // Case 2: No conversation exists, create one
                            const newConversationId = await createConversation(user.id)
                            if (!newConversationId) {
                              throw new Error("Failed to create conversation")
                            }

                            // Get the new conversation info
                            const newConversation = await getConversationByUserId(user.id)
                            if (!newConversation) {
                              throw new Error("Failed to get conversation info")
                            }

                            setSelectedChat({
                              id: newConversation.id,
                              name: `${user.firstName} ${user.lastName}`,
                              avatar: user.avatar,
                              lastMessage: "",
                              lastTime: "Just now",
                              unread: 0,
                              isGroup: false,
                              role: user.role,
                            })
                            setShowSearchResults(false)
                            setSearchQuery("")
                            clearSearchResults()
                            clearMessages()
                            setLocalMessages([])
                            await fetchMessages(newConversation.id)
                            navigate(`/chat/${newConversation.id}`)
                          }
                        } finally {
                          setIsSearching(false)
                        }
                      }}
                    >
                      <div className="relative">
                        <img
                          src={
                            user.avatar || "https://ui-avatars.com/api/?name=User&background=ededed&color=888&bold=true"
                          }
                          alt={`${user.firstName} ${user.lastName}`}
                          className="h-12 w-12 rounded-xl object-cover border-2 border-white shadow-sm group-hover:shadow-md transition-all duration-300"
                        />
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full shadow-sm"></span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-medium truncate text-gray-800 text-sm group-hover:text-gray-900">{`${user.firstName} ${user.lastName}`}</span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              user.role === 1
                                ? "bg-gray-100 text-gray-600 border border-gray-200"
                                : "bg-orange-100 text-[#de9151] border border-orange-200"
                            }`}
                          >
                            {user.role === 1 ? "User" : "PT"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 truncate">{user.email}</span>
                          {user.isFollowing && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 border border-orange-200 font-medium">
                              Following
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                    <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mb-3">
                      <Search className="h-6 w-6 text-gray-500" />
                    </div>
                    <p className="text-xs font-medium">No users found</p>
                    <p className="text-xs text-gray-400 mt-1">Try searching with a different name</p>
                  </div>
                )}
              </>
            ) : (
              conversations.map((conv: Conversation) => {
                const chat: ChatItem = {
                  id: conv.id,
                  name: conv.name,
                  avatar: conv.img,
                  lastMessage: conv.lastMessage?.body || "",
                  lastTime: "Just now",
                  unread: 0,
                  isGroup: conv.isGroup,
                  role: conv.role,
                }
                return (
                  <div
                    key={chat.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 group ${
                      selectedChat?.id === chat.id
                        ? "bg-gradient-to-r from-orange-50 to-amber-50 shadow-md shadow-orange-200/50 border border-orange-200 scale-[1.01]"
                        : "bg-white hover:bg-gray-50 hover:shadow-md hover:shadow-gray-200/50 border border-transparent hover:border-gray-200 hover:-translate-y-0.5"
                    }`}
                    onClick={() => handleConversationClick(chat)}
                  >
                    <div className="relative">
                      <img
                        src={chat.avatar || "/placeholder.svg"}
                        alt={chat.name}
                        className="h-12 w-12 rounded-xl object-cover border-2 border-white shadow-sm group-hover:shadow-md transition-all duration-300"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full shadow-sm"></span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate text-gray-800 text-sm group-hover:text-gray-900">
                            {chat.name}
                          </span>
                          {chat.role && (
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                chat.role === 1
                                  ? "bg-gray-100 text-gray-600 border border-gray-200"
                                  : "bg-orange-100 text-[#de9151] border border-orange-200"
                              }`}
                            >
                              {chat.role === 1 ? "User" : "PT"}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 ml-2 font-medium">Just now</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500 truncate">{chat.lastMessage || "No messages yet"}</span>
                        {chat.unread > 0 && (
                          <span className="ml-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#de9151] text-xs font-bold text-white shadow-md">
                            {chat.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Chat Area and Right Sidebar as siblings */}
        {selectedChat ? (
          <div className="flex flex-1 h-full">
            {/* Chat Area */}
            <div className="flex flex-col flex-1 h-full">
              {/* Chat Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={selectedChat.avatar || "/placeholder.svg"}
                      alt={selectedChat.name}
                      className="h-12 w-12 rounded-xl object-cover border-2 border-white shadow-md"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full shadow-sm"></span>
                  </div>
                  <div>
                    <div className="font-semibold text-lg text-gray-800">{selectedChat.name}</div>
                    <div className="text-xs text-gray-500 font-medium">
                      {selectedChat.isGroup ? "23 members, 10 online" : "Online now"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200 text-gray-600 hover:text-[#de9151] hover:scale-105 group">
                    <Phone className="h-4 w-4 group-hover:animate-pulse" />
                  </button>
                  <button className="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200 text-gray-600 hover:text-[#de9151] hover:scale-105 group">
                    <Video className="h-4 w-4 group-hover:animate-pulse" />
                  </button>
                  <button className="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200 text-gray-600 hover:text-[#de9151] hover:scale-105 group">
                    <Users className="h-4 w-4 group-hover:animate-pulse" />
                  </button>
                  <button className="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200 text-gray-600 hover:text-[#de9151] hover:scale-105 group">
                    <MoreVertical className="h-4 w-4 group-hover:animate-pulse" />
                  </button>
                </div>
              </div>
              {/* Messages */}
              <div className="flex-1 flex overflow-hidden">
                <div
                  ref={messagesContainerRef}
                  onScroll={handleMessagesScroll}
                  className="flex-1 overflow-y-auto px-6 py-4 space-y-1 bg-gradient-to-b from-gray-50 to-orange-50/30 custom-scrollbar"
                >
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-full w-full">
                      <div className="text-center">
                        <div className="relative">
                          <div className="w-10 h-10 border-3 border-orange-200 border-t-[#de9151] rounded-full animate-spin mx-auto mb-3"></div>
                        </div>
                        <p className="text-gray-600 font-medium text-sm">Loading messages...</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {localMessages.map((message: MessageWithStatus, idx: number) => {
                        const isMe = message.senderId === currentUserId
                        const prevMsg = idx > 0 ? localMessages[idx - 1] : null
                        const isFirstOfGroup = !prevMsg || prevMsg.senderId !== message.senderId
                        const isLastOfGroup =
                          idx === localMessages.length - 1 || localMessages[idx + 1].senderId !== message.senderId
                        return (
                          <div
                            key={message.trackId || message.id || idx}
                            className={`flex ${isMe ? "justify-end" : "justify-start"} ${isFirstOfGroup ? "mt-4" : "mt-1"} group`}
                          >
                            <div className="max-w-[75%] relative flex flex-col items-start">
                              <div
                                className={`rounded-2xl shadow-md mb-1 text-sm transition-all duration-200 hover:shadow-lg ${
                                  isMe
                                    ? "bg-gradient-to-r from-[#de9151] to-orange-600 text-white"
                                    : "bg-white text-gray-800 border border-gray-200"
                                } ${isFirstOfGroup ? "rounded-t-2xl" : "rounded-t-xl"} ${
                                  isLastOfGroup ? "rounded-b-2xl" : "rounded-b-xl"
                                } ${message.type === 2 || message.type === 3 ? "px-0 py-0" : "px-4 py-2.5"}`}
                                onMouseEnter={() => handleMouseEnter(message.id)}
                                onMouseLeave={handleMouseLeave}
                              >
                                {message.type === 2 ? (
                                  <img
                                    src={message.body || "/placeholder.svg"}
                                    alt="media"
                                    className="w-full block rounded-2xl"
                                  />
                                ) : message.type === 3 ? (
                                  <video controls src={message.body} className="w-full block rounded-2xl" />
                                ) : (
                                  <span className="text-sm whitespace-pre-wrap leading-relaxed">{message.body}</span>
                                )}
                                {isMe && (
                                  <span className="ml-1.5 inline-flex items-center">
                                    {message.status === "sending" && (
                                      <Loader2 className="h-3 w-3 animate-spin opacity-70" />
                                    )}
                                    {message.status === "sent" && <Check className="h-3 w-3 opacity-70" />}
                                    {message.status === "failed" && <XCircle className="h-3 w-3 text-red-400" />}
                                  </span>
                                )}
                                {showTimeMsg === message.id && (
                                  <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-gray-800/90 text-white text-xs rounded-lg px-2.5 py-1 shadow-lg z-10 whitespace-nowrap backdrop-blur-sm">
                                    {new Date(message.time || "").toLocaleTimeString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>
              </div>
              {/* Message Input */}
              <div className="px-6 py-4 bg-white border-t border-gray-200 flex-shrink-0">
                <div className="flex items-center gap-3 rounded-2xl bg-gray-50 border border-gray-200 px-4 py-3 shadow-md hover:shadow-lg transition-all duration-200 focus-within:border-[#de9151] focus-within:bg-white">
                  <button className="p-1.5 hover:bg-gray-100 rounded-xl transition-all duration-200 text-gray-500 hover:text-[#de9151] hover:scale-105">
                    <Paperclip className="h-4 w-4" />
                  </button>
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 border-none bg-transparent focus:ring-0 focus:border-none shadow-none text-gray-700 placeholder-gray-400 text-sm font-medium"
                  />
                  <button className="p-1.5 hover:bg-gray-100 rounded-xl transition-all duration-200 text-gray-500 hover:text-[#de9151] hover:scale-105">
                    <Smile className="h-4 w-4" />
                  </button>
                  <button className="p-1.5 hover:bg-gray-100 rounded-xl transition-all duration-200 text-gray-500 hover:text-[#de9151] hover:scale-105">
                    <Mic className="h-4 w-4" />
                  </button>
                  <Button
                    onClick={sendMessage}
                    className="bg-gradient-to-r from-[#de9151] to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl p-2.5 transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            {/* Right Sidebar */}
            <aside className="hidden lg:flex flex-col w-1/4 min-w-[360px] max-w-[420px] bg-gray-50 p-0 h-full overflow-y-auto custom-scrollbar border-l border-gray-200">
              {isLoadingSidebar ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="relative">
                      <div className="w-10 h-10 border-3 border-orange-200 border-t-[#de9151] rounded-full animate-spin mx-auto mb-3"></div>
                    </div>
                    <p className="text-xs text-gray-500 font-medium">Loading conversation info...</p>
                  </div>
                </div>
              ) : (
                <div className="p-5 space-y-5">
                  {/* Profile Card */}
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 flex flex-col items-center">
                    <div className="relative mb-5">
                      <img
                        src={sidebarInfo?.avatar || userInfo.avatar}
                        alt={sidebarInfo?.name || userInfo.name}
                        className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg"
                      />
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 border-3 border-white rounded-full shadow-md"></span>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-lg text-gray-800 mb-1 flex items-center justify-center gap-2">
                        {sidebarInfo?.name || userInfo.name}
                        {!sidebarInfo?.isGroup && sidebarInfo && (
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                              sidebarInfo.role === 1
                                ? "bg-gray-100 text-gray-600 border border-gray-200"
                                : "bg-orange-100 text-[#de9151] border border-orange-200"
                            }`}
                          >
                            {sidebarInfo.role === 1 ? "User" : "PT"}
                          </span>
                        )}
                      </div>
                      {!sidebarInfo?.isGroup && sidebarInfo?.username && (
                        <div className="text-sm text-gray-500 mb-1">@{sidebarInfo.username}</div>
                      )}
                      <div className="text-xs text-gray-400">Product Designer</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-4 gap-2">
                    <button className="flex flex-col items-center bg-white rounded-xl shadow-md border border-gray-200 p-3 hover:bg-orange-50 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 group">
                      <Phone className="w-5 h-5 text-[#de9151] mb-1.5 group-hover:scale-110 transition-transform duration-200" />
                      <span className="text-xs text-gray-700 font-medium">Call</span>
                    </button>
                    <button className="flex flex-col items-center bg-white rounded-xl shadow-md border border-gray-200 p-3 hover:bg-orange-50 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 group">
                      <Video className="w-5 h-5 text-orange-600 mb-1.5 group-hover:scale-110 transition-transform duration-200" />
                      <span className="text-xs text-gray-700 font-medium">Video</span>
                    </button>
                    <button className="flex flex-col items-center bg-white rounded-xl shadow-md border border-gray-200 p-3 hover:bg-orange-50 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 group">
                      <Bell className="w-5 h-5 text-amber-500 mb-1.5 group-hover:scale-110 transition-transform duration-200" />
                      <span className="text-xs text-gray-700 font-medium">Mute</span>
                    </button>
                    <button className="flex flex-col items-center bg-white rounded-xl shadow-md border border-gray-200 p-3 hover:bg-orange-50 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 group">
                      <User className="w-5 h-5 text-gray-600 mb-1.5 group-hover:scale-110 transition-transform duration-200" />
                      <span className="text-xs text-gray-700 font-medium">Add</span>
                    </button>
                  </div>

                  {/* Contact Details */}
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5">
                    <div className="font-semibold mb-3 text-gray-800 text-base">Contact Details</div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                        <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center">
                          <Mail className="w-4 h-4 text-[#de9151]" />
                        </div>
                        <span className="text-sm text-gray-700 font-medium">{sidebarInfo?.email || "—"}</span>
                      </div>
                      <div className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                        <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
                          <Phone className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="text-sm text-gray-700 font-medium">+1 (555) 123-4567</span>
                      </div>
                      <div className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                        <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-purple-600" />
                        </div>
                        <span className="text-sm text-gray-700 font-medium">Joined January 2022</span>
                      </div>
                    </div>
                  </div>

                  {/* Shared Media */}
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-semibold text-gray-800 text-base">Shared Media</div>
                      <button className="text-xs text-[#de9151] bg-orange-50 px-3 py-1.5 rounded-xl hover:bg-orange-100 transition-all duration-200 font-medium border border-orange-200">
                        View All
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center hover:shadow-md transition-all duration-200 cursor-pointer"></div>
                      <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center hover:shadow-md transition-all duration-200 cursor-pointer"></div>
                      <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center hover:shadow-md transition-all duration-200 cursor-pointer"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200 cursor-pointer">
                        <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center">
                          <FileText className="w-4 h-4 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-gray-700 font-medium">Project_Brief.pdf</div>
                          <div className="text-xs text-gray-400">2.4 MB • Last week</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200 cursor-pointer">
                        <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
                          <FileText className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-gray-700 font-medium">Design_Assets.zip</div>
                          <div className="text-xs text-gray-400">14.8 MB • Last week</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </aside>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
                <MessageSquare className="h-10 w-10 text-[#de9151]" />
              </div>
              <p className="text-lg font-semibold text-gray-800 mb-2">Select a conversation to start chatting</p>
              <p className="text-sm text-gray-500">Choose from your existing conversations or start a new one</p>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(222, 145, 81, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(222, 145, 81, 0.5);
        }
      `}</style>
    </div>
  )
}
