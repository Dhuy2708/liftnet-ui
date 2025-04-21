"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { useAuthStore } from "@/store/AuthStore"
import { Home, MessageSquare, Calendar, Dumbbell, Users, Settings, LogOut, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

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

export function AppSidebar({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { basicInfo, logout } = useAuthStore()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
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

  const handleLogout = async () => {
    await logout()
  }

  const getInitials = () => {
    if (!basicInfo) return "U"
    return `${basicInfo.firstName.charAt(0)}${basicInfo.lastName.charAt(0)}`
  }

  const isSeeker = basicInfo?.role === 1
  const isPT = basicInfo?.role === 2

  return (
    <div className="flex min-h-screen bg-[#FEF9F3]/30">
      {/* Mobile sidebar trigger */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="bg-white shadow-md"
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out bg-white border-r shadow-sm md:relative md:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#de9151] text-white font-semibold">
              LN
            </div>
            <div>
              <h2 className="font-bold text-lg">LiftNet</h2>
              <p className="text-xs text-gray-500">
                {isSeeker ? "Fitness Seeker" : isPT ? "Personal Trainer" : "Admin"}
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar Content */}
        <div className="p-2 overflow-y-auto h-[calc(100vh-64px-72px)]">
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
                <SidebarLink
                  to="/clients"
                  icon={Users}
                  label="My Clients"
                  isActive={location.pathname === "/clients"}
                />
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

        {/* Sidebar Footer */}
        <div className="p-4 border-t absolute bottom-0 w-full bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-[#de9151]/10 text-[#de9151] flex items-center justify-center font-medium text-sm">
                {getInitials()}
              </div>
              <div className="flex flex-col text-sm">
                <span className="font-medium">
                  {basicInfo?.firstName} {basicInfo?.lastName}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {/* Overlay for mobile sidebar */}
        {isMobileOpen && (
          <div className="fixed inset-0 bg-black/20 z-30 md:hidden" onClick={() => setIsMobileOpen(false)} />
        )}
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  )
}
