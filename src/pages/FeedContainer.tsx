"use client"

import { useState } from "react"
import { FeedPage } from "./FeedPage"
import { AppLeftSidebar } from "@/components/layout/AppLeftSidebar"

export function FeedContainer() {
  const [showSidebar, setShowSidebar] = useState(true)

  return (
    <div className="flex">
      <AppLeftSidebar show={showSidebar} onToggle={() => setShowSidebar(!showSidebar)} />
      
      <main className="flex-1 transition-all duration-300 ease-in-out">
        <div className="max-w-[1000px] mx-auto">
          <FeedPage />
        </div>
      </main>
    </div>
  )
}
