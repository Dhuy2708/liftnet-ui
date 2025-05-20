import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AppLeftSidebar } from "@/components/layout/AppLeftSidebar"
import { AppRightSidebar } from "@/components/layout/AppRightSidebar"

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

export function AiChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showSidebars, setShowSidebars] = useState(false)

  useEffect(() => {
    setTimeout(() => setShowSidebars(true), 50)
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm your AI fitness assistant. I can help you with workout plans, nutrition advice, and answer your fitness-related questions. What would you like to know?",
        role: 'assistant',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMessage])
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="relative bg-[#f9fafb] min-h-screen flex justify-center">
      <AppLeftSidebar show={showSidebars} />
      
      <main className="mx-auto w-full max-w-4xl px-2 sm:px-4 py-4 z-10">
        <div className="bg-white rounded-xl shadow-sm h-[calc(100vh-8rem)] flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#de9151]/10 flex items-center justify-center">
                <Bot className="w-6 h-6 text-[#de9151]" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">AI Fitness Assistant</h2>
                <p className="text-sm text-gray-500">Ask me anything about fitness and health</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Bot className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <h3 className="font-medium text-lg mb-1">Welcome to AI Assistant</h3>
                  <p className="text-sm">Start a conversation by asking a question</p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-[#de9151]/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-[#de9151]" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-[#de9151] text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-gray-500" />
                    </div>
                  )}
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#de9151]/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-[#de9151]" />
                </div>
                <div className="bg-gray-100 rounded-2xl px-4 py-2">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#de9151]/20"
              />
              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="rounded-xl bg-[#de9151] hover:bg-[#de9151]/90"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </form>
        </div>
      </main>

      <AppRightSidebar show={showSidebars} />
    </div>
  )
} 