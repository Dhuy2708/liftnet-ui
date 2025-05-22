"use client"

import { Home, Clock, BarChart2, Calendar, Dumbbell, Users, Search, Menu } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/AuthStore"

export function AppLeftSidebar({
  show = true,
  onToggle,
}: {
  show?: boolean
  onToggle?: () => void
}) {
  const location = useLocation()
  const { basicInfo } = useAuthStore()

  const mainNavItems = [
    { name: "Home", icon: Home, path: "/" },
    { name: "Schedule", icon: Clock, path: "/schedule" },
    { name: "Statistics", icon: BarChart2, path: "/statistics" },
  ]

  const quickAccessItems = [
    { name: "Appointments", icon: Calendar, path: "/appointments" },
    ...(String(basicInfo?.role) === "seeker" 
      ? [{ name: "Trainer Finder", icon: Dumbbell, path: "/trainer-finder" }]
      : [{ name: "Explore Finders", icon: Search, path: "/explore-finders" }]
    ),
    { name: "Community", icon: Users, path: "/community" },
  ]

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full z-30",
        "lg:block transition-all duration-300 ease-in-out",
        "transform",
        show ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:w-16",
        show ? "w-64" : "w-0",
      )}
    >
      <div
        className={cn(
          "h-full w-full pt-14 pb-6 flex flex-col",
          "bg-white border-r border-gray-200",
          "transition-all duration-300",
        )}
      >
        {/* Toggle button */}
        <button
          onClick={onToggle}
          className={cn(
            "absolute right-0 top-20 z-50",
            "w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-md",
            "translate-x-1/2",
            "transition-all duration-300 group hidden lg:flex"
          )}
          aria-label={show ? "Hide sidebar" : "Show sidebar"}
        >
          <Menu className="w-4 h-4 text-gray-500" />
        </button>

        <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          {/* Main Navigation */}
          <div className="mb-6">
            <ul className="space-y-1">
              {mainNavItems.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <li key={item.name}>
                    <Link
                      to={item.path}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md transition-colors duration-200",
                        isActive
                          ? "bg-[#DE9151]/10 text-[#DE9151]"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                      )}
                    >
                      <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-[#DE9151]" : "text-gray-500")} />
                      <span
                        className={cn(
                          "font-medium",
                          !show && "opacity-0 w-0 overflow-hidden lg:hidden",
                          isActive && "text-[#DE9151]",
                        )}
                      >
                        {item.name}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Divider */}
          <div className={cn("h-px bg-gray-200 my-4", !show && "mx-auto w-4")} />

          {/* Quick Access */}
          <div className={cn("mb-6", !show && "opacity-0 h-0 overflow-hidden lg:opacity-100 lg:h-auto")}>
            <h3
              className={cn(
                "text-xs font-medium uppercase tracking-wider text-gray-500 mb-3 px-3",
                !show && "opacity-0 h-0 overflow-hidden lg:hidden",
              )}
            >
              Quick Access
            </h3>
            <ul className="space-y-1">
              {quickAccessItems.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <li key={item.name}>
                    <Link
                      to={item.path}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md transition-colors duration-200",
                        isActive
                          ? "bg-[#DE9151]/10 text-[#DE9151]"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                      )}
                    >
                      <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-[#DE9151]" : "text-gray-500")} />
                      <span
                        className={cn(
                          "font-medium",
                          !show && "opacity-0 w-0 overflow-hidden lg:hidden",
                          isActive && "text-[#DE9151]",
                        )}
                      >
                        {item.name}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Divider */}
          <div
            className={cn(
              "h-px bg-gray-200 my-4",
              !show && "mx-auto w-4",
              !show && "opacity-0 h-0 overflow-hidden lg:opacity-100 lg:h-auto",
            )}
          />

          {/* Leaderboard Section */}
          <div className={cn("relative", !show && "opacity-0 h-0 overflow-hidden lg:hidden")}>
            <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-3 px-3">Leaderboard</h3>

            <div className="rounded-lg p-3 bg-gray-50 border border-gray-200">
              <ul className="space-y-2">
                {[
                  { name: "Alice", score: 120 },
                  { name: "Bob", score: 110 },
                  { name: "Charlie", score: 95 },
                ].map((user, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-white transition-all duration-200 group"
                  >
                    <div
                      className={cn(
                        "flex items-center justify-center w-6 h-6 rounded-full text-white font-medium text-xs",
                        i === 0 ? "bg-[#DE9151]" : i === 1 ? "bg-gray-400" : "bg-gray-500",
                      )}
                    >
                      {i + 1}
                    </div>
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white shadow-sm border border-gray-200">
                      <Users className="w-4 h-4 text-gray-400" />
                    </div>
                    <span className="truncate flex-1 text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
                      {user.name}
                    </span>
                    <span className="text-xs bg-white text-gray-700 font-medium px-2 py-1 rounded-full shadow-sm border border-gray-200">
                      {user.score}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </nav>
      </div>
    </aside>
  )
}
