"use client"

import { useState, useRef, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { useAuthStore } from "@/store/AuthStore"
import { useSocialStore } from "@/store/SocialStore"
import {
  BellRing,
  MessageSquare,
  User,
  Edit,
  Award,
  Moon,
  LogOut,
  Settings,
  CreditCard,
  PenSquare,
  Home,
  Calendar,
  Dumbbell,
  Users,
  Clock,
  Search,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { CreatePostModal } from "@/components/ui/create-post-modal"
import { Input } from "@/components/ui/input"
import { useDebounce } from "@/hooks/useDebounce"

export function TopBar() {
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
      if (
        searchResultsRef.current &&
        !searchResultsRef.current.contains(event.target as Node)
      ) {
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

  const tabs = [
    { icon: Home, label: "Home", path: "/" },
    { icon: MessageSquare, label: "Chat", path: "/chat" },
    { icon: Calendar, label: "Appointments", path: "/appointments" },
    { icon: Clock, label: "Schedule", path: "/schedule" },
    { icon: Users, label: "My Clients", path: "/clients" },
    { icon: Dumbbell, label: "Training Programs", path: "/programs" },
  ]

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white border-b shadow-sm backdrop-blur-sm bg-opacity-95">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center space-x-4 flex-1 max-w-xs">
            <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
              <img
                src="https://ui-avatars.com/api/?name=Lift+Net&background=de9151&color=fff&bold=true"
                alt="LiftNet Logo"
                className="h-8 w-8 rounded-full"
              />
            </Link>

            <form onSubmit={handleSearch} className="relative flex-1 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search people..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setShowSearchResults(true)
                  }}
                  className="pl-10 w-full bg-gray-50 border-gray-200 focus:border-[#de9151] focus:ring-[#de9151] rounded-full"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
                )}
              </div>

              {showSearchResults && searchResults.length > 0 && (
                <div
                  ref={searchResultsRef}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border max-h-96 overflow-y-auto"
                  onScroll={handleScroll}
                >
                  {searchResults.map((user) => (
                    <Link
                      key={user.id}
                      to={`/profile/${user.id}`}
                      className="flex items-center p-2 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowSearchResults(false)}
                    >
                      <img
                        src={user.avatar || "https://randomuser.me/api/portraits/men/32.jpg"}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="h-8 w-8 rounded-full object-cover mr-2"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {user.firstName} {user.lastName}
                          </span>
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            {user.role === 1 ? "User" : "PT"}
                          </span>
                          {user.isFollowing && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#de9151]/10 text-[#de9151]">
                              Following
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {user.email}
                        </div>
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

          <nav className="flex-1 flex justify-center space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = tab.path === "/appointments" 
                ? location.pathname.startsWith("/appointments")
                : tab.path === "/chat"
                ? location.pathname.startsWith("/chat")
                : location.pathname === tab.path
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={`relative px-6 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "text-[#de9151]"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <Icon className={`h-6 w-6 ${isActive ? "text-[#de9151]" : "text-gray-500"}`} />
                    <span className="text-xs mt-0.5">{tab.label}</span>
                  </div>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#de9151] rounded-t-full" />
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center justify-end flex-1 max-w-xs space-x-3">
            <Button
              variant="default"
              size="default"
              className="rounded-full px-4 py-2 bg-[#de9151] hover:bg-[#c27339] text-white shadow-md hover:shadow-lg transform transition-all duration-200 hover:scale-105"
              onClick={() => setShowCreateModal(true)}
            >
              <PenSquare className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Create</span>
            </Button>

            <Button 
              variant="ghost" 
              size="default"
              className="rounded-full bg-gray-50 hover:bg-gray-100 p-4 shadow-sm hover:shadow-md transform transition-all duration-200 hover:scale-105 relative"
            >
              <div className="relative">
                <BellRing className="h-9 w-9 text-gray-700 stroke-[1.5]" />
                <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white border-2 border-white animate-pulse shadow-sm">
                  2
                </span>
              </div>
            </Button>

            <div className="relative">
              <button
                ref={profileButtonRef}
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center hover:opacity-80 transition-opacity"
              >
                <img
                  src={basicInfo?.avatar || "https://randomuser.me/api/portraits/men/32.jpg"}
                  alt="User Avatar"
                  className="h-8 w-8 rounded-full border-2 border-[#de9151]/20 object-cover"
                />
              </button>

              {showProfileMenu && (
                <div
                  ref={profileMenuRef}
                  className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border overflow-hidden z-50 animate-in fade-in zoom-in"
                >
                  <div className="p-4 border-b">
                    <div className="flex items-center">
                      <img
                        src={basicInfo?.avatar || "https://randomuser.me/api/portraits/men/32.jpg"}
                        alt="User Avatar"
                        className="h-10 w-10 rounded-full object-cover mr-3"
                      />
                      <div>
                        <div className="font-medium">
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
                      className="flex items-center px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <User className="h-4 w-4 mr-3 text-gray-500" />
                      View Profile
                    </Link>
                    <Link
                      to="/profile/edit"
                      className="flex items-center px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <Edit className="h-4 w-4 mr-3 text-gray-500" />
                      Edit Profile
                    </Link>
                    <Link
                      to="/achievements"
                      className="flex items-center px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <Award className="h-4 w-4 mr-3 text-gray-500" />
                      <span>Achievements</span>
                      <span className="ml-auto text-xs text-gray-500">3 unlocked</span>
                    </Link>

                    <button
                      className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                      onClick={toggleDarkMode}
                    >
                      <Moon className="h-4 w-4 mr-3 text-gray-500" />
                      Dark Mode
                      <div className="ml-auto">
                        <div
                          className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200 ${
                            darkMode ? "bg-[#de9151]" : "bg-gray-200"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
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
                      className="flex items-center px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <Settings className="h-4 w-4 mr-3 text-gray-500" />
                      Settings
                    </Link>
                    <Link
                      to="/premium"
                      className="flex items-center px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <CreditCard className="h-4 w-4 mr-3 text-gray-500" />
                      Premium Membership
                    </Link>
                  </div>

                  <div className="border-t py-1">
                    <button
                      className="flex items-center w-full px-4 py-2 text-sm text-red-500 hover:bg-gray-100 transition-colors"
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
