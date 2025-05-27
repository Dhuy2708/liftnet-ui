"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { useAuthStore } from "@/store/AuthStore"
import { useSocialStore } from "@/store/SocialStore"
import {
  BellRing,
  MessageCircle,
  User,
  Edit,
  Award,
  Moon,
  LogOut,
  Settings,
  CreditCard,
  Search,
  Loader2,
  Bot,
  Menu,
  X,
  Plus,
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
  const location = useLocation()
  const { basicInfo, logout } = useAuthStore()
  const { searchPrioritizedUsers, searchResults, hasMore, currentPage, clearSearchResults } = useSocialStore()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const searchResultsRef = useRef<HTMLDivElement>(null)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const profileButtonRef = useRef<HTMLButtonElement>(null)
  const debouncedSearch = useDebounce(searchQuery, 500)

  useEffect(() => {
    if (debouncedSearch) {
      setIsSearching(true)
      searchPrioritizedUsers(debouncedSearch, 1).finally(() => {
        setIsSearching(false)
      })
    } else {
      clearSearchResults()
    }
  }, [debouncedSearch])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        profileButtonRef.current &&
        !profileMenuRef.current.contains(event.target as Node) &&
        !profileButtonRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false)
      }
      if (searchResultsRef.current && !searchResultsRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

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
      setIsSearching(true)
      searchPrioritizedUsers(searchQuery, 1).finally(() => {
        setIsSearching(false)
      })
    }
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    const bottom = scrollHeight - scrollTop <= clientHeight * 1.5

    if (bottom && hasMore && !isSearching) {
      const nextPage = currentPage + 1
      setIsSearching(true)
      searchPrioritizedUsers(searchQuery, nextPage).finally(() => {
        setIsSearching(false)
      })
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-white shadow-sm transition-all duration-300">
        <div className="flex h-14 items-center px-4">
          {/* Left section with logo and mobile menu */}
          <div className="flex items-center w-[200px]">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLeftSidebar}
              className="lg:hidden rounded-full p-2 hover:bg-gray-100 transition-all duration-300 mr-2"
              aria-label={showLeftSidebar ? "Close sidebar" : "Open sidebar"}
            >
              {showLeftSidebar ? <X className="h-5 w-5 text-gray-600" /> : <Menu className="h-5 w-5 text-gray-600" />}
            </Button>

            <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
              <div className="relative">
                <img
                  src="/logo.png"
                  alt="LiftNet Logo"
                  className="h-8 w-16 full"
                />
              </div>
            </Link>
          </div>

          {/* Search bar */}
          <div className="flex-1 flex justify-center">
            <div className="w-full max-w-xl">
              <form onSubmit={handleSearch} className="relative w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search LiftNet"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setShowSearchResults(true)
                    }}
                    className="pl-10 w-full bg-gray-100 border-gray-200 focus:border-[#de9151] focus:ring-[#de9151] rounded-full h-9"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
                  )}
                </div>

                {showSearchResults && searchResults.length > 0 && (
                  <div
                    ref={searchResultsRef}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-md shadow-lg border max-h-96 overflow-y-auto z-50"
                    onScroll={handleScroll}
                  >
                    {searchResults.map((user) => (
                      <Link
                        key={user.id}
                        to={`/profile/${user.id}`}
                        className="flex items-center p-3 hover:bg-gray-50 transition-colors"
                        onClick={() => setShowSearchResults(false)}
                      >
                        <div className="relative">
                          <img
                            src={user.avatar || "https://randomuser.me/api/portraits/men/32.jpg"}
                            alt={`${user.firstName} ${user.lastName}`}
                            className="h-10 w-10 rounded-full object-cover mr-3"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">
                              {user.firstName} {user.lastName}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                              {user.role === 1 ? "User" : "PT"}
                            </span>
                            {user.isFollowing && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-[#de9151]/10 text-[#de9151]">
                                Following
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 truncate">{user.email}</div>
                        </div>
                      </Link>
                    ))}
                    {isSearching && (
                      <div className="flex items-center justify-center p-4 border-t">
                        <Loader2 className="h-5 w-5 text-[#de9151] animate-spin mr-2" />
                        <span className="text-sm text-gray-500">Loading more results...</span>
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Right section with actions */}
          <div className="flex items-center ml-4 space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full p-2 hover:bg-gray-100 transition-all duration-300 relative"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-5 w-5 text-gray-700" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="rounded-full p-2 hover:bg-gray-100 transition-all duration-300 relative"
            >
              <div className="relative">
                <BellRing className="h-5 w-5 text-gray-700" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                  2
                </span>
              </div>
            </Button>

            <Link to="/chat" className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full p-2 hover:bg-gray-100 transition-all duration-300"
              >
                <MessageCircle className="h-5 w-5 text-gray-700" />
              </Button>
            </Link>

            <div className="relative">
              <button
                ref={profileButtonRef}
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center hover:opacity-80 transition-opacity"
              >
                <div className="relative">
                  <img
                    src={basicInfo?.avatar || "https://randomuser.me/api/portraits/men/32.jpg"}
                    alt="User Avatar"
                    className="h-8 w-8 rounded-full border border-gray-200 object-cover"
                  />
                </div>
              </button>

              {showProfileMenu && (
                <div
                  ref={profileMenuRef}
                  className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg border overflow-hidden z-50 animate-in fade-in zoom-in duration-200"
                >
                  <div className="p-3 border-b">
                    <div className="flex items-center">
                      <div className="relative mr-3">
                        <img
                          src={basicInfo?.avatar || "https://randomuser.me/api/portraits/men/32.jpg"}
                          alt="User Avatar"
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {basicInfo?.firstName} {basicInfo?.lastName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {basicInfo?.role === 1 ? "Fitness Seeker" : "Personal Trainer"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="py-1">
                    <Link
                      to={`/profile/${basicInfo?.id}`}
                      className="flex items-center px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <User className="h-4 w-4 mr-3 text-gray-500" />
                      View Profile
                    </Link>
                    <Link
                      to="/profile/edit"
                      className="flex items-center px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <Edit className="h-4 w-4 mr-3 text-gray-500" />
                      Edit Profile
                    </Link>
                    <Link
                      to="/achievements"
                      className="flex items-center px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <Award className="h-4 w-4 mr-3 text-gray-500" />
                      <span>Achievements</span>
                      <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-[#de9151]/10 text-[#de9151]">3</span>
                    </Link>
                    <Link
                      to="/ai-chat"
                      className="flex items-center px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <Bot className="h-4 w-4 mr-3 text-gray-500" />
                      <span>AI Assistant</span>
                    </Link>

                    <button
                      className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                      onClick={toggleDarkMode}
                    >
                      <Moon className="h-4 w-4 mr-3 text-gray-500" />
                      Dark Mode
                      <div className="ml-auto">
                        <div
                          className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-300 ${
                            darkMode ? "bg-[#de9151]" : "bg-gray-200"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
                              darkMode ? "translate-x-5" : "translate-x-1"
                            }`}
                          />
                        </div>
                      </div>
                    </button>
                  </div>

                  <div className="border-t py-1">
                    <Link
                      to="/settings"
                      className="flex items-center px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <Settings className="h-4 w-4 mr-3 text-gray-500" />
                      Settings
                    </Link>
                    <Link
                      to="/premium"
                      className="flex items-center px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <CreditCard className="h-4 w-4 mr-3 text-gray-500" />
                      <span>Premium</span>
                      <span className="ml-auto">
                        <div className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-200 to-yellow-400 text-xs font-medium text-amber-900">
                          PRO
                        </div>
                      </span>
                    </Link>
                  </div>

                  <div className="border-t py-1">
                    <button
                      className="flex items-center w-full px-4 py-2 text-sm text-red-500 hover:bg-gray-50 transition-colors"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Log Out
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
