import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Bot,
  Send,
  Pencil,
  Search,
  Trash2,
  Menu,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useChatbotStore } from "@/store/ChatbotStore"
import { FaStar } from "react-icons/fa"
import { AnimatePresence, motion } from "framer-motion"

interface AICoachContentProps {
  modalMode?: boolean
}

const AICoachContent = ({ modalMode }: AICoachContentProps) => {
  const [showConversationList, setShowConversationList] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isBotThinking, setIsBotThinking] = useState(false)
  const [streamReader, setStreamReader] = useState<ReadableStreamDefaultReader<Uint8Array> | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [thinkingText, setThinkingText] = useState<string | null>(null)
  const [botMessageText, setBotMessageText] = useState<Record<string, string>>({})

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
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchConversations()
    if (modalMode) {
      const lastActiveConversation = localStorage.getItem("lastActiveConversation")
      if (lastActiveConversation) {
        setActiveConversation(lastActiveConversation)
      }
    } else {
    const lastActiveConversation = localStorage.getItem("lastActiveConversation")
    if (lastActiveConversation) {
      setActiveConversation(lastActiveConversation)
    }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight
    }
  }, [activeConversation, conversations])

  const handleConversationClick = (conversationId: string) => {
    setActiveConversation(conversationId)
    localStorage.setItem("lastActiveConversation", conversationId)
    window.history.pushState({}, '', `/plan-ai/chat/${conversationId}`)
      if (chatMessagesRef.current) {
        chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight
      }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isBotThinking) return

    let currentConversationId = activeConversation

    if (!currentConversationId) {
      const conversationId = await createNewConversation(newMessage)
      if (!conversationId) return
      currentConversationId = conversationId
      localStorage.setItem("lastActiveConversation", conversationId)
      window.history.pushState({}, '', `/plan-ai/chat/${conversationId}`)
    }

    const userMsg = {
      id: Date.now().toString(),
      conversationId: currentConversationId,
      message: newMessage,
      time: new Date().toISOString(),
      isHuman: true
    }

    const currentConversations = useChatbotStore.getState().conversations
    const convIdx = currentConversations.findIndex(c => c.id === currentConversationId)
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
    setThinkingText(null)

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
            conversationId: currentConversationId,
            message: userMsg.message
          })
        }
      )
      if (!response.body) throw new Error("No response body")
      const reader = response.body.getReader()
      setStreamReader(reader)
      const botMessageId = Date.now().toString() + "-bot"
      let done = false
      setBotMessageText((prev) => ({ ...prev, [botMessageId]: "" }))
      while (!done) {
        const { value, done: streamDone } = await reader.read()
        if (streamDone) {
          done = true
          setIsBotThinking(false)
          setStreamReader(null)
          setThinkingText(null)
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

        // Check for [THINK] prefix
        if (formattedChunk.startsWith('[THINK]')) {
          const thinkMsg = formattedChunk.replace('[THINK]', '').trim()
          setThinkingText(thinkMsg)
          continue
        }

        // Ignore [RELOAD PLAN] message in AICoachContent
        if (formattedChunk.trim() === '[RELOAD PLAN]') {
          continue
        }

        // Append streamed chunk to the message string
        setBotMessageText((prev) => {
          const prevText = prev[botMessageId] || ""
          return { ...prev, [botMessageId]: prevText + formattedChunk }
        })

        // Optimistically update the conversation with an empty string (for time/structure)
        const currentConvs = useChatbotStore.getState().conversations
        const convIdx = currentConvs.findIndex(c => c.id === currentConversationId)
        if (convIdx !== -1) {
          const updatedConvs = [...currentConvs]
          const msgs = [...(updatedConvs[convIdx].messages || [])]
          const botMsgIndex = msgs.findIndex(m => m.id === botMessageId)
          if (botMsgIndex === -1) {
            msgs.push({
              id: botMessageId,
              conversationId: currentConversationId,
              message: "",
              time: new Date().toISOString(),
              isHuman: false
            })
            updatedConvs[convIdx] = { ...updatedConvs[convIdx], messages: msgs }
            useChatbotStore.setState({ conversations: updatedConvs })
          }
        }
      }
      // After stream, update the message in store with the full text
      setTimeout(() => {
        const text = botMessageText[botMessageId] || ""
        const currentConvs = useChatbotStore.getState().conversations
        const convIdx = currentConvs.findIndex(c => c.id === currentConversationId)
        if (convIdx !== -1) {
          const updatedConvs = [...currentConvs]
          const msgs = [...(updatedConvs[convIdx].messages || [])]
          const botMsgIndex = msgs.findIndex(m => m.id === botMessageId)
          if (botMsgIndex !== -1) {
            msgs[botMsgIndex] = {
              ...msgs[botMsgIndex],
              message: text
          }
          updatedConvs[convIdx] = { ...updatedConvs[convIdx], messages: msgs }
          useChatbotStore.setState({ conversations: updatedConvs })
        }
      }
      }, 500)
    } catch {
      setIsBotThinking(false)
      setStreamReader(null)
      setThinkingText(null)
      const currentConvs = useChatbotStore.getState().conversations
      const convIdx = currentConvs.findIndex(c => c.id === currentConversationId)
      if (convIdx !== -1) {
        const updatedConvs = [...currentConvs]
        const msgs = [...(updatedConvs[convIdx].messages || [])]
        msgs.push({
          id: Date.now().toString() + "-error",
          conversationId: currentConversationId,
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

  const handleStartNewChat = () => {
    setActiveConversation(null)
    localStorage.removeItem("lastActiveConversation")
    window.history.pushState({}, '', `/plan-ai/chat`)
    setNewMessage("")
  }

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const parseMessage = (text: string) => {
    if (text === "Failed to generate answer, please try again later") {
      return (
        <div className="text-red-500 border border-red-200 bg-red-50 p-4 rounded-lg">
          {text}
        </div>
      )
    }

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
  
      const boldText = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      return <p key={idx} dangerouslySetInnerHTML={{ __html: boldText }} />
    })
  }

  return (
    <div className={modalMode ? "h-full flex flex-col bg-white" : "h-full flex relative"}>
      {modalMode ? (
        <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200">
          <div className="flex-1 flex flex-col">
            <div ref={chatMessagesRef} className="flex-1 p-6 space-y-4 overflow-y-auto scrollbar-hide">
              {activeConversation ? (
                conversations.find(c => c.id === activeConversation)?.messages?.map((message) => {
                  if (!message.isHuman) {
                    const text = botMessageText[message.id] ?? message.message ?? ""
                    return (
                      <div key={message.id} className="flex justify-start">
                        <div className="max-w-[80%] p-4 rounded-2xl text-gray-900">
                          <motion.span
                            key={text.length}
                            initial={{ opacity: 0.5 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.18 }}
                            className="text-base font-semibold leading-relaxed space-y-2"
                            style={{ fontWeight: 600, display: 'inline' }}
                          >
                            {parseMessage(text)}
                          </motion.span>
                        </div>
                      </div>
                    )
                  } else {
                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                        className="flex justify-end"
                      >
                        <div className="max-w-[80%] p-4 rounded-2xl bg-purple-600 text-white">
                          <div className="text-sm leading-relaxed space-y-2">
                            {parseMessage(message.message.replace(/\\n/g, '\n'))}
                          </div>
                        </div>
                      </motion.div>
                    )
                  }
                })
              ) : (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.25 }}
                  className="h-full flex items-center justify-center"
                >
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto">
                      <Bot className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">New Chat</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      Start typing your first message below to begin a new conversation with your AI coach.
                    </p>
                  </div>
                </motion.div>
              )}
              <div id="chat-end-anchor" ref={chatEndRef} />
              <AnimatePresence initial={false}>
                {isBotThinking && (
                  <motion.div
                    key={thinkingText || 'thinking'}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center space-x-2 p-4"
                  >
                    <div className="w-8 h-8 rounded-full bg-purple-500 animate-pulse flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-gray-500 italic">
                      {thinkingText || 'Generating'}
                      <AnimatedEllipsis />
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="p-6 border-t border-gray-100 bg-white">
              <div className="flex space-x-3">
              <Input
                type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder={activeConversation ? "Ask your AI coach anything..." : "Type your first message to start a new chat..."}
                  className="flex-1 border-gray-200 focus:border-purple-600 focus:ring-purple-600 rounded-xl h-12 text-base"
                  disabled={isLoading || isBotThinking}
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
                    disabled={isLoading || !newMessage.trim()}
                  >
                    <Send className="w-5 h-5" />
                </Button>
                )}
              </div>
            </div>
              </div>
            </div>
          ) : (
        <div className={cn(
          "w-80 border-r-1 border-gray-300 flex flex-col bg-white transition-all duration-300 absolute left-0 top-0 bottom-0 z-10",
          showConversationList ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="p-4 border-b border-gray-100">
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
              onClick={handleStartNewChat}
                className="w-full bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl h-10 font-medium transition-colors"
                disabled={isLoading}
              >
              <Pencil className="w-4 h-4 mr-2" />
                New Chat
              </Button>
        </div>

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
                      ? "bg-gray-100 rounded-xl"
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
      )}

      <div className={cn(
        "flex-1 flex flex-col bg-white transition-all duration-300",
        showConversationList ? "ml-80" : "ml-0"
      )}>
        {/* Sidebar Toggle Button - absolutely positioned inside chat area */}
        <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowConversationList(!showConversationList)}
            className="absolute top-4 left-4 z-20 bg-white/80 shadow-md rounded-full p-2 hover:bg-gray-100 transition-all duration-300"
            style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)' }}
            >
              <Menu className="h-5 w-5 text-gray-600" />
            </Button>
        </div>

        <div ref={chatMessagesRef} className="flex-1 p-6 space-y-4 overflow-y-auto scrollbar-hide">
          {activeConversation ? (
            conversations.find(c => c.id === activeConversation)?.messages?.map((message) => {
              if (!message.isHuman) {
                // Bot message: render as a single animated span for the whole message
                const text = botMessageText[message.id] ?? message.message ?? ""
                return (
                  <div key={message.id} className="flex justify-start">
                    <div className="max-w-[80%] p-4 rounded-2xl text-gray-900">
                      <motion.span
                        key={text.length} // triggers animation only when text grows
                        initial={{ opacity: 0.5 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.18 }}
                        className="text-base font-semibold leading-relaxed space-y-2"
                        style={{ fontWeight: 600, display: 'inline' }}
                      >
                        {parseMessage(text)}
                      </motion.span>
                  </div>
                  </div>
                )
              } else {
                // User message: render as before
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="flex justify-end"
                  >
                    <div className="max-w-[80%] p-4 rounded-2xl bg-purple-600 text-white">
                      <div className="text-sm leading-relaxed space-y-2">
                        {parseMessage(message.message.replace(/\\n/g, '\n'))}
                </div>
              </div>
                  </motion.div>
                )
              }
            })
          ) : (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.25 }}
              className="h-full flex items-center justify-center"
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">New Chat</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Start typing your first message below to begin a new conversation with your AI coach.
                </p>
              </div>
            </motion.div>
          )}
          <div id="chat-end-anchor" ref={chatEndRef} />
          <AnimatePresence initial={false}>
          {isBotThinking && (
            <motion.div
              key={thinkingText || 'thinking'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="flex items-center space-x-2 p-4"
            >
              <div className="w-8 h-8 rounded-full bg-purple-500 animate-pulse flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="text-gray-500 italic">
                {thinkingText || 'Generating'}
                <AnimatedEllipsis />
              </span>
            </motion.div>
          )}
          </AnimatePresence>
        </div>

        <div className="p-6 border-t border-gray-100 bg-white">
          <div className="flex space-x-3">
            <Input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder={activeConversation ? "Ask your AI coach anything..." : "Type your first message to start a new chat..."}
              className="flex-1 border-gray-200 focus:border-purple-600 focus:ring-purple-600 rounded-xl h-12 text-base"
              disabled={isLoading || isBotThinking}
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
                disabled={isLoading || !newMessage.trim()}
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

const AnimatedEllipsis = () => {
  return (
    <span style={{ display: 'inline-block', minWidth: 18 }}>
      <motion.span
        key="dot1"
        animate={{ opacity: [0.2, 1, 0.2] }}
        transition={{ repeat: Infinity, duration: 1, delay: 0 }}
        style={{ marginLeft: 1 }}
      >.
      </motion.span>
      <motion.span
        key="dot2"
        animate={{ opacity: [0.2, 1, 0.2] }}
        transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
        style={{ marginLeft: 1 }}
      >.
      </motion.span>
      <motion.span
        key="dot3"
        animate={{ opacity: [0.2, 1, 0.2] }}
        transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
        style={{ marginLeft: 1 }}
      >.
      </motion.span>
    </span>
  )
}

export default AICoachContent 