"use client"

import type React from "react"
import { TopBar } from "@/components/topbar/topbar"

interface TopBarOnlyLayoutProps {
  children: React.ReactNode
}

export function TopBarOnlyLayout({ children }: TopBarOnlyLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-[#f9fafb]">
      <TopBar />
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
}
