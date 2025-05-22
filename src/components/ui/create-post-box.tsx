"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ImageIcon, Smile, Video, X } from "lucide-react"
import { useAuthStore } from "@/store/AuthStore"
import { useFeedStore } from "@/store/FeedStore"

export function CreatePostBox() {
  const { basicInfo } = useAuthStore()
  const { createPost } = useFeedStore()
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      setSelectedFiles((prev) => [...prev, ...filesArray])

      // Create preview URLs
      const newPreviewUrls = filesArray.map((file) => URL.createObjectURL(file))
      setPreviewUrls((prev) => [...prev, ...newPreviewUrls])
    }
  }

  const removeFile = (index: number) => {
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(previewUrls[index])

    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!content.trim() && selectedFiles.length === 0) return

    setIsSubmitting(true)
    try {
      await createPost(content, selectedFiles)
      setContent("")
      setSelectedFiles([])
      setPreviewUrls([])
    } catch (error) {
      console.error("Failed to create post:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-3">
        <div className="flex items-center space-x-3 mb-3">
          <img
            src={
              basicInfo?.avatar ||
              `https://ui-avatars.com/api/?name=${basicInfo?.firstName || "User"}+${basicInfo?.lastName || ""}&background=de9151&color=fff`
            }
            alt="User Avatar"
            className="h-8 w-8 rounded-full object-cover"
          />
          <div className="flex-1">
            <Textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[60px] resize-none border-gray-200 focus:border-[#de9151] focus:ring-[#de9151] text-sm"
            />
          </div>
        </div>

        {/* Preview selected files */}
        {previewUrls.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            {previewUrls.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={url || "/placeholder.svg"}
                  alt={`Preview ${index}`}
                  className="w-full h-32 object-cover rounded-md border border-gray-200"
                />
                <button
                  onClick={() => removeFile(index)}
                  className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex space-x-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center text-gray-500 hover:bg-gray-100 rounded-md px-2 py-1 transition-colors"
            >
              <ImageIcon className="w-4 h-4 mr-1" />
              <span className="text-xs font-medium">Photo</span>
            </button>
            <button className="flex items-center text-gray-500 hover:bg-gray-100 rounded-md px-2 py-1 transition-colors">
              <Video className="w-4 h-4 mr-1" />
              <span className="text-xs font-medium">Video</span>
            </button>
            <button className="flex items-center text-gray-500 hover:bg-gray-100 rounded-md px-2 py-1 transition-colors">
              <Smile className="w-4 h-4 mr-1" />
              <span className="text-xs font-medium">Feeling</span>
            </button>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || (!content.trim() && selectedFiles.length === 0)}
            className="bg-[#de9151] hover:bg-[#c27339] text-white rounded-md px-4 py-1 text-sm"
          >
            {isSubmitting ? "Posting..." : "Post"}
          </Button>
        </div>
      </div>

      {/* Hidden file input */}
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" multiple className="hidden" />
    </div>
  )
}
