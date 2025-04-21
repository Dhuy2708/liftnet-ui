"use client"

import { useState, useRef, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuthStore } from "@/store/AuthStore"
import { Bell, MessageSquare, Search, Menu, User, Edit, Award, Moon, LogOut, Settings, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"

export function TopBar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { basicInfo, logout } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const profileButtonRef = useRef<HTMLButtonElement>(null)

  // Close dropdown when clicking outside
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
    // Here you would implement actual dark mode toggling
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b shadow-sm">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left section: Logo and Search */}
        <div className="flex items-center flex-1 max-w-md">
          {/* Mobile menu button */}
          <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="mr-2 md:hidden">
            <Menu className="h-5 w-5" />
          </Button>

          {/* Logo */}
          <Link to="/" className="flex items-center mr-4">
            <img
              src="https://ui-avatars.com/api/?name=Lift+Net&background=de9151&color=fff&bold=true"
              alt="LiftNet Logo"
              className="h-8 w-8 rounded-full"
            />
            <span className="ml-2 font-bold text-lg hidden sm:inline">LiftNet</span>
          </Link>

          {/* Search bar */}
          <div className="relative flex-1 max-w-xs">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search LiftNet"
              className="w-full py-1.5 pl-10 pr-4 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#de9151]/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Center section: App name or quote */}
        <div className="hidden md:flex items-center justify-center flex-1">
          <p className="text-[#de9151] font-medium">Connect. Train. Transform.</p>
        </div>

        {/* Right section: Notifications and Profile */}
        <div className="flex items-center justify-end flex-1 max-w-md space-x-2">
          <Button variant="ghost" size="icon" className="rounded-full bg-gray-100">
            <MessageSquare className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="icon" className="rounded-full bg-gray-100">
            <div className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                2
              </span>
            </div>
          </Button>

          <div className="relative ml-2">
            <button
              ref={profileButtonRef}
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center"
            >
              <img
                src="https://randomuser.me/api/portraits/men/32.jpg"
                alt="User Avatar"
                className="h-8 w-8 rounded-full border-2 border-[#de9151]/20 object-cover"
              />
            </button>

            {/* Profile dropdown menu */}
            {showProfileMenu && (
              <div
                ref={profileMenuRef}
                className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border overflow-hidden z-50"
              >
                {/* User info section */}
                <div className="p-4 border-b">
                  <div className="flex items-center">
                    <img
                      src="https://randomuser.me/api/portraits/men/32.jpg"
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

                {/* Menu items */}
                <div className="py-1">
                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <User className="h-4 w-4 mr-3 text-gray-500" />
                    View Profile
                  </Link>
                  <Link
                    to="/profile/edit"
                    className="flex items-center px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <Edit className="h-4 w-4 mr-3 text-gray-500" />
                    Edit Profile
                  </Link>
                  <Link
                    to="/achievements"
                    className="flex items-center px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <Award className="h-4 w-4 mr-3 text-gray-500" />
                    <span>Achievements</span>
                    <span className="ml-auto text-xs text-gray-500">3 unlocked</span>
                  </Link>

                  <button
                    className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={toggleDarkMode}
                  >
                    <Moon className="h-4 w-4 mr-3 text-gray-500" />
                    Dark Mode
                    <div className="ml-auto">
                      <div
                        className={`relative inline-flex h-5 w-10 items-center rounded-full ${darkMode ? "bg-[#de9151]" : "bg-gray-200"}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${darkMode ? "translate-x-5" : "translate-x-1"}`}
                        />
                      </div>
                    </div>
                  </button>
                </div>

                <div className="border-t py-1">
                  <Link
                    to="/settings"
                    className="flex items-center px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <Settings className="h-4 w-4 mr-3 text-gray-500" />
                    Settings
                  </Link>
                  <Link
                    to="/premium"
                    className="flex items-center px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <CreditCard className="h-4 w-4 mr-3 text-gray-500" />
                    Premium Membership
                  </Link>
                </div>

                <div className="border-t py-1">
                  <button
                    className="flex items-center w-full px-4 py-2 text-sm text-red-500 hover:bg-gray-100"
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
  )
}
