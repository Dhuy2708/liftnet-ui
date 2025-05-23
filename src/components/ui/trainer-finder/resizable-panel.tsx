"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

interface ResizablePanelProps {
  className?: string
  leftPanel: React.ReactNode
  rightPanel: React.ReactNode
  defaultLeftWidth?: number
  minLeftWidth?: number
  maxLeftWidth?: number
  rightPanelOpen?: boolean
  onRightPanelOpenChange?: (open: boolean) => void
  id?: string
}

export function ResizablePanel({
  className,
  leftPanel,
  rightPanel,
  defaultLeftWidth = 40, // Changed from 66 to 40
  minLeftWidth = 30,
  maxLeftWidth = 70, // Adjusted to allow for 60% right panel
  rightPanelOpen = true,
  onRightPanelOpenChange,
  id,
}: ResizablePanelProps) {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(rightPanelOpen)

  // Sync with parent state
  useEffect(() => {
    setIsRightPanelOpen(rightPanelOpen)
  }, [rightPanelOpen])

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return

    const containerRect = containerRef.current.getBoundingClientRect()
    const containerWidth = containerRect.width
    const mouseX = e.clientX - containerRect.left

    // Calculate percentage
    let newLeftWidth = (mouseX / containerWidth) * 100

    // Apply constraints
    newLeftWidth = Math.max(minLeftWidth, Math.min(maxLeftWidth, newLeftWidth))

    setLeftWidth(newLeftWidth)
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging])

  const toggleRightPanel = () => {
    const newState = !isRightPanelOpen
    setIsRightPanelOpen(newState)
    if (onRightPanelOpenChange) {
      onRightPanelOpenChange(newState)
    }
  }

  // Calculate grid columns based on left panel width
  const getGridColumns = () => {
    if (!isRightPanelOpen) return 3 // Max 3 columns when right panel is closed

    // Determine columns based on left panel width
    if (leftWidth < 35) return 1
    if (leftWidth < 55) return 2
    return 3
  }

  return (
    <div ref={containerRef} className={cn("flex flex-col lg:flex-row gap-4 h-full relative", className)} id={id}>
      <div
        className={cn(
          "w-full flex-shrink-0 flex flex-col h-full transition-all duration-300 ease-in-out",
          isRightPanelOpen ? `lg:w-[${leftWidth}%]` : "lg:w-full",
        )}
        style={{
          width: isRightPanelOpen ? `${leftWidth}%` : "100%",
          transition: "width 300ms ease-in-out",
        }}
        data-grid-columns={getGridColumns()}
      >
        {leftPanel}
      </div>

      {isRightPanelOpen && (
        <>
          <div
            className="hidden lg:block w-1 cursor-col-resize h-full bg-transparent hover:bg-gray-300/50 active:bg-gray-300/70 transition-colors z-10"
            onMouseDown={handleMouseDown}
          />

          <div
            className="hidden lg:flex lg:w-[calc(100%-2px-1rem-1px-1rem-1px-1px)] flex-col h-full transition-all duration-300 ease-in-out"
            style={{
              width: `calc(${100 - leftWidth}% - 1rem)`,
              transition: "width 300ms ease-in-out, opacity 300ms ease-in-out",
              opacity: isRightPanelOpen ? 1 : 0,
              animation: isRightPanelOpen ? "slideIn 300ms ease-in-out" : "none",
            }}
          >
            {rightPanel}
          </div>
        </>
      )}

      <style jsx global>{`
        @keyframes slideIn {
          from {
            transform: translateX(20px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(20px);
            opacity: 0;
          }
        }

        [data-grid-columns="1"] .post-grid {
          grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
        }

        [data-grid-columns="2"] .post-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }

        [data-grid-columns="3"] .post-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        }
      `}</style>
    </div>
  )
}
