"use client"

import React, { useState } from "react"
import { useLocation } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/chatbot/card"
import { Bot } from "lucide-react"
import { cn } from "@/lib/utils"
import { AppLeftSidebar } from "@/components/layout/AppLeftSidebar"
import AICoachContent from "./AICoachContent"
import StatisticsContent from "./StatisticsContent"
import PlanningContent from "./PlanningContent"
import { PhysicalStatsContent } from "./PhysicalStatsContent"

const AiChatPage = () => {
  const location = useLocation()
  const [showSidebars, setShowSidebars] = useState(() => {
    const sidebarState = localStorage.getItem("sidebarShow")
    return sidebarState === null ? true : sidebarState === "true"
  })

  const getPageContent = () => {
    const path = location.pathname.split("/").pop()
    
    switch (path) {
      case "statistic":
        return <StatisticsContent />
      case "planning":
        return <PlanningContent />
      case "physical-stats":
        return <PhysicalStatsContent />
      case "chat":
        return <AICoachContent />
      default:
        return (
            <div className="max-w-4xl mx-auto">
              <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-orange-50/20 to-amber-50/30">
                <CardContent className="p-12">
                  <div className="text-center space-y-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#de9151] to-[#f4a261] rounded-3xl flex items-center justify-center mx-auto shadow-xl">
                      <Bot className="w-10 h-10 text-white" />
                    </div>
                  <h3 className="text-3xl font-bold text-gray-900">Welcome to AI Assistant</h3>
                    <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
                    Choose a section from the sidebar to get started with your fitness journey.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
        )
    }
  }

  return (
    <div className="relative bg-white h-[calc(100vh-3.8rem)]">
      <AppLeftSidebar onToggle={() => {
        const newShow = !showSidebars
        setShowSidebars(newShow)
        localStorage.setItem("sidebarShow", String(newShow))
      }} />
      
      <div className={cn(
        "h-full transition-all duration-500 overflow-hidden",
        showSidebars ? "lg:pl-72" : "lg:pl-24",
        location.pathname === "/plan-ai/chat" ? "p-0" : "p-8"
      )}>
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-hidden">
            {getPageContent()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AiChatPage
