"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/chatbot/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dumbbell,
  Target,
  Zap,
  Heart,
  Leaf,
  RotateCcw,
  Calendar,
  LayoutGrid,
  TrendingUp,
  X,
  Bot,
  Send,
  MessageCircle,
  Minimize2,
  Pencil,
} from "lucide-react"
import { usePlanningStore, type Exercise } from "@/store/PlanningStore"
import { useChatbotStore } from "@/store/ChatbotStore"
import { FaStar } from "react-icons/fa"
import { AnimatePresence, motion } from "framer-motion"

// Helper function to format camelized string for display
const formatCamelCase = (str: string) => {
  return str.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())
}

// Helper function to format array of strings
const formatArray = (arr: string[]) => {
  return arr.map(formatCamelCase).join(", ")
}

// Helper function to get exercise type styling
const getExerciseTypeStyle = (type: string) => {
  switch (type.toLowerCase()) {
    case "strength":
      return {
        badge: "bg-gradient-to-r from-blue-500/90 to-indigo-500/90 text-white border-0 shadow-lg shadow-blue-500/25",
        icon: <Dumbbell className="h-3.5 w-3.5" />,
        accent: "border-l-blue-500",
        cardBg: "bg-gradient-to-br from-blue-50/80 to-indigo-50/80",
      }
    case "cardio":
      return {
        badge: "bg-gradient-to-r from-red-500/90 to-rose-500/90 text-white border-0 shadow-lg shadow-red-500/25",
        icon: <Heart className="h-3.5 w-3.5" />,
        accent: "border-l-red-500",
        cardBg: "bg-gradient-to-br from-red-50/80 to-rose-50/80",
      }
    case "flexibility":
      return {
        badge:
          "bg-gradient-to-r from-emerald-500/90 to-teal-500/90 text-white border-0 shadow-lg shadow-emerald-500/25",
        icon: <Leaf className="h-3.5 w-3.5" />,
        accent: "border-l-emerald-500",
        cardBg: "bg-gradient-to-br from-emerald-50/80 to-teal-50/80",
      }
    case "recovery":
      return {
        badge: "bg-gradient-to-r from-slate-500/90 to-gray-500/90 text-white border-0 shadow-lg shadow-slate-500/25",
        icon: <RotateCcw className="h-3.5 w-3.5" />,
        accent: "border-l-slate-500",
        cardBg: "bg-gradient-to-br from-slate-50/80 to-gray-50/80",
      }
    default:
      return {
        badge:
          "bg-gradient-to-r from-purple-500/90 to-violet-500/90 text-white border-0 shadow-lg shadow-purple-500/25",
        icon: <Zap className="h-3.5 w-3.5" />,
        accent: "border-l-purple-500",
        cardBg: "bg-gradient-to-br from-purple-50/80 to-violet-50/80",
      }
  }
}

// Helper function to get day name
const getDayName = (dayNumber: number) => {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  return days[dayNumber - 2] || "Unknown"
}

// Helper function to get day styling
const getDayStyle = (day: number) => {
  const colors = [
    "from-violet-500 via-purple-500 to-indigo-500", // Monday
    "from-blue-500 via-cyan-500 to-teal-500", // Tuesday
    "from-emerald-500 via-green-500 to-lime-500", // Wednesday
    "from-amber-500 via-orange-500 to-red-500", // Thursday
    "from-rose-500 via-pink-500 to-fuchsia-500", // Friday
    "from-indigo-500 via-blue-500 to-cyan-500", // Saturday
    "from-slate-500 via-gray-500 to-zinc-500", // Sunday
  ]

  return {
    gradient: colors[day - 2] || colors[0],
    isWeekend: day === 7 || day === 8,
  }
}

// Helper: get all days of week (2-8)
const allDaysOfWeek = [2, 3, 4, 5, 6, 7, 8]

const WeeklySchedule = () => {
  const { planningList, error, fetchPlanningList } = usePlanningStore()
  const [viewMode, setViewMode] = useState<"vertical" | "horizontal">("horizontal")
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)

  // Chat bot states
  const [showChatBot, setShowChatBot] = useState(false)
  const [isBotThinking, setIsBotThinking] = useState(false)
  const [streamReader, setStreamReader] = useState<ReadableStreamDefaultReader<Uint8Array> | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [thinkingText, setThinkingText] = useState<string | null>(null)
  const [botMessageText, setBotMessageText] = useState<Record<string, string>>({})
  const [planReloading, setPlanReloading] = useState(false)

  const {
    conversations,
    activeConversation,
    isLoading: chatLoading,
    setActiveConversation,
    createNewConversation,
  } = useChatbotStore()

  const chatMessagesRef = useRef<HTMLDivElement>(null)
  const chatModalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchPlanningList()
  }, [fetchPlanningList])

  // Load last conversation when chat bot is opened
  useEffect(() => {
    if (showChatBot) {
      const lastActiveConversation = localStorage.getItem("lastActiveConversation")
      if (lastActiveConversation) {
        setActiveConversation(lastActiveConversation)
      }
    }
  }, [showChatBot, setActiveConversation])

  // Auto scroll chat messages
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight
    }
  }, [activeConversation, conversations])

  useEffect(() => {
    if (!showChatBot) return
    function handleClickOutside(event: MouseEvent) {
      if (chatModalRef.current && !chatModalRef.current.contains(event.target as Node)) {
        setShowChatBot(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showChatBot])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isBotThinking) return

    let currentConversationId = activeConversation

    if (!currentConversationId) {
      const conversationId = await createNewConversation(newMessage)
      if (!conversationId) return
      currentConversationId = conversationId
      localStorage.setItem("lastActiveConversation", conversationId)
    }

    const userMsg = {
      id: Date.now().toString(),
      conversationId: currentConversationId,
      message: newMessage,
      time: new Date().toISOString(),
      isHuman: true,
    }

    const currentConversations = useChatbotStore.getState().conversations
    const convIdx = currentConversations.findIndex((c) => c.id === currentConversationId)
    if (convIdx !== -1) {
      const updatedConvs = [...currentConversations]
      const msgs = [...(updatedConvs[convIdx].messages || [])]
      msgs.push(userMsg)
      updatedConvs[convIdx] = {
        ...updatedConvs[convIdx],
        messages: msgs,
      }
      useChatbotStore.setState({ conversations: updatedConvs })
    }
    setNewMessage("")
    setIsBotThinking(true)
    setThinkingText(null)

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/ChatBot/chat`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId: currentConversationId,
          message: userMsg.message,
        }),
      })
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
          .split("\n")
          .map((line) => (line.startsWith("data: ") ? line.replace("data: ", "") : line))
          .join("\n")
        const formattedChunk = cleanChunk.replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\'/g, "'")

        // Check for [THINK] prefix
        if (formattedChunk.startsWith("[THINK]")) {
          const thinkMsg = formattedChunk.replace("[THINK]", "").trim()
          setThinkingText(thinkMsg)
          continue
        }

        // Special logic: [RELOAD PLAN] (only in PlanningContent)
        if (formattedChunk.trim() === '[RELOAD PLAN]') {
          setPlanReloading(true)
          await fetchPlanningList()
          setPlanReloading(false)
          continue // Do not add this message to chat
        }

        // Append streamed chunk to the message string
        setBotMessageText((prev) => {
          const prevText = prev[botMessageId] || ""
          return { ...prev, [botMessageId]: prevText + formattedChunk }
        })

        // Optimistically update the conversation with an empty string (for time/structure)
        const currentConvs = useChatbotStore.getState().conversations
        const convIdx = currentConvs.findIndex((c) => c.id === currentConversationId)
        if (convIdx !== -1) {
          const updatedConvs = [...currentConvs]
          const msgs = [...(updatedConvs[convIdx].messages || [])]
          const botMsgIndex = msgs.findIndex((m) => m.id === botMessageId)
          if (botMsgIndex === -1) {
            msgs.push({
              id: botMessageId,
              conversationId: currentConversationId,
              message: "",
              time: new Date().toISOString(),
              isHuman: false,
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
        const convIdx = currentConvs.findIndex((c) => c.id === currentConversationId)
        if (convIdx !== -1) {
          const updatedConvs = [...currentConvs]
          const msgs = [...(updatedConvs[convIdx].messages || [])]
          const botMsgIndex = msgs.findIndex((m) => m.id === botMessageId)
          if (botMsgIndex !== -1) {
            msgs[botMsgIndex] = {
              ...msgs[botMsgIndex],
              message: text,
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
      const convIdx = currentConvs.findIndex((c) => c.id === currentConversationId)
      if (convIdx !== -1) {
        const updatedConvs = [...currentConvs]
        const msgs = [...(updatedConvs[convIdx].messages || [])]
        msgs.push({
          id: Date.now().toString() + "-error",
          conversationId: currentConversationId,
          message: "Failed to generate answer, please try again later",
          time: new Date().toISOString(),
          isHuman: false,
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

  const parseMessage = (text: string) => {
    if (text === "Failed to generate answer, please try again later") {
      return <div className="text-red-500 border border-red-200 bg-red-50 p-4 rounded-lg">{text}</div>
    }

    if (text.includes("<div style=") || text.includes("<div class=")) {
      return (
        <div
          key="html-content"
          className="html-content"
          dangerouslySetInnerHTML={{
            __html: text.replace(/\\n/g, "\n").replace(/\\'/g, "'"),
          }}
        />
      )
    }

    const lines = text.split("\n")
    return lines.map((line, idx) => {
      const trimmed = line.trim()

      const numberedMatch = trimmed.match(/^\*\*(\d+)\.\s*(.*?)\*\*(.*)/)
      if (numberedMatch) {
        const number = numberedMatch[1]
        const boldTitle = numberedMatch[2]
        const rest = numberedMatch[3]

        return (
          <p key={idx} className="flex items-start gap-2">
            <span className="inline-block min-w-[1.5rem] text-center font-bold text-blue-600">{number}.</span>
            <span>
              <strong>{boldTitle}</strong>
              {rest}
            </span>
          </p>
        )
      }

      if (trimmed.startsWith("* ")) {
        return (
          <p key={idx} className="flex items-start gap-2 pl-4">
            <FaStar className="text-yellow-500 mt-1 w-3 h-3 shrink-0" />
            <span
              dangerouslySetInnerHTML={{
                __html: trimmed.substring(2).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
              }}
            />
          </p>
        )
      }

      const boldText = trimmed.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      return <p key={idx} dangerouslySetInnerHTML={{ __html: boldText }} />
    })
  }

  const handleStartNewChat = () => {
    setActiveConversation(null)
    setNewMessage("")
    localStorage.removeItem("lastActiveConversation")
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="text-red-500 text-lg font-medium">Something went wrong</div>
          <div className="text-gray-500 text-sm">{error}</div>
        </div>
      </div>
    )
  }

  if (!planningList || planningList.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center">
            <Calendar className="h-8 w-8 text-purple-500" />
          </div>
          <div className="text-gray-600 font-medium">No workout plan available</div>
          <div className="text-gray-400 text-sm">Create your first workout to get started</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-8 p-6 pt-1 bg-gradient-to-br from-gray-50/50 to-white min-h-screen relative">
      {/* Header */}
      <div className="relative flex items-center justify-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Weekly Workout Schedule
        </h2>

        {/* View Toggle Buttons */}
        <div className="absolute right-0 flex items-center gap-3">
          <Button
            variant={viewMode === "horizontal" ? "default" : "outline"}
            onClick={() => setViewMode("horizontal")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full transition-all duration-300 ${
              viewMode === "horizontal"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25 scale-105"
                : "hover:bg-purple-50 hover:border-purple-200 hover:text-purple-600"
            }`}
          >
            <Calendar className="h-4 w-4" />
            Calendar View
          </Button>
          <Button
            variant={viewMode === "vertical" ? "default" : "outline"}
            onClick={() => setViewMode("vertical")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full transition-all duration-300 ${
              viewMode === "vertical"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25 scale-105"
                : "hover:bg-purple-50 hover:border-purple-200 hover:text-purple-600"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            Card View
          </Button>
        </div>
      </div>

      {/* Category Badges */}
      <div className="flex flex-wrap gap-2 -mt-5">
        {planningList &&
          Object.entries(
            planningList.reduce(
              (acc, day) => {
                day.exercises.forEach((exercise) => {
                  if (exercise.category) {
                    acc[exercise.category] = (acc[exercise.category] || 0) + 1
                  }
                })
                return acc
              },
              {} as Record<string, number>,
            ),
          ).map(
            ([category, count]) =>
              count > 0 && (
                <Badge
                  key={category}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    category === "strength"
                      ? "bg-blue-500/10 text-blue-600"
                      : category === "cardio"
                        ? "bg-red-500/10 text-red-600"
                        : category === "mobility"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : category === "plyometrics"
                            ? "bg-amber-500/10 text-amber-600"
                            : category === "rehabilitation"
                              ? "bg-purple-500/10 text-purple-600"
                              : category === "stretching"
                                ? "bg-teal-500/10 text-teal-600"
                                : category === "balance"
                                  ? "bg-indigo-500/10 text-indigo-600"
                                  : "bg-gray-500/10 text-gray-600"
                  }`}
                >
                  {formatCamelCase(category)} ({count})
                </Badge>
              ),
          )}
      </div>

      {/* Schedule Content */}
      {viewMode === "vertical" ? (
        <VerticalView onExerciseClick={setSelectedExercise} planReloading={planReloading} />
      ) : (
        <HorizontalView onExerciseClick={setSelectedExercise} planReloading={planReloading} />
      )}

      {/* Floating Chat Bot Button */}
      <AnimatePresence>
        {!showChatBot && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setShowChatBot(true)}
              className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 hover:scale-110"
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Bot Modal */}
      <AnimatePresence>
        {showChatBot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/20 z-50 flex items-end justify-end p-6"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 100 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 100 }}
              transition={{ duration: 0.3, type: 'spring', damping: 20 }}
              ref={chatModalRef}
              className="w-96 h-[480px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Chat Header */}
              <div className="p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">AI Coach</h3>
                    <p className="text-white/80 text-sm">Your fitness assistant</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleStartNewChat}
                    className="hover:bg-white/20 text-white rounded-full"
                    title="New Chat"
                  >
                    <Pencil className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowChatBot(false)}
                    className="hover:bg-white/20 text-white rounded-full"
                  >
                    <Minimize2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Chat Messages */}
              <div ref={chatMessagesRef} className="flex-1 p-4 space-y-4 overflow-y-auto">
                {activeConversation ? (
                  conversations
                    .find((c) => c.id === activeConversation)
                    ?.messages?.map((message) => {
                      if (!message.isHuman) {
                        // Bot message
                        const text = botMessageText[message.id] ?? message.message ?? ""
                        return (
                          <div key={message.id} className="flex justify-start">
                            <div className="max-w-[80%] p-3 rounded-2xl bg-gray-100 text-gray-900">
                              <motion.div
                                key={text.length}
                                initial={{ opacity: 0.5 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.18 }}
                                className="text-sm leading-relaxed"
                              >
                                {parseMessage(text)}
                              </motion.div>
                            </div>
                          </div>
                        )
                      } else {
                        // User message
                        return (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35 }}
                            className="flex justify-end"
                          >
                            <div className="max-w-[80%] p-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                              <div className="text-sm leading-relaxed">
                                {parseMessage(message.message.replace(/\\n/g, "\n"))}
                              </div>
                            </div>
                          </motion.div>
                        )
                      }
                    })
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="h-full flex items-center justify-center"
                  >
                    <div className="text-center space-y-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto">
                        <Bot className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-900">AI Coach</h3>
                      <p className="text-gray-500 text-sm">Ask me anything about your workout plan!</p>
                    </div>
                  </motion.div>
                )}

                {/* Thinking indicator */}
                <AnimatePresence>
                  {isBotThinking && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="flex items-center space-x-2 p-3"
                    >
                      <div className="w-6 h-6 rounded-full bg-purple-500 animate-pulse flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-gray-500 text-sm italic">
                        {thinkingText || "Thinking"}
                        <AnimatedEllipsis />
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-gray-100">
                <div className="flex space-x-2">
                  <Input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Ask your AI coach..."
                    className="flex-1 border-gray-200 focus:border-purple-600 focus:ring-purple-600 rounded-xl"
                    disabled={chatLoading || isBotThinking}
                  />
                  {isBotThinking ? (
                    <Button onClick={handleStopSSE} className="bg-red-500 hover:bg-red-600 text-white rounded-xl px-4">
                      Stop
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSendMessage}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl px-4"
                      disabled={chatLoading || !newMessage.trim()}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40 p-4 transition-opacity duration-300"
          style={{ animation: "fadeIn 0.3s ease-out" }}
        >
          <Card
            className="w-full max-w-2xl max-h-[80vh] overflow-y-auto border-0 shadow-2xl transition-all duration-300"
            style={{ animation: "slideIn 0.3s ease-out" }}
          >
            <CardContent className="p-0">
              {/* Header with gradient background */}
              <div className="relative p-6 bg-gradient-to-r from-purple-600 to-pink-600">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative flex justify-between items-start">
                  <div className="space-y-1.5">
                    <h3 className="text-2xl font-bold text-white">{formatCamelCase(selectedExercise.name)}</h3>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          selectedExercise.category === "strength"
                            ? "bg-blue-500/20 text-blue-100"
                            : selectedExercise.category === "cardio"
                              ? "bg-red-500/20 text-red-100"
                              : selectedExercise.category === "mobility"
                                ? "bg-emerald-500/20 text-emerald-100"
                                : selectedExercise.category === "plyometrics"
                                  ? "bg-amber-500/20 text-amber-100"
                                  : selectedExercise.category === "rehabilitation"
                                    ? "bg-purple-500/20 text-purple-100"
                                    : selectedExercise.category === "stretching"
                                      ? "bg-teal-500/20 text-teal-100"
                                      : selectedExercise.category === "balance"
                                        ? "bg-indigo-500/20 text-indigo-100"
                                        : "bg-gray-500/20 text-gray-100"
                        }`}
                      >
                        {formatCamelCase(selectedExercise.category)}
                      </Badge>
                      <Badge className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-medium">
                        {formatCamelCase(selectedExercise.difficulty)}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedExercise(null)}
                    className="hover:bg-white/20 text-white rounded-full"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Exercise Image */}
                <div className="relative aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 shadow-lg">
                  <img
                    src={selectedExercise.gifUrl || "/placeholder.svg"}
                    alt={selectedExercise.name}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Exercise Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                      <h3 className="text-base font-semibold text-blue-900 mb-3">Primary Info</h3>
                      <div className="space-y-2">
                        <div>
                          <h4 className="text-xs font-medium text-blue-600">Target Muscle</h4>
                          <p className="text-blue-900 text-sm">{formatCamelCase(selectedExercise.target)}</p>
                        </div>
                        <div>
                          <h4 className="text-xs font-medium text-blue-600">Equipment</h4>
                          <p className="text-blue-900 text-sm">{formatCamelCase(selectedExercise.equipment)}</p>
                        </div>
                        <div>
                          <h4 className="text-xs font-medium text-blue-600">Body Part</h4>
                          <p className="text-blue-900 text-sm">{formatCamelCase(selectedExercise.bodyPart)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100">
                      <h3 className="text-base font-semibold text-purple-900 mb-3">Secondary Muscles</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedExercise.secondaryMuscles.map((muscle, index) => (
                          <Badge
                            key={index}
                            className="bg-white/50 text-purple-700 border-purple-200 px-2 py-0.5 text-xs"
                          >
                            {formatCamelCase(muscle)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
                    <h3 className="text-base font-semibold text-emerald-900 mb-3">Instructions</h3>
                    <ol className="space-y-2">
                      {selectedExercise.instructions.map((instruction, index) => (
                        <li key={index} className="flex gap-2">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-medium flex items-center justify-center text-xs">
                            {index + 1}
                          </div>
                          <p className="text-emerald-900 text-sm">{instruction}</p>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

const VerticalView = ({ onExerciseClick, planReloading }: { onExerciseClick: (exercise: Exercise) => void, planReloading: boolean }) => {
  const { planningList, error } = usePlanningStore()

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="text-red-500 text-lg font-medium">Something went wrong</div>
          <div className="text-gray-500 text-sm">{error}</div>
        </div>
      </div>
    )
  }

  if (!planningList || planningList.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center">
            <Calendar className="h-8 w-8 text-purple-500" />
          </div>
          <div className="text-gray-600 font-medium">No workout plan available</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {planReloading ? (
        <div className="flex justify-center items-center py-12">
          <span className="w-8 h-8 border-4 border-purple-300 border-t-transparent rounded-full animate-spin inline-block"></span>
          <span className="ml-3 text-purple-500 font-medium text-lg">Reloading plan...</span>
        </div>
      ) : (
        allDaysOfWeek.map((dayNum) => {
          const day = planningList.find((d) => d.dayOfWeek === dayNum)
          const dayStyle = getDayStyle(dayNum)
          return (
            <Card key={dayNum} className="overflow-hidden border-0 shadow-lg shadow-black/5 rounded-2xl">
              <div className={`p-6 bg-gradient-to-r ${dayStyle.gradient} text-white relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="relative flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">{getDayName(dayNum)}</h3>
                    <p className="text-white/80 text-sm">
                      {day && day.exercises.length > 0 ? `${day.exercises.length} exercises` : "Rest day"}
                    </p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-full">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {day && day.exercises.length > 0 ? (
                    day.exercises.map((exercise, index) => {
                      if (!exercise) return null
                      const typeStyle = getExerciseTypeStyle(exercise.category || "")
                      return (
                        <div
                          key={index}
                          onClick={() => onExerciseClick(exercise)}
                          className={`p-5 rounded-xl border-l-4 ${typeStyle.accent} ${typeStyle.cardBg} 
                            transition-all duration-300 ease-in-out
                            hover:shadow-lg hover:shadow-black/10 hover:-translate-y-1 
                            group cursor-pointer relative border border-white/50`}
                        >
                          <div className="flex flex-col w-full">
                            <div className="relative w-full">
                              <h4 className="font-bold text-gray-900 group-hover:text-purple-700 transition-colors duration-200 w-full mt-4 text-lg">
                                {formatCamelCase(exercise.name || "")}
                              </h4>
                              <Badge
                                className={`${typeStyle.badge} transition-all duration-200 group-hover:scale-105 absolute -top-2 -right-2 px-3 py-1`}
                              >
                                <span className="flex items-center gap-1.5 font-medium">
                                  {typeStyle.icon}
                                  {formatCamelCase(exercise.category || "")}
                                </span>
                              </Badge>
                            </div>
                            <div className="space-y-3 text-sm text-gray-600 mt-4">
                              {exercise.target && (
                                <p className="flex items-center gap-3 group-hover:text-gray-700 transition-colors duration-200">
                                  <div className="p-1.5 bg-white/80 rounded-lg">
                                    <Target className="h-4 w-4 text-gray-500 group-hover:text-purple-500 transition-colors duration-200" />
                                  </div>
                                  <span className="font-medium">{formatCamelCase(exercise.target)}</span>
                                </p>
                              )}
                              {exercise.equipment && (
                                <p className="flex items-center gap-3 group-hover:text-gray-700 transition-colors duration-200">
                                  <div className="p-1.5 bg-white/80 rounded-lg">
                                    <Dumbbell className="h-4 w-4 text-gray-500 group-hover:text-purple-500 transition-colors duration-200" />
                                  </div>
                                  <span className="font-medium">Equipment: {formatCamelCase(exercise.equipment)}</span>
                                </p>
                              )}
                              {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
                                <p className="flex items-center gap-3 group-hover:text-gray-700 transition-colors duration-200">
                                  <div className="p-1.5 bg-white/80 rounded-lg">
                                    <Zap className="h-4 w-4 text-gray-500 group-hover:text-purple-500 transition-colors duration-200" />
                                  </div>
                                  <span className="font-medium">Secondary: {formatArray(exercise.secondaryMuscles)}</span>
                                </p>
                              )}
                              {exercise.bodyPart && (
                                <p className="flex items-center gap-3 group-hover:text-gray-700 transition-colors duration-200">
                                  <div className="p-1.5 bg-white/80 rounded-lg">
                                    <Heart className="h-4 w-4 text-gray-500 group-hover:text-purple-500 transition-colors duration-200" />
                                  </div>
                                  <span className="font-medium">{formatCamelCase(exercise.bodyPart)}</span>
                                </p>
                              )}
                              {exercise.difficulty && (
                                <p className="flex items-center gap-3 group-hover:text-gray-700 transition-colors duration-200">
                                  <div className="p-1.5 bg-white/80 rounded-lg">
                                    <Leaf className="h-4 w-4 text-gray-500 group-hover:text-purple-500 transition-colors duration-200" />
                                  </div>
                                  <span className="font-medium">{formatCamelCase(exercise.difficulty)}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="flex items-center justify-center h-32 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border-2 border-dashed border-gray-200">
                      <div className="text-center space-y-2">
                        <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                          <RotateCcw className="h-6 w-6 text-gray-400" />
                        </div>
                        <span className="text-gray-500 font-semibold text-lg">Rest Day</span>
                        <p className="text-gray-400 text-sm">Take time to recover</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}

const HorizontalView = ({ onExerciseClick, planReloading }: { onExerciseClick: (exercise: Exercise) => void, planReloading: boolean }) => {
  const { planningList, error } = usePlanningStore()

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="text-red-500 text-lg font-medium">Something went wrong</div>
          <div className="text-gray-500 text-sm">{error}</div>
        </div>
      </div>
    )
  }

  if (!planningList || planningList.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center">
            <Calendar className="h-8 w-8 text-purple-500" />
          </div>
          <div className="text-gray-600 font-medium">No workout plan available</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Day Headers */}
      <div className="grid grid-cols-7 rounded-2xl overflow-hidden shadow-lg shadow-purple-500/20">
        {allDaysOfWeek.map((dayNum) => {
          const dayStyle = getDayStyle(dayNum)
          return (
            <div
              key={dayNum}
              className={`p-6 bg-gradient-to-br ${dayStyle.gradient} text-white text-center relative overflow-hidden ${
                dayStyle.isWeekend ? "bg-black/20" : ""
              }`}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="relative">
                <h3 className="font-bold text-lg">{getDayName(dayNum)}</h3>
                <p className="text-white/80 text-sm mt-1">
                  {(() => {
                    const day = planningList.find((d) => d.dayOfWeek === dayNum)
                    return day && day.exercises.length > 0 ? `${day.exercises.length} exercises` : "Rest"
                  })()}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Exercise Content */}
      {planReloading ? (
        <div className="flex justify-center items-center py-12">
          <span className="w-8 h-8 border-4 border-purple-300 border-t-transparent rounded-full animate-spin inline-block"></span>
          <span className="ml-3 text-purple-500 font-medium text-lg">Reloading plan...</span>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-4 min-h-[600px]">
          {allDaysOfWeek.map((dayNum) => {
            const day = planningList.find((d) => d.dayOfWeek === dayNum)
            return (
              <div key={dayNum} className="space-y-4">
                {day && day.exercises.length > 0 ? (
                  day.exercises.map((exercise, index) => {
                    if (!exercise) return null
                    const typeStyle = getExerciseTypeStyle(exercise.category || "")
                    return (
                      <div
                        key={index}
                        onClick={() => onExerciseClick(exercise)}
                        className={`p-4 rounded-xl border-l-4 ${typeStyle.accent} ${typeStyle.cardBg} 
                          transition-all duration-300 ease-in-out
                          hover:shadow-lg hover:shadow-black/10 hover:-translate-y-1 
                          group cursor-pointer relative border border-white/50`}
                      >
                        <div className="flex flex-col w-full">
                          <div className="relative w-full">
                            <h4 className="font-bold text-gray-900 group-hover:text-purple-700 transition-colors duration-200 w-full mt-4 text-sm leading-tight">
                              {formatCamelCase(exercise.name || "")}
                            </h4>
                            <Badge
                              className={`${typeStyle.badge} transition-all duration-200 group-hover:scale-105 absolute -top-2 -right-2 px-2 py-0.5 text-xs`}
                            >
                              <span className="flex items-center gap-1">
                                {typeStyle.icon}
                                {formatCamelCase(exercise.category || "").split(" ")[0]}
                              </span>
                            </Badge>
                          </div>
                          <div className="space-y-2 text-xs text-gray-600 mt-3">
                            {exercise.target && (
                              <p className="flex items-center gap-2 group-hover:text-gray-700 transition-colors duration-200">
                                <Target className="h-3 w-3 text-gray-400 group-hover:text-purple-400 transition-colors duration-200 flex-shrink-0" />
                                <span className="font-medium truncate">{formatCamelCase(exercise.target)}</span>
                              </p>
                            )}
                            {exercise.bodyPart && (
                              <p className="flex items-center gap-2 group-hover:text-gray-700 transition-colors duration-200">
                                <Heart className="h-3 w-3 text-gray-400 group-hover:text-purple-400 transition-colors duration-200 flex-shrink-0" />
                                <span className="font-medium truncate">{formatCamelCase(exercise.bodyPart)}</span>
                              </p>
                            )}
                            {exercise.difficulty && (
                              <p className="flex items-center gap-2 group-hover:text-gray-700 transition-colors duration-200">
                                <Leaf className="h-3 w-3 text-gray-400 group-hover:text-purple-400 transition-colors duration-200 flex-shrink-0" />
                                <span className="font-medium truncate">{formatCamelCase(exercise.difficulty)}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="flex items-center justify-center h-32 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border-2 border-dashed border-gray-200">
                    <div className="text-center space-y-2">
                      <div className="w-8 h-8 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                        <RotateCcw className="h-4 w-4 text-gray-400" />
                      </div>
                      <span className="text-gray-500 font-semibold text-sm">Rest Day</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const AnimatedEllipsis = () => {
  return (
    <span style={{ display: "inline-block", minWidth: 18 }}>
      <motion.span
        key="dot1"
        animate={{ opacity: [0.2, 1, 0.2] }}
        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1, delay: 0 }}
        style={{ marginLeft: 1 }}
      >
        .
      </motion.span>
      <motion.span
        key="dot2"
        animate={{ opacity: [0.2, 1, 0.2] }}
        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1, delay: 0.2 }}
        style={{ marginLeft: 1 }}
      >
        .
      </motion.span>
      <motion.span
        key="dot3"
        animate={{ opacity: [0.2, 1, 0.2] }}
        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1, delay: 0.4 }}
        style={{ marginLeft: 1 }}
      >
        .
      </motion.span>
    </span>
  )
}

export default WeeklySchedule
