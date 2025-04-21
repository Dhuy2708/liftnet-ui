"use client"

import type React from "react"

import { useState } from "react"
import { AppSidebar } from "@/components/sidebar/sidebar"
import { TopBar } from "@/components/topbar/topbar"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FEF9F3]/30">
      <TopBar onToggleSidebar={toggleSidebar} />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
