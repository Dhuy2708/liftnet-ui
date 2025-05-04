"use client"

import type React from "react"
import { TopBar } from "@/components/topbar/topbar"

interface AppLayoutProps {
  children: React.ReactNode
}

export function LargeAppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-[#FEF9F3]/30">
      <TopBar />
      <div className="flex-1">
        <div className="flex justify-center">
          <div className="w-full max-w-8xl px-10 pb-6">{children}</div>
        </div>
      </div>
    </div>
  )
}
