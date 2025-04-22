"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { useAuthStore } from "@/store/AuthStore"
import { Home, MessageSquare, Calendar, Dumbbell, Users, Settings } from "lucide-react"

interface SidebarLinkProps {
  to: string
  icon: React.ElementType
  label: string
  isActive?: boolean
}

function SidebarLink({ to, icon: Icon, label, isActive }: SidebarLinkProps) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
        isActive
          ? "bg-[#de9151]/10 text-[#de9151] font-medium"
          : "text-gray-600 hover:bg-[#de9151]/5 hover:text-[#de9151]"
      }`}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </Link>
  )
}

interface AppSidebarProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

export function AppSidebar({ isOpen, setIsOpen }: AppSidebarProps) {
  const location = useLocation()
  const { basicInfo } = useAuthStore()
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile on mount and when window resizes
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkIsMobile()
    window.addEventListener("resize", checkIsMobile)

    return () => window.removeEventListener("resize", checkIsMobile)
  }, [])

  const isSeeker = basicInfo?.role === 1
  const isPT = basicInfo?.role === 2

  return (
    <aside
      className={`${
        isOpen ? "w-64" : "w-0"
      } h-full bg-white border-r shadow-sm overflow-hidden transition-all duration-300 ease-in-out z-30`}
    >
      <div className="h-full overflow-y-auto p-2">
        <nav className="space-y-1">
          <SidebarLink to="/" icon={Home} label="Home" isActive={location.pathname === "/"} />
          <SidebarLink to="/chat" icon={MessageSquare} label="Messages" isActive={location.pathname === "/chat"} />
          <SidebarLink
            to="/appointments"
            icon={Calendar}
            label="Appointments"
            isActive={location.pathname === "/appointments"}
          />

          {isSeeker && (
            <>
              <SidebarLink
                to="/trainers"
                icon={Dumbbell}
                label="Find Trainers"
                isActive={location.pathname === "/trainers"}
              />
              <SidebarLink
                to="/workouts"
                icon={Dumbbell}
                label="My Workouts"
                isActive={location.pathname === "/workouts"}
              />
            </>
          )}

          {isPT && (
            <>
              <SidebarLink to="/clients" icon={Users} label="My Clients" isActive={location.pathname === "/clients"} />
              <SidebarLink
                to="/programs"
                icon={Dumbbell}
                label="Training Programs"
                isActive={location.pathname === "/programs"}
              />
            </>
          )}

          <SidebarLink to="/settings" icon={Settings} label="Settings" isActive={location.pathname === "/settings"} />
        </nav>
      </div>
    </aside>
  )
}
