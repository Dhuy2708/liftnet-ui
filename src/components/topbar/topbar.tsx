"use client"

import { useState, useRef, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { useAuthStore } from "@/store/AuthStore"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { CreatePostModal } from "@/components/ui/create-post-modal"

export function TopBar() {
  const location = useLocation()
  const { basicInfo, logout } = useAuthStore()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const profileButtonRef = useRef<HTMLButtonElement>(null)

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
  }

  const isSeeker = basicInfo?.role === 1
  const isPT = basicInfo?.role === 2

  const tabs = [
    { icon: Home, label: "Home", path: "/" },
    { icon: MessageSquare, label: "Chat", path: "/chat" },
    { icon: Calendar, label: "Appointments", path: "/appointments" },
    ...(isSeeker
      ? [
          { icon: Dumbbell, label: "Find Trainers", path: "/trainers" },
          { icon: Dumbbell, label: "My Workouts", path: "/workouts" },
        ]
      : []),
    ...(isPT
      ? [
          { icon: Users, label: "My Clients", path: "/clients" },
          { icon: Dumbbell, label: "Training Programs", path: "/programs" },
        ]
      : []),
  ]

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white border-b shadow-sm backdrop-blur-sm bg-opacity-95">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex-1 max-w-xs">
            <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
              <img
                src="https://ui-avatars.com/api/?name=Lift+Net&background=de9151&color=fff&bold=true"
                alt="LiftNet Logo"
                className="h-8 w-8 rounded-full"
              />
              <span className="ml-2 font-bold text-lg text-[#de9151]">LiftNet</span>
            </Link>
          </div>

          <nav className="flex-1 flex justify-center space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = location.pathname === tab.path
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
                      to="/profile"
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
