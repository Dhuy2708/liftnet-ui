"use client"

import React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/chatbot/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  BarChart3,
  Bot,
  X,
  Send,
  TrendingUp,
  Target,
  Activity,
  Calendar,
  User,
  Plus,
  Search,
  Trash2,
  Menu,
  List,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLocation } from "react-router-dom"
import { AppLeftSidebar } from "@/components/layout/AppLeftSidebar"
import { useChatbotStore } from "@/store/ChatbotStore"
import { FaStar } from "react-icons/fa"
import { usePlanningStore } from "@/store/PlanningStore"

const AICoachContent = () => {
  const location = useLocation()
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatWidth, setChatWidth] = useState(0)
  const [isResizing, setIsResizing] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [showSidebars, setShowSidebars] = useState(() => {
    const sidebarState = localStorage.getItem("sidebarShow")
    return sidebarState === null ? true : sidebarState === "true"
  })
  const [showConversationList, setShowConversationList] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [newConversationTitle, setNewConversationTitle] = useState("")
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [isBotThinking, setIsBotThinking] = useState(false)
  const [streamReader, setStreamReader] = useState<ReadableStreamDefaultReader<Uint8Array> | null>(null)
  const [loadingConversation, setLoadingConversation] = useState<string | null>(null)

  const {
    conversations,
    activeConversation,
    isLoading,
    error,
    fetchConversations,
    setActiveConversation,
    createNewConversation,
    deleteConversation
  } = useChatbotStore()

  const resizeRef = useRef<HTMLDivElement>(null)
  const chatMessagesRef = useRef<HTMLDivElement>(null)

  // Fetch conversations when component mounts
  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // Scroll to bottom when active conversation or messages change
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight
    }
  }, [activeConversation, conversations])

  const handleConversationClick = (conversationId: string) => {
    setLoadingConversation(conversationId)
    setActiveConversation(conversationId)
    setTimeout(() => {
      setLoadingConversation(null)
      if (chatMessagesRef.current) {
        chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight
      }
    }, 300)
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || isBotThinking) return
    const userMsg = {
      id: Date.now().toString(),
      conversationId: activeConversation,
      message: newMessage,
      time: new Date().toISOString(),
      isHuman: true
    }
    // Optimistically add user message
    const currentConversations = useChatbotStore.getState().conversations
    const convIdx = currentConversations.findIndex(c => c.id === activeConversation)
    if (convIdx !== -1) {
      const updatedConvs = [...currentConversations]
      const msgs = [...(updatedConvs[convIdx].messages || [])]
      msgs.push(userMsg)
      updatedConvs[convIdx] = {
        ...updatedConvs[convIdx],
        messages: msgs
      }
      useChatbotStore.setState({ conversations: updatedConvs })
    }
    setNewMessage("")
    setIsBotThinking(true)

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/ChatBot/chat`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            conversationId: activeConversation,
            message: userMsg.message
          })
        }
      )
      if (!response.body) throw new Error("No response body")
      const reader = response.body.getReader()
      setStreamReader(reader)
      let botMsg = ""
      const botMessageId = Date.now().toString() + "-bot"
      let done = false
      while (!done) {
        const { value, done: streamDone } = await reader.read()
        if (streamDone) {
          done = true
          setIsBotThinking(false)
          setStreamReader(null)
          break
        }
        const chunk = new TextDecoder().decode(value)
        const cleanChunk = chunk
          .split('\n')
          .map(line => line.startsWith('data: ') ? line.replace('data: ', '') : line)
          .join('\n')
        const formattedChunk = cleanChunk
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t')
          .replace(/\\'/g, "'")
        botMsg += formattedChunk
        const currentConvs = useChatbotStore.getState().conversations
        const convIdx = currentConvs.findIndex(c => c.id === activeConversation)
        if (convIdx !== -1) {
          const updatedConvs = [...currentConvs]
          const msgs = [...(updatedConvs[convIdx].messages || [])]
          const botMsgIndex = msgs.findIndex(m => m.id === botMessageId)
          if (botMsgIndex !== -1) {
            msgs[botMsgIndex] = {
              ...msgs[botMsgIndex],
              message: botMsg
            }
          } else {
            msgs.push({
              id: botMessageId,
              conversationId: activeConversation,
              message: botMsg,
              time: new Date().toISOString(),
              isHuman: false
            })
          }
          updatedConvs[convIdx] = { ...updatedConvs[convIdx], messages: msgs }
          useChatbotStore.setState({ conversations: updatedConvs })
        }
      }
    } catch {
      setIsBotThinking(false)
      setStreamReader(null)
    }
  }

  const handleStopSSE = () => {
    if (streamReader) {
      streamReader.cancel()
      setIsBotThinking(false)
      setStreamReader(null)
    }
  }

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizing(true)
    e.preventDefault()
  }, [])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return

      const newWidth = window.innerWidth - e.clientX
      if (newWidth >= window.innerWidth * 0.25 && newWidth <= window.innerWidth * 0.75) {
        setChatWidth(newWidth)
      }
    },
    [isResizing],
  )

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
  }, [])

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateNewConversation = () => {
    if (!newConversationTitle.trim()) return
    createNewConversation(newConversationTitle)
    setNewConversationTitle("")
    setIsCreatingNew(false)
  }

  const parseMessage = (text: string) => {
    const lines = text.split('\n')
    return lines.map((line, idx) => {
      const trimmed = line.trim()
  
      // Match cases like **1. Calorie Surplus:** ...
      const numberedMatch = trimmed.match(/^\*\*(\d+)\.\s*(.*?)\*\*(.*)/)
      if (numberedMatch) {
        const number = numberedMatch[1]
        const boldTitle = numberedMatch[2]
        const rest = numberedMatch[3]
  
        return (
          <p key={idx} className="flex items-start gap-2">
            <span className="inline-block min-w-[1.5rem] text-center font-bold text-blue-600">
              {number}.
            </span>
            <span>
              <strong>{boldTitle}</strong>{rest}
            </span>
          </p>
        )
      }
  
      // Handle * bullet point
      if (trimmed.startsWith('* ')) {
        return (
          <p key={idx} className="flex items-start gap-2 pl-4">
            <FaStar className="text-yellow-500 mt-1 w-3 h-3 shrink-0" />
            <span
              dangerouslySetInnerHTML={{
                __html: trimmed
                  .substring(2)
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              }}
            />
          </p>
        )
      }
  
      // Default bold text
      const boldText = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      return <p key={idx} dangerouslySetInnerHTML={{ __html: boldText }} />
    })
  }
  
  
  // Remove the smooth scroll effect
  useEffect(() => {
    if (!loadingConversation && chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight
    }
  }, [loadingConversation])

  return (
    <div className="h-full flex relative">
      {/* Conversations Sidebar */}
      <div className={cn(
        "w-80 border-r-1 border-gray-300 flex flex-col bg-white transition-all duration-300 absolute left-0 top-0 bottom-0 z-10",
        showConversationList ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Search and New Chat */}
        <div className="p-4 border-b border-gray-100">
          {isCreatingNew ? (
            <div className="space-y-3">
              <Input
                type="text"
                placeholder="Enter conversation title..."
                value={newConversationTitle}
                onChange={(e) => setNewConversationTitle(e.target.value)}
                className="w-full bg-gray-50/50 border-gray-200 focus:border-purple-600 focus:ring-purple-600 rounded-xl h-10"
                autoFocus
              />
              <div className="flex space-x-2">
                <Button
                  onClick={handleCreateNewConversation}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-10 font-medium transition-colors"
                  disabled={isLoading || !newConversationTitle.trim()}
                >
                  Create
                </Button>
                <Button
                  onClick={() => {
                    setIsCreatingNew(false)
                    setNewConversationTitle("")
                  }}
                  variant="outline"
                  className="flex-1 border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl h-10 font-medium transition-colors"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full bg-gray-50/50 border-gray-200 focus:border-purple-600 focus:ring-purple-600 rounded-xl h-10"
                />
              </div>
              <Button
                onClick={() => setIsCreatingNew(true)}
                className="w-full bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl h-10 font-medium transition-colors"
                disabled={isLoading}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Chat
              </Button>
            </>
          )}
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Loading conversations...</div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">{error}</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No conversations found</div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={cn(
                  "p-4 border-b border-gray-100 cursor-pointer transition-all duration-200 group",
                  activeConversation === conversation.id
                    ? "bg-gray-50"
                    : "hover:bg-gray-50/50"
                )}
                onClick={() => handleConversationClick(conversation.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{conversation.title}</h3>
                    <p className="text-sm text-gray-500 truncate mt-0.5 whitespace-pre-wrap">
                      {conversation.lastMessage?.replace(/\\n/g, '\n')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteConversation(conversation.id)
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  {conversation.timestamp ? new Date(conversation.timestamp).toLocaleString() : ""}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col bg-white transition-all duration-300",
        showConversationList ? "ml-80" : "ml-0"
      )}>
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-100 p-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowConversationList(!showConversationList)}
              className="rounded-full p-2 hover:bg-gray-100 transition-all duration-300"
            >
              <Menu className="h-5 w-5 text-gray-600" />
            </Button>
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">AI Fitness Coach</h3>
              <p className="text-sm text-gray-500">Online • Ready to help</p>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div ref={chatMessagesRef} className="flex-1 p-6 space-y-4 overflow-y-auto scrollbar-hide">
          {loadingConversation === activeConversation ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-500">Loading conversation...</p>
              </div>
            </div>
          ) : activeConversation ? (
            conversations.find(c => c.id === activeConversation)?.messages?.map((message) => (
              <div key={message.id} className={cn("flex", message.isHuman ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[80%] p-4 rounded-2xl",
                    message.isHuman
                      ? "bg-purple-600 text-white"
                      : "bg-gray-50 text-gray-900"
                  )}
                >
                  <div className="text-sm leading-relaxed space-y-2">
                    {parseMessage(message.message.replace(/\\n/g, '\n'))}
                  </div>
                  <div className="mt-1 text-xs opacity-60">
                    {message.time ? new Date(message.time).toLocaleTimeString() : ""}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Welcome to AI Coach</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Start a new conversation or select an existing one to begin your fitness journey.
                </p>
                <Button
                  onClick={() => setIsCreatingNew(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-6 py-3 font-medium transition-colors"
                  disabled={isLoading}
                >
                  Start New Conversation
                </Button>
              </div>
            </div>
          )}
          {isBotThinking && (
            <div className="flex items-center space-x-2 p-4">
              <div className="w-8 h-8 rounded-full bg-purple-500 animate-pulse flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="text-gray-500 italic">AI Coach is thinking…</span>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="p-6 border-t border-gray-100 bg-white">
          <div className="flex space-x-3">
            <Input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Ask your AI coach anything..."
              className="flex-1 border-gray-200 focus:border-purple-600 focus:ring-purple-600 rounded-xl h-12 text-base"
              disabled={!activeConversation || isLoading || isBotThinking}
            />
            {isBotThinking ? (
              <Button
                onClick={handleStopSSE}
                className="bg-red-500 hover:bg-red-600 text-white rounded-xl px-6 h-12 transition-colors"
              >
                Stop
              </Button>
            ) : (
              <Button
                onClick={handleSendMessage}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-6 h-12 transition-colors"
                disabled={!activeConversation || isLoading || !newMessage.trim()}
              >
                <Send className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const AnatomyViewer = () => {
  const location = useLocation()
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatWidth, setChatWidth] = useState(0)
  const [isResizing, setIsResizing] = useState(false)
  const [showSidebars, setShowSidebars] = useState(() => {
    const sidebarState = localStorage.getItem("sidebarShow")
    return sidebarState === null ? true : sidebarState === "true"
  })
  const [showConversationList, setShowConversationList] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [newConversationTitle, setNewConversationTitle] = useState("")
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [isBotThinking, setIsBotThinking] = useState(false)
  const [streamReader, setStreamReader] = useState<ReadableStreamDefaultReader<Uint8Array> | null>(null)
  const [loadingConversation, setLoadingConversation] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")

  const { physicalStats, isLoading, error, isSaving, setPhysicalStats, fetchPhysicalStats } = usePlanningStore()

  const {
    conversations,
    activeConversation,
    isLoading: chatbotIsLoading,
    error: chatbotError,
    fetchConversations,
    setActiveConversation,
    createNewConversation,
    deleteConversation
  } = useChatbotStore()

  const resizeRef = useRef<HTMLDivElement>(null)
  const chatMessagesRef = useRef<HTMLDivElement>(null)

  // Fetch conversations when entering AI Coach tab
  useEffect(() => {
    if (location.pathname === "/plan-ai/chat") {
      fetchConversations()
    }
  }, [location.pathname, fetchConversations])

  // Set default chat width to 50% of screen width
  useEffect(() => {
    const updateChatWidth = () => {
      setChatWidth(window.innerWidth * 0.5)
    }

    updateChatWidth()
    window.addEventListener("resize", updateChatWidth)
    return () => window.removeEventListener("resize", updateChatWidth)
  }, [])

  // Scroll to bottom when active conversation or messages change
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight
    }
  }, [activeConversation, conversations])

  useEffect(() => {
    if (location.pathname === "/plan-ai/physical-stats") {
      fetchPhysicalStats()
    }
  }, [location.pathname, fetchPhysicalStats])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || isBotThinking) return
    const userMsg = {
      id: Date.now().toString(),
      conversationId: activeConversation,
      message: newMessage,
      time: new Date().toISOString(),
      isHuman: true
    }
    // Optimistically add user message
    const currentConversations = useChatbotStore.getState().conversations
    const convIdx = currentConversations.findIndex(c => c.id === activeConversation)
    if (convIdx !== -1) {
      const updatedConvs = [...currentConversations]
      const msgs = [...(updatedConvs[convIdx].messages || [])]
      msgs.push(userMsg)
      updatedConvs[convIdx] = {
        ...updatedConvs[convIdx],
        messages: msgs
      }
      useChatbotStore.setState({ conversations: updatedConvs })
    }
    setNewMessage("")
    setIsBotThinking(true)

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/ChatBot/chat`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            conversationId: activeConversation,
            message: userMsg.message
          })
        }
      )
      if (!response.body) throw new Error("No response body")
      const reader = response.body.getReader()
      setStreamReader(reader)
      let botMsg = ""
      const botMessageId = Date.now().toString() + "-bot"
      let done = false
      while (!done) {
        const { value, done: streamDone } = await reader.read()
        if (streamDone) {
          done = true
          setIsBotThinking(false)
          setStreamReader(null)
          break
        }
        const chunk = new TextDecoder().decode(value)
        // Remove 'data: ' prefix from every line and preserve line breaks
        const cleanChunk = chunk
          .split('\n')
          .map(line => line.startsWith('data: ') ? line.replace('data: ', '') : line)
          .join('\n')
        // Format the raw string by replacing escape sequences with their actual characters
        const formattedChunk = cleanChunk
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t')
          .replace(/\\'/g, "'")
        botMsg += formattedChunk
        // Update UI with streaming bot message
        const currentConvs = useChatbotStore.getState().conversations
        const convIdx = currentConvs.findIndex(c => c.id === activeConversation)
        if (convIdx !== -1) {
          const updatedConvs = [...currentConvs]
          const msgs = [...(updatedConvs[convIdx].messages || [])]
          // Find the bot message or create a new one
          const botMsgIndex = msgs.findIndex(m => m.id === botMessageId)
          if (botMsgIndex !== -1) {
            msgs[botMsgIndex] = {
              ...msgs[botMsgIndex],
              message: botMsg
            }
          } else {
            msgs.push({
              id: botMessageId,
              conversationId: activeConversation,
              message: botMsg,
              time: new Date().toISOString(),
              isHuman: false
            })
          }
          updatedConvs[convIdx] = { ...updatedConvs[convIdx], messages: msgs }
          useChatbotStore.setState({ conversations: updatedConvs })
        }
      }
    } catch {
      setIsBotThinking(false)
      setStreamReader(null)
    }
  }

  const handleStopSSE = () => {
    if (streamReader) {
      streamReader.cancel()
      setIsBotThinking(false)
      setStreamReader(null)
    }
  }

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizing(true)
    e.preventDefault()
  }, [])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return

      const newWidth = window.innerWidth - e.clientX
      if (newWidth >= window.innerWidth * 0.25 && newWidth <= window.innerWidth * 0.75) {
        setChatWidth(newWidth)
      }
    },
    [isResizing],
  )

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
  }, [])

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateNewConversation = () => {
    if (!newConversationTitle.trim()) return
    createNewConversation(newConversationTitle)
    setNewConversationTitle("")
    setIsCreatingNew(false)
  }

  const parseMessage = (text: string) => {
    // Split text into lines
    const lines = text.split('\n')
    
    // Process each line
    return lines.map((line, idx) => {
      const trimmed = line.trim()
      
      // Handle numbered lists (e.g. "1. First item")
      const numberedMatch = trimmed.match(/^(\d+)\..*?(\S.*)/)
      if (numberedMatch) {
        const number = numberedMatch[1]
        const content = numberedMatch[2]
        return (
          <p key={idx} className="flex items-start gap-2">
            <span className="inline-block min-w-[1.5rem] text-center font-bold text-blue-600">
              {number}.
            </span>
            <span dangerouslySetInnerHTML={{ __html: content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
          </p>
        )
      }
      
      // Handle bullet points (e.g. "* First item")
      if (trimmed.startsWith('* ')) {
        return (
          <p key={idx} className="flex items-start gap-2">
            <FaStar className="text-yellow-500 mt-1 w-4 h-4 shrink-0" />
            <span dangerouslySetInnerHTML={{ __html: trimmed.substring(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
          </p>
        )
      }
      
      // Handle bold text
      const boldText = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      return <p key={idx} dangerouslySetInnerHTML={{ __html: boldText }} />
    })
  }

  const getPageContent = () => {
    const path = location.pathname.split("/").pop()
    
    switch (path) {
      case "statistic":
            return (
            <div className="space-y-8 max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-blue-50/30 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <TrendingUp className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-700 text-sm">Progress</h3>
                        <p className="text-3xl font-bold text-blue-600">+15%</p>
                        <p className="text-xs text-gray-500">vs last month</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-green-50/30 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Target className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-700 text-sm">Goals Met</h3>
                        <p className="text-3xl font-bold text-green-600">8/10</p>
                        <p className="text-xs text-gray-500">this week</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-purple-50/30 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Activity className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-700 text-sm">Avg Score</h3>
                        <p className="text-3xl font-bold text-purple-600">92</p>
                        <p className="text-xs text-gray-500">fitness level</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-orange-50/20 to-amber-50/30">
                <CardContent className="p-12">
                  <div className="text-center space-y-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#de9151] to-[#f4a261] rounded-3xl flex items-center justify-center mx-auto shadow-xl">
                      <BarChart3 className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900">Advanced Analytics Coming Soon</h3>
                    <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
                      Detailed anatomical views, muscle group analysis, and personalized insights will be available
                      here. Get ready for the most comprehensive fitness tracking experience.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
        )

      case "planning":
        return (
            <div className="max-w-4xl mx-auto">
              <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-purple-50/20 to-pink-50/30">
                <CardContent className="p-12">
                  <div className="text-center space-y-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto shadow-xl">
                      <Calendar className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900">Smart Workout Planning</h3>
                    <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
                      AI-powered workout plans tailored to your goals, schedule, and fitness level will be generated
                      here. Experience personalized training like never before.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
        )

      case "physical-stats": {
        return (
          <div className="max-w-4xl mx-auto">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-green-50/30">
              <CardContent className="p-12">
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#de9151] to-[#f4a261] rounded-3xl flex items-center justify-center mx-auto shadow-xl">
                    <User className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900">Physical Statistics</h3>
                  <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
                    Track your body metrics, set goals, and monitor your progress. Your personal fitness journey starts here.
                  </p>
                  <div className="mt-8">
                    {isLoading ? (
                      <div className="flex justify-center">
                        <div className="w-8 h-8 border-4 border-[#de9151] border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : error ? (
                      <div className="text-red-500">{error}</div>
                    ) : (
                      <form
                        className="space-y-6"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          const stats = {
                            age: formData.get('age') ? Number(formData.get('age')) : null,
                            gender: formData.get('gender') ? String(formData.get('gender')) : null,
                            height: formData.get('height') ? Number(formData.get('height')) : null,
                            mass: formData.get('mass') ? Number(formData.get('mass')) : null,
                            bdf: formData.get('bdf') ? Number(formData.get('bdf')) : null,
                            activityLevel: formData.get('activityLevel') ? String(formData.get('activityLevel')) : null,
                            goal: formData.get('goal') ? String(formData.get('goal')) : null,
                          };
                          await setPhysicalStats(stats);
                        }}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-[#de9151]/30 transition-colors">
                            <label className="text-sm font-medium text-gray-500 block mb-2">Age</label>
                            <input
                              type="number"
                              name="age"
                              defaultValue={physicalStats?.age ?? ''}
                              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-[#de9151] focus:ring-[#de9151] text-lg font-semibold text-gray-900"
                              placeholder="Enter your age"
                            />
                          </div>
                          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-[#de9151]/30 transition-colors">
                            <label className="text-sm font-medium text-gray-500 block mb-2">Gender</label>
                            <select
                              name="gender"
                              defaultValue={physicalStats?.gender ?? ''}
                              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-[#de9151] focus:ring-[#de9151] text-lg font-semibold text-gray-900"
                            >
                              <option value="">Select gender</option>
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-[#de9151]/30 transition-colors">
                            <label className="text-sm font-medium text-gray-500 block mb-2">Height (cm)</label>
                            <input
                              type="number"
                              name="height"
                              defaultValue={physicalStats?.height ?? ''}
                              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-[#de9151] focus:ring-[#de9151] text-lg font-semibold text-gray-900"
                              placeholder="Enter your height"
                            />
                          </div>
                          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-[#de9151]/30 transition-colors">
                            <label className="text-sm font-medium text-gray-500 block mb-2">Weight (kg)</label>
                            <input
                              type="number"
                              name="mass"
                              defaultValue={physicalStats?.mass ?? ''}
                              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-[#de9151] focus:ring-[#de9151] text-lg font-semibold text-gray-900"
                              placeholder="Enter your weight"
                            />
                          </div>
                          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-[#de9151]/30 transition-colors">
                            <label className="text-sm font-medium text-gray-500 block mb-2">Body Fat %</label>
                            <input
                              type="number"
                              name="bdf"
                              defaultValue={physicalStats?.bdf ?? ''}
                              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-[#de9151] focus:ring-[#de9151] text-lg font-semibold text-gray-900"
                              placeholder="Enter body fat %"
                            />
                          </div>
                          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-[#de9151]/30 transition-colors">
                            <label className="text-sm font-medium text-gray-500 block mb-2">Activity Level</label>
                            <select
                              name="activityLevel"
                              defaultValue={physicalStats?.activityLevel ?? ''}
                              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-[#de9151] focus:ring-[#de9151] text-lg font-semibold text-gray-900"
                            >
                              <option value="">Select activity level</option>
                              <option value="sedentary">Sedentary</option>
                              <option value="light">Lightly Active</option>
                              <option value="moderate">Moderately Active</option>
                              <option value="very">Very Active</option>
                              <option value="extra">Extra Active</option>
                            </select>
                          </div>
                          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-[#de9151]/30 transition-colors md:col-span-2">
                            <label className="text-sm font-medium text-gray-500 block mb-2">Fitness Goal</label>
                            <select
                              name="goal"
                              defaultValue={physicalStats?.goal ?? ''}
                              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-[#de9151] focus:ring-[#de9151] text-lg font-semibold text-gray-900"
                            >
                              <option value="">Select your goal</option>
                              <option value="weight_loss">Weight Loss</option>
                              <option value="muscle_gain">Muscle Gain</option>
                              <option value="maintenance">Maintenance</option>
                              <option value="endurance">Endurance</option>
                              <option value="strength">Strength</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex justify-end mt-8">
                          <button
                            type="submit"
                            disabled={isSaving}
                            className="px-8 py-3 bg-gradient-to-r from-[#de9151] to-[#f4a261] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSaving ? (
                              <div className="flex items-center space-x-2">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Saving...</span>
                              </div>
                            ) : (
                              'Save Changes'
                            )}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      }

      case "chat":
        return <AICoachContent />

      default:
        return (
            <div className="max-w-4xl mx-auto">
              <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-orange-50/20 to-amber-50/30">
                <CardContent className="p-12">
                  <div className="text-center space-y-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#de9151] to-[#f4a261] rounded-3xl flex items-center justify-center mx-auto shadow-xl">
                      <Bot className="w-10 h-10 text-white" />
                    </div>
                  <h3 className="text-3xl font-bold text-gray-900">Welcome to AI Assistant</h3>
                    <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
                    Choose a section from the sidebar to get started with your fitness journey.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
        )
    }
  }

  const handleConversationClick = (conversationId: string) => {
    setLoadingConversation(conversationId)
    setActiveConversation(conversationId)
    setTimeout(() => {
      setLoadingConversation(null)
      if (chatMessagesRef.current) {
        chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight
      }
    }, 300)
  }

  return (
    <div className="relative bg-white h-[calc(100vh-3.8rem)]">
      <AppLeftSidebar onToggle={() => {
        const newShow = !showSidebars
        setShowSidebars(newShow)
        localStorage.setItem("sidebarShow", String(newShow))
      }} />
      
      <div className={cn(
        "h-full transition-all duration-500 overflow-hidden",
        showSidebars ? "lg:pl-72" : "lg:pl-24",
        location.pathname === "/ai-assistant/ai-coach" ? "p-0" : "p-8"
      )}>
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-hidden">
            {getPageContent()}
          </div>
        </div>
      </div>

      {/* Elegant Chat Panel - Only show when not in AI Coach tab */}
      {isChatOpen && location.pathname !== "/plan-ai/chat" && (
        <div
          className="fixed top-14 right-0 h-[calc(100vh-3.5rem)] bg-white border-l border-gray-100 shadow-lg flex"
          style={{ width: `${chatWidth}px` }}
        >
          {/* Conversations Sidebar */}
          <div className="w-80 border-r border-gray-200 flex flex-col">
            {/* Search and New Chat */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full bg-gray-50 border-gray-200 focus:border-gray-400 focus:ring-gray-400 rounded-xl h-10"
                />
              </div>
              <Button
                onClick={() => setIsCreatingNew(true)}
                className="w-full bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl h-10 font-medium transition-colors"
                disabled={chatbotIsLoading}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Chat
              </Button>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={cn(
                    "p-4 border-b border-gray-100 cursor-pointer transition-all duration-200",
                    activeConversation === conversation.id
                      ? "bg-gray-50"
                      : "hover:bg-gray-50/50"
                  )}
                  onClick={() => handleConversationClick(conversation.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{conversation.title}</h3>
                      <p className="text-sm text-gray-500 truncate mt-0.5 whitespace-pre-wrap">
                        {conversation.lastMessage?.replace(/\\n/g, '\n')}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteConversation(conversation.id)
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    {conversation.timestamp ? new Date(conversation.timestamp).toLocaleString() : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
          {/* Resize Handle */}
          <div
            ref={resizeRef}
            onMouseDown={handleMouseDown}
              className="absolute left-80 top-0 w-2 h-full bg-gradient-to-b from-transparent via-[#de9151]/20 to-transparent hover:via-[#de9151]/40 cursor-col-resize transition-all duration-200 flex items-center justify-center"
          >
            <div className="w-0.5 h-8 bg-[#de9151] rounded-full opacity-60" />
          </div>

          {/* Chat Header */}
          <div className="bg-gradient-to-r from-[#de9151] to-[#f4a261] p-6 flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">AI Fitness Coach</h3>
                <p className="text-white/80 text-sm">Online • Ready to help</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsChatOpen(false)}
              className="text-white hover:bg-white/20 rounded-xl"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-6 space-y-4 overflow-y-auto scrollbar-hide">
              {activeConversation && conversations.find(c => c.id === activeConversation)?.messages?.map((message) => (
                <div key={message.id} className={cn("flex", message.isHuman ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[80%] p-4 rounded-2xl shadow-sm",
                      message.isHuman
                        ? "bg-gradient-to-r from-[#de9151] to-[#f4a261] text-white rounded-br-md"
                        : "bg-gray-100 text-gray-900 rounded-bl-md",
                  )}
                >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.message.replace(/\\n/g, '\n')}
                    </p>
                    <div className="mt-1 text-xs opacity-60">
                      {message.time ? new Date(message.time).toLocaleTimeString() : ""}
                    </div>
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <div className="p-6 border-t border-gray-100 bg-gray-50/50">
            <div className="flex space-x-3">
              <Input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Ask your AI coach anything..."
                  className="flex-1 border-gray-200 focus:border-gray-400 focus:ring-gray-400 rounded-xl h-12 text-base"
              />
              <Button
                onClick={handleSendMessage}
                className="bg-gradient-to-r from-[#de9151] to-[#f4a261] hover:from-[#c8824a] hover:to-[#e6935a] text-white rounded-xl px-6 h-12 shadow-lg"
              >
                <Send className="w-5 h-5" />
              </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AnatomyViewer
