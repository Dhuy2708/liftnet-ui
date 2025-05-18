import { useEffect, useState, useRef } from "react"
import { signalRService } from "../services/signalRService"
import { useConversationStore, Conversation } from "@/store/ConversationStore"
import { useSocialStore } from "@/store/SocialStore"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send, Search, MoreVertical, Phone, Video, Users, User, Bell, FileText, ArrowLeft, Loader2, Mail, Calendar, Check, XCircle } from "lucide-react"
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
  status: 'sending' | 'sent' | 'failed'
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
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null)
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const connection = signalRService.getConnection()
  const { conversations, fetchConversations, isLoading, messages, fetchMessages, nextPageToken, clearMessages, messagesLoading } = useConversationStore()
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
      const found = conversations.find(c => c.id === conversationId)
      if (found && (!selectedChat || selectedChat.id !== found.id)) {
        handleConversationClick({
          id: found.id,
          name: found.name,
          avatar: found.img,
          lastMessage: found.lastMessage?.body || "",
          lastTime: "Just now",
          unread: 0,
          isGroup: found.isGroup,
          role: found.role
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
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [])

  useEffect(() => {
    if (connection) {
      const handleMessageSent = (data: { trackId: string, messageId: string, status: number }) => {
        setLocalMessages(prev => {
          const updated = prev.map(msg => 
            msg.trackId === data.trackId 
              ? { ...msg, id: data.messageId, status: data.status === 1 ? 'sent' as const : 'failed' as const }
              : msg
          ).sort((a, b) => new Date(a.time || '').getTime() - new Date(b.time || '').getTime())
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
          setLocalMessages(prev => {
            const updated = [...prev, { 
              ...message, 
              status: 'sent' as const, 
              trackId: '',
              time: message.time || new Date().toISOString()
            }].sort((a, b) => new Date(a.time || '').getTime() - new Date(b.time || '').getTime())
            setTimeout(() => {
              if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: "auto" })
              }
            }, 0)
            return updated
          })
        }
        
        // Update conversation list
        const updatedConversations = conversations.map(conv => {
          if (conv.id === message.conversationId) {
            return {
              ...conv,
              lastMessage: message
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
      setLocalMessages(messages.map(msg => ({ 
        ...msg, 
        status: 'sent' as const, 
        trackId: '',
        conversationId: selectedChat?.id || ''
      })).sort((a, b) => new Date(a.time || '').getTime() - new Date(b.time || '').getTime()))
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
      body: body
    }
    
    // Add message to local state with 'sending' status
    const newLocalMessage: MessageWithStatus = {
      id: '', // Will be set by server
      senderId: currentUserId || '',
      type: 1,
      body: body,
      status: 'sending',
      trackId: trackId,
      conversationId: conversationId,
      time: new Date().toISOString()
    }
    setLocalMessages(prev => [...prev, newLocalMessage].sort((a, b) => new Date(a.time || '').getTime() - new Date(b.time || '').getTime()))
    
    await connection.invoke("SendMessage", recieverIds, message)
  }

  // Send message logic
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return

    try {
      const token = localStorage.getItem("token")
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/Conversation`,
        {
          params: { conversationId: selectedChat.id },
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      
      if (response.data.success && response.data.datas && response.data.datas.length > 0) {
        const conv = response.data.datas[0]
        if (!conv.isGroup && conv.otherMembers && conv.otherMembers.length > 0) {
          const receiverId = conv.otherMembers[0].id
          await sendSignalRMessage(selectedChat.id, [receiverId], newMessage)
          // Only update local state, do not reload or fetch messages
          const updatedConversations = conversations.map(conv => {
            if (conv.id === selectedChat.id) {
              return {
                ...conv,
                lastMessage: {
                  id: '',
                  senderId: currentUserId || '',
                  type: 1,
                  body: newMessage,
                  conversationId: selectedChat.id
                }
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
        }
      }
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
    await fetchMessages(chat.id)
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/Conversation`,
        {
          params: { conversationId: chat.id },
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      if (response.data.success && response.data.datas && response.data.datas.length > 0) {
        const conv = response.data.datas[0]
        if (!conv.isGroup && conv.otherMembers && conv.otherMembers.length > 0) {
          const member = conv.otherMembers[0]
          setSidebarInfo({
            name: `${member.firstName} ${member.lastName}`,
            avatar: member.avatar,
            email: member.email,
            role: member.role,
            isFollowing: member.isFollowing,
            isGroup: false,
            username: member.username,
            isDeleted: member.isDeleted,
            isSuspended: member.isSuspended
          })
        } else {
          setSidebarInfo({
            name: conv.name,
            avatar: chat.avatar,
            isGroup: true
          })
        }
      }
    } catch {
      setSidebarInfo(null)
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
    return <div className="flex h-[calc(100vh-4rem)] items-center justify-center">Loading...</div>
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-[#f7f7fa] overflow-hidden mt-4 shadow-2xl shadow-gray-800/40 rounded-2xl">
      {/* Chat List */}
      <div className="w-1/4 min-w-[260px] max-w-[350px] border-r bg-white flex flex-col h-full">
        <div className="p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-2">
            {showSearchResults && (
              <button 
                onClick={handleBackToConversations}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-500" />
              </button>
            )}
            <div className="flex items-center gap-2 bg-[#edeef2] rounded-lg px-3 py-2 flex-1">
              <Search className="h-4 w-4 text-gray-500" />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => setShowSearchResults(true)}
                className="bg-transparent outline-none flex-1 text-sm text-[#222] placeholder-gray-500"
                placeholder={showSearchResults ? "Search people..." : "Search"}
              />
            </div>
          </div>
        </div>
        <div className="overflow-y-auto flex-1 px-3 py-3 gap-y-2 flex flex-col bg-white">
          {showSearchResults ? (
            <>
              {isSearching && searchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32">
                  <Loader2 className="h-8 w-8 text-[#de9151] animate-spin mb-2" />
                  <p className="text-sm text-gray-500">Searching...</p>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 px-4 py-3 mb-2 rounded-lg cursor-pointer hover:bg-[#f3f2fa] transition group"
                    onClick={async () => {
                      setIsSearching(false)
                      setShowSearchResults(false)
                      setSearchQuery("")
                      clearSearchResults()
                      let conversationId = null
                      let chatInfo = {
                        id: '',
                        name: `${user.firstName} ${user.lastName}`,
                        avatar: user.avatar,
                        lastMessage: "",
                        lastTime: "Just now",
                        unread: 0,
                        isGroup: false,
                        role: user.role
                      }
                      try {
                        const token = localStorage.getItem("token")
                        const response = await axios.get(
                          `${import.meta.env.VITE_API_URL}/api/Conversation`,
                          {
                            params: { userId: user.id },
                            headers: { Authorization: `Bearer ${token}` },
                          }
                        )
                        if (response.status === 200 && response.data.success && response.data.datas && response.data.datas.length > 0) {
                          const conv = response.data.datas[0]
                          conversationId = conv.id
                          chatInfo = {
                            id: conv.id,
                            name: conv.name,
                            avatar: conv.img,
                            lastMessage: conv.lastMessage?.body || "",
                            lastTime: "Just now",
                            unread: 0,
                            isGroup: conv.isGroup,
                            role: conv.role
                          }
                        } else {
                          throw new Error('Not found')
                        }
                      } catch {
                        // Not found, create conversation
                        const newConvId = await useConversationStore.getState().createConversation(user.id)
                        if (newConvId) {
                          conversationId = newConvId
                          chatInfo.id = newConvId
                        } else {
                          // handle error (optional)
                          return
                        }
                      }
                      // Open chat view and fetch messages
                      navigate(`/chat/${conversationId}`)
                      setSelectedChat(chatInfo)
                      clearMessages()
                      setLocalMessages([])
                      await fetchMessages(conversationId)
                    }}
                  >
                    <img
                      src={user.avatar || "https://ui-avatars.com/api/?name=User&background=ededed&color=888&bold=true"}
                      alt={`${user.firstName} ${user.lastName}`}
                      className="h-10 w-10 rounded-full object-cover border border-gray-200"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate text-[#222]">{`${user.firstName} ${user.lastName}`}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{user.role === 1 ? "User" : "PT"}</span>
                        {user.isFollowing && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#fde9dd] text-[#de9151] border border-[#fde9dd]">Following</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 truncate">{user.email}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                  <Search className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No users found</p>
                  <p className="text-xs text-gray-400">Try searching with a different name</p>
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
                role: conv.role
              }
              return (
                <div
                  key={chat.id}
                  className={`flex items-center gap-3 px-5 py-3 rounded-xl cursor-pointer transition-all duration-200 group shadow-sm ${selectedChat?.id === chat.id ? "bg-[#f1f2f4]" : "bg-white hover:bg-[#f5f5fa] hover:shadow-md"}`}
                  onClick={() => handleConversationClick(chat)}
                >
                  <img
                    src={chat.avatar}
                    alt={chat.name}
                    className="h-10 w-10 rounded-full object-cover border border-gray-200"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate text-[#222]">{chat.name}</span>
                        {chat.role && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            chat.role === 1 
                              ? "bg-blue-100 text-blue-700" 
                              : "bg-purple-100 text-purple-700"
                          }`}>
                            {chat.role === 1 ? "User" : "PT"}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 ml-2">Just now</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 truncate">{chat.lastMessage || "No messages yet"}</span>
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
            <div className="flex items-center justify-between px-8 py-5 border-b bg-white flex-shrink-0">
              <div className="flex items-center gap-4">
                <img
                  src={selectedChat.avatar}
                  alt={selectedChat.name}
                  className="h-12 w-12 rounded-full object-cover border border-gray-200"
                />
                <div>
                  <div className="font-semibold text-lg text-[#222]">{selectedChat.name}</div>
                  <div className="text-xs text-gray-500">{selectedChat.isGroup ? "23 members, 10 online" : "Online"}</div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-[#de9151]">
                <Phone className="h-5 w-5 cursor-pointer" />
                <Video className="h-5 w-5 cursor-pointer" />
                <Users className="h-5 w-5 cursor-pointer" />
                <MoreVertical className="h-5 w-5 cursor-pointer" />
              </div>
            </div>
            {/* Messages */}
            <div className="flex-1 flex overflow-hidden">
              <div
                ref={messagesContainerRef}
                onScroll={handleMessagesScroll}
                className="flex-1 overflow-y-auto px-8 py-6 space-y-1 bg-[#f1f2f4]"
              >
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-full w-full">
                    <Loader2 className="h-8 w-8 text-[#de9151] animate-spin" />
                  </div>
                ) : (
                  <>
                    {localMessages.map((message: MessageWithStatus, idx: number) => {
                      const isMe = message.senderId === currentUserId
                      const prevMsg = idx > 0 ? localMessages[idx - 1] : null
                      const isFirstOfGroup = !prevMsg || prevMsg.senderId !== message.senderId
                      const isLastOfGroup = idx === localMessages.length - 1 || localMessages[idx + 1].senderId !== message.senderId
                      return (
                        <div key={message.trackId || message.id || idx} className={`flex ${isMe ? "justify-end" : "justify-start"} ${isFirstOfGroup ? "mt-4" : "mt-0"}`}>
                          <div className="max-w-[70%] relative flex flex-col items-start">
                            <div
                              className={`rounded-2xl shadow-sm mb-1 text-sm ${
                                isMe ? "bg-[#de9151] text-white" : "bg-white text-gray-900"
                              } ${isFirstOfGroup ? "rounded-t-2xl" : "rounded-t-md"} ${isLastOfGroup ? "rounded-b-2xl" : "rounded-b-md"} ${message.type === 2 || message.type === 3 ? "px-0 py-0" : "px-4 py-2"}`}
                              onMouseEnter={() => handleMouseEnter(message.id)}
                              onMouseLeave={handleMouseLeave}
                            >
                              {message.type === 2 ? (
                                <img src={message.body} alt="media" className="w-full block rounded-b-2xl" />
                              ) : message.type === 3 ? (
                                <video controls src={message.body} className="w-full block rounded-b-2xl" />
                              ) : (
                                <span>{message.body}</span>
                              )}
                              {isMe && (
                                <span className="ml-1 inline-flex items-center">
                                  {message.status === 'sending' && <Loader2 className="h-3 w-3 animate-spin" />}
                                  {message.status === 'sent' && <Check className="h-3 w-3" />}
                                  {message.status === 'failed' && <XCircle className="h-3 w-3 text-red-500" />}
                                </span>
                              )}
                              {showTimeMsg === message.id && (
                                <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 shadow z-10 whitespace-nowrap">
                                  {new Date(message.time || '').toLocaleTimeString()}
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
            <div className="px-8 py-5 bg-white border-t flex-shrink-0">
              <div className="flex items-center gap-3 rounded-2xl bg-[#fbeee3] px-4 py-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Your message"
                  className="flex-1 border-none bg-transparent focus:ring-0 focus:border-none shadow-none text-[#de9151] placeholder-[#de9151]/60"
                />
                <Button
                  onClick={sendMessage}
                  className="bg-[#de9151] hover:bg-[#c27339] rounded-full px-4 py-2"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
          {/* Right Sidebar */}
          <aside className="hidden lg:flex flex-col w-1/4 min-w-[360px] max-w-[420px] bg-white p-0 h-full overflow-y-auto">
            <div className="p-4 space-y-3">
              {/* Profile Card */}
              <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center mb-4">
                <div className="relative">
                  <img
                    src={sidebarInfo?.avatar || userInfo.avatar}
                    alt={sidebarInfo?.name || userInfo.name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow"
                  />
                  {/* Online dot */}
                  <span className="absolute bottom-2 right-2 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></span>
                </div>
                <div className="mt-4 font-semibold text-lg text-center flex items-center gap-2">
                  {sidebarInfo?.name || userInfo.name}
                  {!sidebarInfo?.isGroup && sidebarInfo && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${sidebarInfo.role === 1 ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                      {sidebarInfo.role === 1 ? "User" : "PT"}
                    </span>
                  )}
                </div>
                {!sidebarInfo?.isGroup && sidebarInfo?.username && (
                  <div className="text-sm text-gray-400 text-center">@{sidebarInfo.username}</div>
                )}
                <div className="text-xs text-gray-400 text-center">Product Designer</div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between gap-3 mb-4">
                <button className="flex flex-col items-center bg-white rounded-xl shadow p-3 flex-1 hover:bg-[#f8f9fb] transition">
                  <Phone className="w-5 h-5 text-[#de9151] mb-1" />
                  <span className="text-xs text-gray-700">Call</span>
                </button>
                <button className="flex flex-col items-center bg-white rounded-xl shadow p-3 flex-1 hover:bg-[#f8f9fb] transition">
                  <Video className="w-5 h-5 text-[#de9151] mb-1" />
                  <span className="text-xs text-gray-700">Video</span>
                </button>
                <button className="flex flex-col items-center bg-white rounded-xl shadow p-3 flex-1 hover:bg-[#f8f9fb] transition">
                  <Bell className="w-5 h-5 text-[#de9151] mb-1" />
                  <span className="text-xs text-gray-700">Mute</span>
                </button>
                <button className="flex flex-col items-center bg-white rounded-xl shadow p-3 flex-1 hover:bg-[#f8f9fb] transition">
                  <User className="w-5 h-5 text-[#de9151] mb-1" />
                  <span className="text-xs text-gray-700">Add</span>
                </button>
              </div>

              {/* Contact Details */}
              <div className="bg-white rounded-2xl shadow p-5 mb-4">
                <div className="font-semibold mb-3 text-gray-700">Contact Details</div>
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{sidebarInfo?.email || "—"}</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">Joined January 2022</span>
                </div>
              </div>

              {/* Shared Media */}
              <div className="bg-white rounded-2xl shadow p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold text-gray-700">Shared Media</div>
                  <button className="text-xs text-[#de9151] bg-[#fde9dd] px-3 py-1 rounded-full">View All</button>
                </div>
                <div className="flex gap-3 mb-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center"></div>
                  <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center"></div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-700">Project_Brief.pdf</div>
                      <div className="text-xs text-gray-400">2.4 MB • Last week</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-700">Design_Assets.zip</div>
                      <div className="text-xs text-gray-400">14.8 MB • Last week</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Select a conversation to start chatting
        </div>
      )}
    </div>
  )
} 