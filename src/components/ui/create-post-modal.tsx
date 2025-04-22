"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { X, ImageIcon, Smile } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/store/AuthStore"
import { useFeedStore } from "@/store/FeedStore"

interface CreatePostModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  const { basicInfo } = useAuthStore()
  const { createPost } = useFeedStore()
  const [postContent, setPostContent] = useState("")
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, onClose])

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }

    return () => {
      document.body.style.overflow = "auto"
    }
  }, [isOpen])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setMediaFiles(Array.from(e.target.files))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await createPost(postContent, mediaFiles)
    if (success) {
      onClose()
      setPostContent("")
      setMediaFiles([])
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 animate-in fade-in zoom-in duration-200"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Create Post</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-gray-100">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-4">
            <div className="flex items-center mb-4">
              <img
                src={basicInfo?.avatar || "https://randomuser.me/api/portraits/men/32.jpg"}
                alt="User Avatar"
                className="h-8 w-8 rounded-full object-cover mr-3 ring-2 ring-[#de9151]/20"
              />
              <div>
                <div className="font-medium">
                  {basicInfo?.firstName} {basicInfo?.lastName}
                </div>
                <div className="text-xs text-gray-500">
                  {basicInfo?.role === 1 ? "Fitness Seeker" : "Personal Trainer"}
                </div>
              </div>
            </div>

            <textarea
              placeholder="What's on your fitness journey today?"
              className="w-full p-3 min-h-[120px] border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#de9151]/50 transition-all duration-200"
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
            />

            {mediaFiles.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {mediaFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index + 1}`}
                      className="h-20 w-20 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setMediaFiles(mediaFiles.filter((_, i) => i !== index))}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center mt-4 border-t pt-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                accept="image/*,video/*"
                className="hidden"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mr-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="h-5 w-5 mr-1" />
                <span>Photo/Video</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <Smile className="h-5 w-5 mr-1" />
                <span>Emoji</span>
              </Button>
            </div>
          </div>

          <div className="flex justify-end p-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="mr-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!postContent.trim()}
              className="bg-[#de9151] hover:bg-[#c27a40] text-white rounded-lg transition-colors duration-200"
            >
              Post
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
