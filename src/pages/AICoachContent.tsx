import React, { useState, useRef, useCallback, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/chatbot/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Bot,
  X,
  Send,
  Plus,
  Search,
  Trash2,
  Menu,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useChatbotStore } from "@/store/ChatbotStore"
import { FaStar } from "react-icons/fa"

const AICoachContent = () => {
  const [showConversationList, setShowConversationList] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [newConversationTitle, setNewConversationTitle] = useState("")
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [isBotThinking, setIsBotThinking] = useState(false)
  const [streamReader, setStreamReader] = useState<ReadableStreamDefaultReader<Uint8Array> | null>(null)
  const [newMessage, setNewMessage] = useState("")

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

  const chatMessagesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchConversations()
    // Load last active conversation from local storage
    const lastActiveConversation = localStorage.getItem("lastActiveConversation")
    if (lastActiveConversation) {
      setActiveConversation(lastActiveConversation)
    }
  }, [fetchConversations, setActiveConversation])

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight
    }
  }, [activeConversation, conversations])

  const handleConversationClick = (conversationId: string) => {
    setActiveConversation(conversationId)
    // Save the clicked conversation ID to local storage
    localStorage.setItem("lastActiveConversation", conversationId)
    // Update URL without navigation
    window.history.pushState({}, '', `/plan-ai/chat/${conversationId}`)
      if (chatMessagesRef.current) {
        chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight
      }
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
      // Add error message to conversation
      const currentConvs = useChatbotStore.getState().conversations
      const convIdx = currentConvs.findIndex(c => c.id === activeConversation)
      if (convIdx !== -1) {
        const updatedConvs = [...currentConvs]
        const msgs = [...(updatedConvs[convIdx].messages || [])]
        msgs.push({
          id: Date.now().toString() + "-error",
          conversationId: activeConversation,
          message: "Failed to generate answer, please try again later",
          time: new Date().toISOString(),
          isHuman: false
        })
        updatedConvs[convIdx] = { ...updatedConvs[convIdx], messages: msgs }
        useChatbotStore.setState({ conversations: updatedConvs })
      }
    }
  }

  const handleStopSSE = () => {
    if (streamReader) {
      streamReader.cancel()
      setIsBotThinking(false)
      setStreamReader(null)
    }
  }

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
    // Handle error message
    if (text === "Failed to generate answer, please try again later") {
      return (
        <div className="text-red-500 border border-red-200 bg-red-50 p-4 rounded-lg">
          {text}
        </div>
      )
    }

    // Check if the message contains HTML content
    if (text.includes('<div style=') || text.includes('<div class=')) {
      return (
        <div 
          key="html-content"
          className="html-content"
          dangerouslySetInnerHTML={{ 
            __html: text.replace(/\\n/g, '\n').replace(/\\'/g, "'")
          }}
        />
      )
    }

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
          {activeConversation ? (
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
                  <div className="text-sm leading-relaxed space-y-2 [&_.html-content]:max-w-full [&_.html-content]:overflow-x-auto [&_.html-content]:whitespace-pre-wrap [&_.html-content]:text-base [&_.html-content]:bg-white [&_.html-content]:p-6 [&_.html-content]:rounded-lg [&_.html-content]:border [&_.html-content]:border-gray-200 [&_.html-content_h2]:text-2xl [&_.html-content_h2]:font-bold [&_.html-content_h2]:mb-4 [&_.html-content_h3]:text-xl [&_.html-content_h3]:font-semibold [&_.html-content_h3]:mt-6 [&_.html-content_h3]:mb-2 [&_.html-content_p]:mb-3 [&_.html-content_ul]:list-disc [&_.html-content_ul]:pl-6 [&_.html-content_li]:mb-2 [&_.html-content_strong]:font-semibold [&_.html-content_em]:text-gray-600">
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

export default AICoachContent 