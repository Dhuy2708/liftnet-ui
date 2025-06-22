"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuthStore } from "@/store/AuthStore"
import { useSocialStore } from "@/store/SocialStore"
import { useWalletStore } from "@/store/WalletStore"
import { useNotificationStore } from "@/store/NotificationStore"
import {
  Bell,
  MessageSquare,
  User,
  Edit3,
  Trophy,
  Moon,
  LogOut,
  Settings,
  Search,
  Loader2,
  Sparkles,
  Menu,
  X,
  Plus,
  Coins,
  Crown,
  Calendar,
  CheckCircle2,
  XCircle,
  UserPlus,
  UserCheck,
  UserX,
  Heart,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { CreatePostModal } from "@/components/ui/create-post-modal"
import { Input } from "@/components/ui/input"
import { useDebounce } from "@/hooks/useDebounce"

interface TopBarProps {
  toggleLeftSidebar: () => void
  showLeftSidebar: boolean
}

export function TopBar({ toggleLeftSidebar, showLeftSidebar }: TopBarProps) {
  const { basicInfo, logout } = useAuthStore()
  const { searchPrioritizedUsers, searchResults, hasMore, currentPage, clearSearchResults } = useSocialStore()
  const { balance, getBalance } = useWalletStore()
  const { notifications: notificationStoreNotifications, isLoading, hasMore: notificationStoreHasMore, fetchNotifications, pageNumber, pageSize } = useNotificationStore()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const searchResultsRef = useRef<HTMLDivElement>(null)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const profileButtonRef = useRef<HTMLButtonElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)
  const debouncedSearch = useDebounce(searchQuery, 500)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  useEffect(() => {
    if (debouncedSearch) {
      searchPrioritizedUsers(debouncedSearch, 1).finally(() => {
        setShowSearchResults(true)
      })
    } else {
      clearSearchResults()
    }
  }, [debouncedSearch])

  useEffect(() => {
    getBalance()
  }, [])

  useEffect(() => {
    if (showNotifications) {
      fetchNotifications(1, pageSize)
    }
  }, [showNotifications])

  const handleLogout = async () => {
    await logout()
    setShowProfileMenu(false)
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery) {
      searchPrioritizedUsers(searchQuery, 1).finally(() => {
        setShowSearchResults(true)
      })
    }
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    const bottom = scrollHeight - scrollTop <= clientHeight * 1.5

    if (bottom && hasMore && !isLoading) {
      const nextPage = currentPage + 1
      searchPrioritizedUsers(searchQuery, nextPage).finally(() => {
        setShowSearchResults(true)
      })
    }
  }

  const handleNotificationClick = () => {
    setShowNotifications(false)
  }

  const handleNotificationScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    const bottom = scrollHeight - scrollTop <= clientHeight * 1.5

    if (bottom && notificationStoreHasMore && !isLoading) {
      fetchNotifications(pageNumber + 1, pageSize)
    }
  }

  const getNotificationIcon = (eventType: number) => {
    switch (eventType) {
      case 1: // Book Appointment
        return <Calendar className="h-5 w-5 text-blue-500" />
      case 2: // Accept Appointment
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 3: // Cancel Appointment
        return <XCircle className="h-5 w-5 text-red-500" />
      case 10: // Apply Finder
        return <UserPlus className="h-5 w-5 text-purple-500" />
      case 11: // Accept Finder
        return <UserCheck className="h-5 w-5 text-emerald-500" />
      case 12: // Reject Finder
        return <UserX className="h-5 w-5 text-rose-500" />
      case 20: // Follow
        return <Heart className="h-5 w-5 text-pink-500" />
      default:
        return <Bell className="h-5 w-5 text-[#de9151]" />
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="flex h-14 items-center px-4">
          {/* Left section with logo and mobile menu */}
          <div className="flex items-center w-[200px]">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLeftSidebar}
              className="lg:hidden rounded-xl p-2 hover:bg-gray-50 transition-all duration-200 mr-2 group"
              aria-label={showLeftSidebar ? "Close sidebar" : "Open sidebar"}
            >
              {showLeftSidebar ? (
                <X className="h-5 w-5 text-gray-600 group-hover:text-gray-900 transition-colors" />
              ) : (
                <Menu className="h-5 w-5 text-gray-600 group-hover:text-gray-900 transition-colors" />
              )}
            </Button>

            <Link to="/" className="flex items-center hover:opacity-80 transition-all duration-200">
              <div className="relative">
                <img src="https://res.cloudinary.com/dvwgt4tm1/image/upload/v1750584547/new_rd8xyq.png" alt="LiftNet Logo" className="h-8 object-contain" />
              </div>
            </Link>
          </div>

          {/* Search bar */}
          <div className="flex-1 flex justify-center">
            <div className="w-full max-w-xl">
              <form onSubmit={handleSearch} className="relative w-full">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-[#de9151] transition-colors" />
                  <Input
                    type="text"
                    placeholder="Search LiftNet"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setShowSearchResults(true)
                    }}
                    className="pl-10 w-full bg-gray-50 border-0 focus:bg-white focus:ring-2 focus:ring-[#de9151]/20 focus:border-[#de9151] rounded-full h-9 transition-all duration-200 shadow-sm hover:shadow-md"
                  />
                  {isLoading && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#de9151] animate-spin" />
                  )}
                </div>

                {showSearchResults && searchResults.length > 0 && (
                  <div
                    ref={searchResultsRef}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 max-h-96 overflow-y-auto z-50 backdrop-blur-sm"
                    onScroll={handleScroll}
                  >
                    {searchResults.map((user, index) => (
                      <Link
                        key={user.id}
                        to={`/profile/${user.id}`}
                        className={`flex items-center p-4 hover:bg-gray-50 transition-all duration-200 group ${
                          index === 0 ? "rounded-t-2xl" : ""
                        } ${index === searchResults.length - 1 ? "rounded-b-2xl" : ""}`}
                        onClick={() => setShowSearchResults(false)}
                      >
                        <div className="relative">
                          <img
                            src={user.avatar || "https://randomuser.me/api/portraits/men/32.jpg"}
                            alt={`${user.firstName} ${user.lastName}`}
                            className="h-10 w-10 rounded-full object-cover mr-3 ring-2 ring-gray-100 group-hover:ring-[#de9151]/20 transition-all"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold truncate text-gray-900 group-hover:text-[#de9151] transition-colors">
                              {user.firstName} {user.lastName}
                            </span>
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
                              {user.role === 1 ? "User" : "PT"}
                            </span>
                            {user.isFollowing && (
                              <span className="text-xs px-2 py-1 rounded-full bg-[#de9151]/10 text-[#de9151] font-medium">
                                Following
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 truncate">{user.email}</div>
                        </div>
                      </Link>
                    ))}
                    {isLoading && (
                      <div className="flex items-center justify-center p-4 border-t border-gray-100">
                        <Loader2 className="h-4 w-4 text-[#de9151] animate-spin mr-2" />
                        <span className="text-sm text-gray-500 font-medium">Loading more results...</span>
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Right section with actions */}
          <div className="flex items-center ml-4 space-x-1">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl p-2 hover:bg-gray-50 hover:scale-105 transition-all duration-200 group"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-5 w-5 text-gray-600 group-hover:text-[#de9151] transition-colors" />
            </Button>

            <Link to="/wallet">
              <Button
                variant="ghost"
                className="rounded-xl px-3 py-2 hover:bg-gray-50 hover:scale-105 transition-all duration-200 group flex items-center gap-2"
              >
                <span className="text-sm font-semibold text-gray-700 group-hover:text-[#de9151] transition-colors">
                  {balance.toLocaleString()}
                </span>
                <Coins className="h-4 w-4 text-[#de9151]" />
              </Button>
            </Link>

            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl p-2 hover:bg-gray-50 hover:scale-105 transition-all duration-200 group relative"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <div className="relative">
                  <Bell className="h-5 w-5 text-gray-600 group-hover:text-[#de9151] transition-colors" />
                </div>
              </Button>

              {showNotifications && (
                <div
                  ref={notificationsRef}
                  className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in duration-200"
                >
                  <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto" onScroll={handleNotificationScroll}>
                    {notificationStoreNotifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">No notifications</div>
                    ) : (
                      notificationStoreNotifications.map((notification) => (
                        <button
                          key={notification.id}
                          className="w-full text-left p-4 hover:bg-gray-50 transition-all duration-200 border-b border-gray-100 last:border-0"
                          onClick={() => handleNotificationClick()}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                                {getNotificationIcon(notification.eventType)}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-gray-900">{notification.title}</span>
                              </div>
                              <p className="text-sm text-gray-600 mb-1">{notification.body}</p>
                              <div className="text-xs text-gray-500">
                                {new Date(notification.createdAt).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                    {isLoading && (
                      <div className="flex items-center justify-center p-4 border-t border-gray-100">
                        <Loader2 className="h-4 w-4 text-[#de9151] animate-spin mr-2" />
                        <span className="text-sm text-gray-500 font-medium">Loading more notifications...</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link to="/chat" className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl p-2 hover:bg-gray-50 hover:scale-105 transition-all duration-200 group"
              >
                <MessageSquare className="h-5 w-5 text-gray-600 group-hover:text-[#de9151] transition-colors" />
              </Button>
            </Link>

            <div className="relative">
              <button
                ref={profileButtonRef}
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center hover:scale-105 transition-all duration-200 group"
              >
                <div className="relative">
                  <img
                    src={basicInfo?.avatar || "https://randomuser.me/api/portraits/men/32.jpg"}
                    alt="User Avatar"
                    className="h-8 w-8 rounded-full border-2 border-gray-200 group-hover:border-[#de9151] object-cover transition-all duration-200"
                  />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white"></div>
                </div>
              </button>

              {showProfileMenu && (
                <div
                  ref={profileMenuRef}
                  className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in duration-200"
                >
                  <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-100">
                    <div className="flex items-center">
                      <div className="relative mr-3">
                        <img
                          src={basicInfo?.avatar || "https://randomuser.me/api/portraits/men/32.jpg"}
                          alt="User Avatar"
                          className="h-12 w-12 rounded-full object-cover ring-2 ring-white shadow-md"
                        />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white"></div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {basicInfo?.firstName} {basicInfo?.lastName}
                        </div>
                        <div className="text-sm text-gray-600 font-medium">
                          {basicInfo?.role === 1 ? "Fitness Seeker" : "Personal Trainer"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="py-2">
                    <Link
                      to={`/profile/${basicInfo?.id}`}
                      className="flex items-center px-4 py-3 text-sm hover:bg-gray-50 transition-all duration-200 group"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <User className="h-4 w-4 mr-3 text-gray-500 group-hover:text-[#de9151] transition-colors" />
                      <span className="font-medium">View Profile</span>
                    </Link>
                    <Link
                      to="/profile/edit"
                      className="flex items-center px-4 py-3 text-sm hover:bg-gray-50 transition-all duration-200 group"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <Edit3 className="h-4 w-4 mr-3 text-gray-500 group-hover:text-[#de9151] transition-colors" />
                      <span className="font-medium">Edit Profile</span>
                    </Link>
                    <Link
                      to="/achievements"
                      className="flex items-center px-4 py-3 text-sm hover:bg-gray-50 transition-all duration-200 group"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <Trophy className="h-4 w-4 mr-3 text-gray-500 group-hover:text-[#de9151] transition-colors" />
                      <span className="font-medium">Achievements</span>
                      <span className="ml-auto text-xs px-2 py-1 rounded-full bg-[#de9151]/10 text-[#de9151] font-semibold">
                        3
                      </span>
                    </Link>
                    <Link
                      to="/ai-chat"
                      className="flex items-center px-4 py-3 text-sm hover:bg-gray-50 transition-all duration-200 group"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <Sparkles className="h-4 w-4 mr-3 text-gray-500 group-hover:text-[#de9151] transition-colors" />
                      <span className="font-medium">AI Assistant</span>
                      <span className="ml-auto text-xs px-2 py-1 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 font-semibold">
                        NEW
                      </span>
                    </Link>

                    <button
                      className="flex items-center w-full px-4 py-3 text-sm hover:bg-gray-50 transition-all duration-200 group"
                      onClick={toggleDarkMode}
                    >
                      <Moon className="h-4 w-4 mr-3 text-gray-500 group-hover:text-[#de9151] transition-colors" />
                      <span className="font-medium">Dark Mode</span>
                      <div className="ml-auto">
                        <div
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-300 ${
                            darkMode ? "bg-[#de9151] shadow-lg" : "bg-gray-200"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                              darkMode ? "translate-x-4" : "translate-x-0.5"
                            }`}
                          />
                        </div>
                      </div>
                    </button>
                  </div>

                  <div className="border-t border-gray-100 py-2">
                    <Link
                      to="/settings"
                      className="flex items-center px-4 py-3 text-sm hover:bg-gray-50 transition-all duration-200 group"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <Settings className="h-4 w-4 mr-3 text-gray-500 group-hover:text-[#de9151] transition-colors" />
                      <span className="font-medium">Settings</span>
                    </Link>
                    <Link
                      to="/premium"
                      className="flex items-center px-4 py-3 text-sm hover:bg-gray-50 transition-all duration-200 group"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <Crown className="h-4 w-4 mr-3 text-gray-500 group-hover:text-[#de9151] transition-colors" />
                      <span className="font-medium">Premium</span>
                      <span className="ml-auto">
                        <div className="px-2 py-1 rounded-full bg-gradient-to-r from-[#de9151] to-amber-500 text-xs font-bold text-white shadow-md">
                          PRO
                        </div>
                      </span>
                    </Link>
                  </div>

                  <div className="border-t border-gray-100 py-2">
                    <button
                      className="flex items-center w-full px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-all duration-200 group"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4 mr-3 group-hover:text-red-600 transition-colors" />
                      <span className="font-medium">Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <CreatePostModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </>
  )
}
