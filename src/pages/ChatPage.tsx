import { useEffect, useState, useRef } from "react"
import { signalRService } from "../services/signalRService"
import { useAuthStore } from "@/store/AuthStore"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send, Search, MoreVertical, Phone, Video, Users, User, Bell, Search as SearchIcon, FileText, Image, Lock, CheckCircle, Eye, Ban, Block, AlertCircle } from "lucide-react"

interface ChatItem {
  id: string
  name: string
  avatar: string
  lastMessage: string
  lastTime: string
  unread: number
  isGroup?: boolean
}

interface Message {
  id: string
  senderId: string
  senderName: string
  senderAvatar: string
  content: string
  timestamp: string
  type?: "text" | "image" | "audio" | "video"
  reactions?: { emoji: string; count: number }[]
}

const mockChats: ChatItem[] = [
  { id: "1", name: "Design chat", avatar: "https://ui-avatars.com/api/?name=DC", lastMessage: "Jessie Rollins sent a voice message", lastTime: "2m", unread: 1, isGroup: true },
  { id: "2", name: "Osman Campos", avatar: "https://randomuser.me/api/portraits/men/32.jpg", lastMessage: "You: Hey! We are ready...", lastTime: "4m", unread: 0 },
  { id: "3", name: "Jayden Church", avatar: "https://randomuser.me/api/portraits/men/33.jpg", lastMessage: "I prepared some varia...", lastTime: "1h", unread: 0 },
  { id: "4", name: "Jacob Mcleod", avatar: "https://randomuser.me/api/portraits/men/34.jpg", lastMessage: "And send me the proto...", lastTime: "10m", unread: 3 },
  { id: "5", name: "Jasmin Lowery", avatar: "https://randomuser.me/api/portraits/women/32.jpg", lastMessage: "You: Ok! Let's discuss it on th...", lastTime: "20m", unread: 0 },
]

const mockMessages: Message[] = [
  { id: "m1", senderId: "5", senderName: "Jasmin Lowery", senderAvatar: "https://randomuser.me/api/portraits/women/32.jpg", content: "I added new flows to our design system. Now you can use them for your projects!", timestamp: "2024-06-01T09:20:00", reactions: [{ emoji: "👍", count: 4 }] },
  { id: "m2", senderId: "6", senderName: "Alex Hunt", senderAvatar: "https://randomuser.me/api/portraits/men/35.jpg", content: "Hey guys! Important news!", timestamp: "2024-06-01T09:24:00", reactions: [{ emoji: "👀", count: 16 }] },
  { id: "m3", senderId: "6", senderName: "Alex Hunt", senderAvatar: "https://randomuser.me/api/portraits/men/35.jpg", content: "Our intern @jchurch has successfully completed his probationary period and is now part of our team!", timestamp: "2024-06-01T09:24:00", reactions: [{ emoji: "🎉", count: 5 }, { emoji: "👍", count: 4 }] },
  { id: "m4", senderId: "me", senderName: "You", senderAvatar: "https://randomuser.me/api/portraits/women/36.jpg", content: "Jaden, my congratulations! I will be glad to work with you on a new project 😊", timestamp: "2024-06-01T09:27:00" },
  { id: "m5", senderId: "5", senderName: "Jessie Rollins", senderAvatar: "https://randomuser.me/api/portraits/women/37.jpg", content: "https://images.unsplash.com/photo-1506744038136-46273834b3fb", timestamp: "2024-06-01T09:30:00", type: "image" },
  { id: "m6", senderId: "5", senderName: "Jessie Rollins", senderAvatar: "https://randomuser.me/api/portraits/women/37.jpg", content: "audio.mp3", timestamp: "2024-06-01T09:32:00", type: "audio" },
]

export function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(mockMessages)
  const [newMessage, setNewMessage] = useState("")
  const [selectedChat, setSelectedChat] = useState<ChatItem>(mockChats[0])
  const [showTimeMsg, setShowTimeMsg] = useState<string | null>(null)
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { basicInfo } = useAuthStore()
  const connection = signalRService.getConnection()

  // Mock user info for sidebar
  const userInfo = {
    name: "Le Ngoc Phuong Khanh",
    avatar: "https://ui-avatars.com/api/?name=Le+Ngoc+Phuong+Khanh",
    encrypted: true,
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleMouseEnter = (id: string) => {
    hoverTimeout.current = setTimeout(() => {
      setShowTimeMsg(id)
    }, 500)
  }
  const handleMouseLeave = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current)
    setShowTimeMsg(null)
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !connection) return
    // Here you would send the message via SignalR
    setMessages(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        senderId: "me",
        senderName: "You",
        senderAvatar: basicInfo?.avatar || "https://randomuser.me/api/portraits/women/36.jpg",
        content: newMessage,
        timestamp: new Date().toISOString(),
      },
    ])
    setNewMessage("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-[#f7f7fa]">
      {/* Chat List */}
      <div className="w-80 border-r bg-white flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 bg-[#edeef2] rounded-lg px-3 py-2">
            <Search className="h-4 w-4 text-gray-500" />
            <input
              className="bg-transparent outline-none flex-1 text-sm text-[#222] placeholder-gray-500"
              placeholder="Search"
            />
          </div>
        </div>
        <div className="overflow-y-auto flex-1">
          {mockChats.map(chat => (
            <div
              key={chat.id}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#f3f2fa] transition group ${selectedChat.id === chat.id ? "bg-[#e5e7eb]" : ""}`}
              onClick={() => setSelectedChat(chat)}
            >
              <img
                src={chat.avatar}
                alt={chat.name}
                className="h-10 w-10 rounded-full object-cover border border-gray-200"
              />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="font-medium truncate text-[#222]">{chat.name}</span>
                  <span className="text-xs text-gray-400 ml-2">{chat.lastTime}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 truncate">{chat.lastMessage}</span>
                  {chat.unread > 0 && (
                    <span className="ml-2 bg-[#de9151] text-white text-xs rounded-full px-2 py-0.5">{chat.unread}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b bg-white">
          <div className="flex items-center gap-4">
            <img
              src={selectedChat.avatar}
              alt={selectedChat.name}
              className="h-12 w-12 rounded-full object-cover border border-gray-200"
            />
            <div>
              <div className="font-semibold text-lg text-[#222]">{selectedChat.name}</div>
              <div className="text-xs text-gray-500">23 members, 10 online</div>
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
        <div className="flex-1 flex overflow-y-auto">
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-1 bg-[#f7f7fa]">
            {messages.map((message, idx) => {
              const isMe = message.senderId === "me"
              const prevMsg = idx > 0 ? messages[idx - 1] : null
              const isFirstOfGroup = !prevMsg || prevMsg.senderId !== message.senderId
              const isLastOfGroup = idx === messages.length - 1 || messages[idx + 1].senderId !== message.senderId
              return (
                <div key={message.id} className={`flex ${isMe ? "justify-end" : "justify-start"} ${isFirstOfGroup ? "mt-4" : "mt-0"}`}>
                  {!isMe && (
                    <div className="flex flex-col items-end">
                      {isFirstOfGroup ? (
                        <img
                          src={message.senderAvatar}
                          alt={message.senderName}
                          className="h-8 w-8 rounded-full object-cover mr-3 mt-1"
                          style={{ marginRight: 12 }}
                        />
                      ) : (
                        <div style={{ width: 32, height: 8, marginRight: 12 }} />
                      )}
                    </div>
                  )}
                  <div className="max-w-[70%] relative flex flex-col items-start">
                    <div
                      className={`rounded-2xl shadow-sm mb-1 text-sm ${
                        isMe ? "bg-[#de9151] text-white" : "bg-white text-gray-900"
                      } ${isFirstOfGroup ? "rounded-t-2xl" : "rounded-t-md"} ${isLastOfGroup ? "rounded-b-2xl" : "rounded-b-md"} ${message.type === "image" || message.type === "video" ? "px-0 py-0" : "px-4 py-2"}`}
                      onMouseEnter={() => handleMouseEnter(message.id)}
                      onMouseLeave={handleMouseLeave}
                    >
                      {message.type === "image" ? (
                        <img src={message.content} alt="media" className="w-full block rounded-b-2xl" />
                      ) : message.type === "video" ? (
                        <video controls src={message.content} className="w-full block rounded-b-2xl" />
                      ) : message.type === "audio" ? (
                        <audio controls src={message.content} className="w-full" />
                      ) : (
                        <span>{message.content}</span>
                      )}
                      {showTimeMsg === message.id && (
                        <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 shadow z-10 whitespace-nowrap">
                          {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      )}
                    </div>
                  </div>
                  {isMe && isFirstOfGroup && (
                    <img
                      src={basicInfo?.avatar || "https://randomuser.me/api/portraits/women/36.jpg"}
                      alt="You"
                      className="h-8 w-8 rounded-full object-cover ml-3 mt-1"
                    />
                  )}
                  {isMe && !isFirstOfGroup && (
                    <div style={{ width: 32, height: 8, marginLeft: 12 }} />
                  )}
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
          {/* Right Sidebar */}
          <aside className="hidden lg:flex flex-col w-[340px] bg-[#18191a] text-white rounded-xl ml-4 p-6 shadow-lg h-full max-h-[calc(100vh-4rem)] sticky top-0">
            <div className="flex flex-col items-center mb-6">
              <img src={userInfo.avatar} alt={userInfo.name} className="w-20 h-20 rounded-full mb-2" />
              <div className="font-semibold text-lg text-center">{userInfo.name}</div>
              {userInfo.encrypted && (
                <div className="flex items-center gap-2 bg-[#232526] text-xs px-3 py-1 rounded-full mt-2 mb-1">
                  <Lock className="w-4 h-4" /> End-to-end encrypted
                </div>
              )}
              <div className="flex gap-4 mt-3">
                <button className="flex flex-col items-center text-white/80 hover:text-white">
                  <User className="w-6 h-6 mb-1" />
                  <span className="text-xs">Profile</span>
                </button>
                <button className="flex flex-col items-center text-white/80 hover:text-white">
                  <Bell className="w-6 h-6 mb-1" />
                  <span className="text-xs">Mute</span>
                </button>
                <button className="flex flex-col items-center text-white/80 hover:text-white">
                  <SearchIcon className="w-6 h-6 mb-1" />
                  <span className="text-xs">Search</span>
                </button>
              </div>
            </div>
            <div className="space-y-6 text-sm">
              <div>
                <div className="font-semibold mb-2">Chat Info</div>
                <div className="text-gray-300">Group or direct chat details here.</div>
              </div>
              <div>
                <div className="font-semibold mb-2">Customise chat</div>
                <div className="text-gray-300">Theme, emoji, etc.</div>
              </div>
              <div>
                <div className="font-semibold mb-2 flex items-center gap-2"><Image className="w-4 h-4" /> Media and files</div>
                <div className="flex gap-4 mb-2">
                  <button className="flex items-center gap-2 text-gray-300 hover:text-white"><Image className="w-4 h-4" /> Media</button>
                  <button className="flex items-center gap-2 text-gray-300 hover:text-white"><FileText className="w-4 h-4" /> Files</button>
                </div>
              </div>
              <div>
                <div className="font-semibold mb-2">Privacy and support</div>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-gray-300"><Bell className="w-4 h-4" /> Mute notifications</li>
                  <li className="flex items-center gap-2 text-gray-300"><Eye className="w-4 h-4" /> Disappearing Messages</li>
                  <li className="flex items-center gap-2 text-gray-300"><CheckCircle className="w-4 h-4" /> Read receipts <span className="ml-1 text-xs">On</span></li>
                  <li className="flex items-center gap-2 text-gray-300"><Lock className="w-4 h-4" /> Verify end-to-end encryption</li>
                  <li className="flex items-center gap-2 text-gray-300"><Ban className="w-4 h-4" /> Restrict</li>
                  <li className="flex items-center gap-2 text-gray-300"><Block className="w-4 h-4" /> Block</li>
                  <li className="flex items-center gap-2 text-gray-300"><AlertCircle className="w-4 h-4" /> Report <span className="ml-1 text-xs text-gray-400">Give feedback and report the conversation</span></li>
                </ul>
              </div>
            </div>
          </aside>
        </div>

        {/* Message Input */}
        <div className="px-8 py-5 bg-white border-t">
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
    </div>
  )
} 