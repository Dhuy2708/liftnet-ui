"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import {
  Home,
  Clock,
  BarChart2,
  Calendar,
  Dumbbell,
  Search,
  Menu,
  Sparkles,
  ChevronDown,
  BarChart3,
  User,
  MessageSquare,
  UserCircle,
} from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-mobile"
import { useSideBarStore } from "@/store/SideBarStore"

export function AppLeftSidebar({
  onToggle,
}: {
  onToggle?: () => void
}) {
  const location = useLocation()
  const [role, setRole] = useState<number | null>(null)
  const [show, setShow] = useState(true)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [showPopupDropdown, setShowPopupDropdown] = useState(false)
  const [buttonPosition, setButtonPosition] = useState({ top: 0, left: 0 })
  const [buttonRef, setButtonRef] = useState<HTMLButtonElement | null>(null)
  const isLargeScreen = useMediaQuery("(min-width: 1350px)")
  const { unreadCounts, fetchUnreadCounts } = useSideBarStore()

  useEffect(() => {
    const updateRole = () => {
      const info = localStorage.getItem("basicInfo")
      if (info) {
        try {
          const parsed = JSON.parse(info)
          setRole(parsed.role)
        } catch {
          // ignore
        }
      }
    }
    const updateSidebarShow = () => {
      const sidebarState = localStorage.getItem("sidebarShow")
      setShow(sidebarState === null ? true : sidebarState === "true")
    }
    updateRole()
    updateSidebarShow()
    window.addEventListener("basicInfoChanged", updateRole)
    window.addEventListener("storage", updateRole)
    window.addEventListener("sidebarToggled", updateSidebarShow)
    return () => {
      window.removeEventListener("basicInfoChanged", updateRole)
      window.removeEventListener("storage", updateRole)
      window.removeEventListener("sidebarToggled", updateSidebarShow)
    }
  }, [])

  // Fetch unread counts every 10 seconds
  useEffect(() => {
    fetchUnreadCounts()
    const interval = setInterval(() => {
      fetchUnreadCounts()
    }, 60000)
    return () => clearInterval(interval)
  }, [fetchUnreadCounts])

  useEffect(() => {
    if (location.pathname.startsWith("/plan-ai")) {
      setOpenDropdown("ai")
    }
  }, [location.pathname])

  // Auto-hide sidebar on small screens
  useEffect(() => {
    if (!isLargeScreen) {
      setShow(false)
    } else {
      // Restore sidebar state from localStorage or default to true
      const sidebarState = localStorage.getItem("sidebarShow")
      setShow(sidebarState === null ? true : sidebarState === "true")
    }
  }, [isLargeScreen])

  const handleToggle = () => {
    const newShow = !show
    setShow(newShow)
    localStorage.setItem("sidebarShow", String(newShow))
    window.dispatchEvent(new Event("sidebarToggled"))
    if (onToggle) onToggle()
  }

  const mainNavItems = [
    { 
      name: "Home", 
      icon: Home, 
      path: "/",
      onClick: () => {
        if (location.pathname === '/') {
          window.dispatchEvent(new Event('refreshFeed'))
        }
      },
      unreadCount: unreadCounts.finder
    },
    ...(role === 1
      ? [{ 
          name: "Trainer Finder", 
          icon: Dumbbell, 
          path: "/trainer-finder",
          unreadCount: unreadCounts.finder
        }]
      : role === 2
        ? [
            { 
            name: "Explore Finders", 
            icon: Search, 
            path: "/explore-finders",
            unreadCount: unreadCounts.finder
            },
            { 
              name: "Seeker Recommendations", 
              icon: User, 
              path: "/seeker-recommendations"
            }
          ]
        : []),
    { 
      name: "Appointments", 
      icon: Calendar, 
      path: "/appointments",
      unreadCount: unreadCounts.appointment
    },
  ]

  const aiSubItems = [
    { name: "Analytics", icon: BarChart3, path: "/plan-ai/statistic" },
    { name: "Planning", icon: Calendar, path: "/plan-ai/planning" },
    { name: "Physical Stats", icon: User, path: "/plan-ai/physical-stats" },
    { name: "Exercises", icon: Dumbbell, path: "/plan-ai/exercises" },
    { name: "Lift AI", icon: Sparkles, path: "/plan-ai/chat" },
  ]

  const quickAccessItems = [
    { 
      name: "Messages", 
      icon: MessageSquare, 
      path: "/chat",
      unreadCount: unreadCounts.chat
    },
    { name: "Friends", icon: UserCircle, path: "/friends/suggestions" },
    { name: "Schedule", icon: Clock, path: "/schedule" },
    { name: "Statistics", icon: BarChart2, path: "/statistics" },
  ]

  const handleDropdownToggle = (name: string) => {
    if (!show && name === "ai") {
      // When sidebar is collapsed, show popup dropdown
      setShowPopupDropdown(!showPopupDropdown)
      setOpenDropdown(openDropdown === name ? null : name)
      // Update button position for popup positioning
      if (buttonRef) {
        const rect = buttonRef.getBoundingClientRect()
        setButtonPosition({ top: rect.bottom + 8, left: rect.left })
      }
    } else {
      // Normal dropdown behavior when sidebar is expanded
      setOpenDropdown(openDropdown === name ? null : name)
      setShowPopupDropdown(false)
    }
  }

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      // Check if click is outside both the button and the popup dropdown
      const isClickInButton = target.closest('.ai-dropdown-container')
      const isClickInPopup = target.closest('.ai-popup-dropdown')
      
      if (!isClickInButton && !isClickInPopup) {
        setShowPopupDropdown(false)
      }
    }

    if (showPopupDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPopupDropdown])

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full z-30",
        "lg:block transition-all duration-300 ease-in-out",
        show ? "w-64" : "w-0 lg:w-20",
      )}
    >
      <div
        className={cn(
          "h-full w-full pt-14 pb-6 flex flex-col",
          "bg-gradient-to-b from-white to-gray-50/30 border-r border-gray-200",
          "transition-all duration-300",
        )}
      >
        {/* Toggle button */}
        <button
          onClick={handleToggle}
          className={cn(
            "absolute right-0 top-20 z-50",
            "w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-lg hover:shadow-xl",
            "translate-x-1/2 hover:border-[#DE9151]/30",
            "transition-all duration-300 group hidden lg:flex",
          )}
          aria-label={show ? "Hide sidebar" : "Show sidebar"}
        >
          <Menu className="w-4 h-4 text-gray-500 group-hover:text-[#DE9151] transition-colors duration-200" />
        </button>

        <nav className="flex-1 px-4 py-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300/50 scrollbar-track-transparent">
          {/* Main Navigation */}
          <div className="mb-8">
            <ul className="space-y-0.5">
              {mainNavItems.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <li key={item.name}>
                    <Link
                      to={item.path}
                      onClick={item.onClick}
                      className={cn(
                        "flex items-center rounded-xl transition-all duration-200 group",
                        "hover:shadow-md hover:scale-[1.02]",
                        !show ? "justify-center p-2" : "gap-3 px-4 py-2",
                        isActive
                          ? "bg-gradient-to-r from-[#DE9151]/15 to-[#DE9151]/5 text-[#DE9151] shadow-md border border-[#DE9151]/20"
                          : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-100/80 hover:to-gray-50 hover:text-gray-900",
                      )}
                    >
                      <div
                        className={cn(
                          "p-2 rounded-lg transition-all duration-200 flex justify-center items-center",
                          isActive
                            ? "bg-[#DE9151]/10 shadow-sm"
                            : "bg-gray-100/50 group-hover:bg-white group-hover:shadow-sm"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "w-5 h-5 shrink-0",
                            isActive ? "text-[#DE9151]" : "text-gray-600 group-hover:text-[#DE9151]",
                          )}
                        />
                      </div>
                      <span
                        className={cn(
                          "font-semibold text-sm",
                          !show && "opacity-0 w-0 overflow-hidden lg:hidden",
                          isActive && "text-[#DE9151]",
                        )}
                      >
                        {item.name}
                      </span>
                      {typeof item.unreadCount === 'number' && item.unreadCount > 0 && (
                        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-[#de9151] text-xs font-bold text-white">
                          {item.unreadCount}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}

              {/* AI Assistant Dropdown */}
              <li className="ai-dropdown-container relative">
                <button
                  ref={setButtonRef}
                  onClick={() => handleDropdownToggle("ai")}
                  className={cn(
                    "w-full flex items-center rounded-xl transition-all duration-200 group",
                    "hover:shadow-md hover:scale-[1.02]",
                    show ? "gap-3 px-4 py-2" : "justify-center p-2",
                    location.pathname.startsWith("/plan-ai")
                      ? "bg-gradient-to-r from-purple-100/80 to-purple-50/80 text-purple-700 shadow-sm border border-purple-200/50"
                      : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/50 hover:text-gray-900"
                  )}
                >
                  {/* Icon container */}
                  <div
                    className={cn(
                      "p-2 rounded-lg transition-all duration-200 flex justify-center items-center",
                      location.pathname.startsWith("/plan-ai")
                        ? "bg-purple-100 shadow-sm"
                        : "bg-gray-100/50 group-hover:bg-white group-hover:shadow-sm"
                    )}
                  >
                    <Sparkles
                      className={cn(
                        "w-5 h-5 shrink-0",
                        location.pathname.startsWith("/plan-ai")
                          ? "text-purple-600"
                          : "text-gray-500 group-hover:text-purple-600"
                      )}
                    />
                  </div>

                  {/* Text label */}
                  {show && (
                    <span
                      className={cn(
                        "font-semibold text-sm",
                        location.pathname.startsWith("/plan-ai") && "text-purple-700"
                      )}
                    >
                      Plan & AI
                    </span>
                  )}

                  {/* Dropdown chevron */}
                  {show && (
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 transition-transform duration-200",
                        openDropdown === "ai" && "transform rotate-180",
                        location.pathname.startsWith("/plan-ai")
                          ? "text-purple-600"
                          : "text-gray-500"
                      )}
                    />
                  )}
                </button>
                {show && openDropdown === "ai" && (
                  <ul className="mt-2 ml-6 space-y-1 animate-in slide-in-from-top-2 duration-200">
                    {aiSubItems.map((item) => {
                      const isActive = location.pathname === item.path
                      return (
                        <li key={item.name}>
                          <Link
                            to={item.path}
                            onClick={() => setOpenDropdown('ai')}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 hover:shadow-sm",
                              isActive
                                ? "bg-gradient-to-r from-purple-100/80 to-purple-50/80 text-purple-700 shadow-sm border border-purple-200/50"
                                : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/50 hover:text-gray-900",
                            )}
                          >
                            <div
                              className={cn(
                                "p-1.5 rounded-md transition-all duration-200",
                                isActive ? "bg-purple-100/80 shadow-sm" : "bg-gray-100/30 group-hover:bg-purple-50/50",
                              )}
                            >
                              <item.icon
                                className={cn(
                                  "w-4 h-4 shrink-0",
                                  isActive ? "text-purple-600" : "text-gray-500 group-hover:text-purple-600",
                                )}
                              />
                            </div>
                            <span className={cn("text-sm font-medium", isActive && "text-purple-700")}>
                              {item.name}
                            </span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </li>
            </ul>
          </div>

          {/* Elegant Divider */}
          <div className={cn("relative my-6", !show && "mx-auto w-4")}>
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gradient-to-r from-transparent via-gray-300/50 to-transparent"></div>
            </div>
            <div className="relative flex justify-center">
              <div className="bg-gradient-to-r from-white to-gray-50 px-3">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#DE9151]/30 to-purple-300/30"></div>
              </div>
            </div>
          </div>

          {/* Quick Access */}
          <div className={cn("mb-8", !show && "opacity-0 h-0 overflow-hidden lg:opacity-100 lg:h-auto")}>
            <h3
              className={cn(
                "text-xs font-bold uppercase tracking-wider text-gray-500 mb-4 px-4",
                "bg-gradient-to-r from-gray-600 to-gray-500 bg-clip-text text-transparent",
                !show && "opacity-0 h-0 overflow-hidden lg:hidden",
              )}
            >
              Quick Access
            </h3>
            <ul className="space-y-0.5">
              {quickAccessItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path)
                return (
                  <li key={item.name}>
                    <Link
                      to={item.path}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 hover:shadow-sm",
                        isActive
                          ? "bg-gradient-to-r from-[#DE9151]/15 to-[#DE9151]/5 text-[#DE9151] shadow-sm border border-[#DE9151]/20"
                          : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/50 hover:text-gray-900",
                      )}
                    >
                      <div
                        className={cn(
                          "p-2 rounded-lg transition-all duration-200",
                          isActive
                            ? "bg-[#DE9151]/10 shadow-sm"
                            : "bg-gray-100/50 group-hover:bg-white group-hover:shadow-sm",
                          !show && "lg:mx-auto",
                        )}
                      >
                        <item.icon
                          className={cn(
                            "w-5 h-5 shrink-0",
                            isActive ? "text-[#DE9151]" : "text-gray-600 group-hover:text-[#DE9151]",
                          )}
                        />
                      </div>
                      <span
                        className={cn(
                          "font-semibold text-sm",
                          !show && "opacity-0 w-0 overflow-hidden lg:hidden",
                          isActive && "text-[#DE9151]",
                        )}
                      >
                        {item.name}
                      </span>
                      {typeof item.unreadCount === 'number' && item.unreadCount > 0 && (
                        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-[#de9151] text-xs font-bold text-white">
                          {item.unreadCount}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Enhanced Leaderboard Section */}
          {/* <div className={cn("relative", !show && "opacity-0 h-0 overflow-hidden lg:hidden")}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4 px-4 bg-gradient-to-r from-gray-600 to-gray-500 bg-clip-text text-transparent">
              Leaderboard
            </h3>

            <div className="rounded-xl p-4 bg-gradient-to-br from-gray-50 to-white border border-gray-200 shadow-sm">
              <ul className="space-y-2">
                {[
                  { name: "Alice", score: 120 },
                  { name: "Bob", score: 110 },
                  { name: "Charlie", score: 95 },
                ].map((user, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white hover:shadow-sm transition-all duration-200 group border border-transparent hover:border-gray-200/50"
                  >
                    <div
                      className={cn(
                        "flex items-center justify-center w-7 h-7 rounded-full text-white font-semibold text-xs shadow-md",
                        i === 0
                          ? "bg-gradient-to-r from-[#DE9151] to-[#DE9151]/80"
                          : i === 1
                            ? "bg-gradient-to-r from-gray-400 to-gray-500"
                            : "bg-gradient-to-r from-gray-500 to-gray-600",
                      )}
                    >
                      {i + 1}
                    </div>
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white shadow-sm border border-gray-200 group-hover:shadow-md transition-all duration-200">
                      <Users className="w-4 h-4 text-gray-400 group-hover:text-[#DE9151] transition-colors duration-200" />
                    </div>
                    <span className="truncate flex-1 text-gray-700 group-hover:text-gray-900 transition-colors duration-200 font-medium">
                      {user.name}
                    </span>
                    <span className="text-xs bg-white text-gray-700 font-semibold px-2.5 py-1 rounded-full shadow-sm border border-gray-200 group-hover:shadow-md transition-all duration-200">
                      {user.score}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div> */}
        </nav>
      </div>

      {/* Portal for popup dropdown */}
      {!show && showPopupDropdown && createPortal(
        <div 
          className="fixed z-[100] ai-popup-dropdown"
          style={{ 
            top: `${buttonPosition.top}px`, 
            left: `${buttonPosition.left}px` 
          }}
        >
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-2 min-w-[200px]">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 px-2">
              Plan & AI
            </div>
            <ul className="space-y-1">
              {aiSubItems.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <li key={item.name}>
                    <Link
                      to={item.path}
                      onClick={() => {
                        setShowPopupDropdown(false)
                        setOpenDropdown('ai')
                      }}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 hover:shadow-sm",
                        isActive
                          ? "bg-gradient-to-r from-purple-100/80 to-purple-50/80 text-purple-700 shadow-sm border border-purple-200/50"
                          : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/50 hover:text-gray-900",
                      )}
                    >
                      <div
                        className={cn(
                          "p-1.5 rounded-md transition-all duration-200",
                          isActive ? "bg-purple-100/80 shadow-sm" : "bg-gray-100/30 group-hover:bg-purple-50/50",
                        )}
                      >
                        <item.icon
                          className={cn(
                            "w-4 h-4 shrink-0",
                            isActive ? "text-purple-600" : "text-gray-500 group-hover:text-purple-600",
                          )}
                        />
                      </div>
                      <span className={cn("text-sm font-medium", isActive && "text-purple-700")}>
                        {item.name}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>,
        document.body
      )}
    </aside>
  )
}
