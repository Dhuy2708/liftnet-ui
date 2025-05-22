"use client"

import type React from "react"
import { TopBar } from "@/components/topbar/topbar"

interface AppLayoutProps {
  children: React.ReactNode
}

export function CommonAppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-[#fffff]">
      <TopBar />
      <div className="flex-1">
        <div className="flex justify-center">
          <div className="w-full max-w-4xl px-4">{children}</div>
        </div>
      </div>
    </div>
  )
}
