"use client"

import { useState } from "react"
import { ImageIcon, Video, Smile } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/store/AuthStore"
import { CreatePostModal } from "@/components/ui/create-post-modal"

export function CreatePostBox() {
  const { basicInfo } = useAuthStore()
  const [showCreateModal, setShowCreateModal] = useState(false)

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 border border-gray-100 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center space-x-3 mb-3">
          <img
            src={basicInfo?.avatar || "https://randomuser.me/api/portraits/men/32.jpg"}
            alt="User Avatar"
            className="h-10 w-10 rounded-full object-cover ring-2 ring-[#de9151]/20"
          />
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-full py-2.5 px-4 flex-1 text-left transition-colors duration-200"
          >
            What's on your fitness journey today, {basicInfo?.firstName}?
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
          <Button
            variant="ghost"
            className="flex items-center justify-center py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            onClick={() => setShowCreateModal(true)}
          >
            <Video className="h-5 w-5 mr-2 text-red-500" />
            <span className="text-gray-600">Live video</span>
          </Button>

          <Button
            variant="ghost"
            className="flex items-center justify-center py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            onClick={() => setShowCreateModal(true)}
          >
            <ImageIcon className="h-5 w-5 mr-2 text-green-500" />
            <span className="text-gray-600">Photo/video</span>
          </Button>

          <Button
            variant="ghost"
            className="flex items-center justify-center py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            onClick={() => setShowCreateModal(true)}
          >
            <Smile className="h-5 w-5 mr-2 text-yellow-500" />
            <span className="text-gray-600">Feeling/activity</span>
          </Button>
        </div>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </>
  )
}
