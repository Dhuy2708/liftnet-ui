"use client"

import { useEffect } from "react"
import { CreatePostBox } from "@/components/ui/create-post-box"
import { useFeedStore } from "@/store/FeedStore"
import { useAuthStore } from "@/store/AuthStore"

export function FeedPage() {
  const { basicInfo } = useAuthStore()
  const { posts, isLoading, error, fetchProfilePosts } = useFeedStore()

  useEffect(() => {
    if (basicInfo) {
      fetchProfilePosts(basicInfo.id)
    }
  }, [basicInfo, fetchProfilePosts])

  // Helper function to format time ago
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  const renderPosts = () => {
    if (isLoading) {
      return Array(3)
        .fill(0)
        .map((_, i) => (
          <div key={`skeleton-${i}`} className="bg-white rounded-lg shadow p-4 mb-4 animate-pulse">
            <div className="flex items-start space-x-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-gray-200"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/5 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        ))
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <p>{error}</p>
          {basicInfo && (
            <button 
              onClick={() => fetchProfilePosts(basicInfo.id)} 
              className="mt-2 text-sm font-medium text-red-600 hover:text-red-800"
            >
              Try again
            </button>
          )}
        </div>
      )
    }

    if (posts.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600 mb-4">No posts yet. Be the first to share your fitness journey!</p>
        </div>
      )
    }

    return posts.map((post, index) => (
      <div key={post.id || index} className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="flex items-start space-x-3 mb-3">
          <img
            src={
              post.userAvatar ||
              `https://randomuser.me/api/portraits/${index % 2 === 0 ? "women" : "men"}/${20 + index}.jpg`
            }
            alt="User Avatar"
            className="h-10 w-10 rounded-full object-cover"
          />
          <div>
            <div className="font-medium">
              {post.userFirstName || "User"} {post.userLastName || ""}
            </div>
            <div className="text-xs text-gray-500 mb-2">
              {post.userRole === 2 ? "Personal Trainer" : "Fitness Seeker"} • {formatTimeAgo(post.createdAt)}
            </div>
            <p className="text-gray-800 whitespace-pre-line">{post.content}</p>
            {post.medias && post.medias.length > 0 && (
              <div className="mt-3">
                {post.medias.map((media, i) => (
                  <img
                    key={i}
                    src={media || "/placeholder.svg"}
                    alt="Post media"
                    className="mt-3 rounded-lg w-full h-64 object-cover"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="border-t border-b py-2 my-2">
          <div className="flex justify-between text-gray-500 text-sm">
            <div>{12 + index * 2} Likes</div>
            <div>{3 + index} Comments</div>
          </div>
        </div>
        <div className="flex justify-between pt-1">
          <button className="flex items-center justify-center py-1 px-4 rounded-md hover:bg-gray-100 text-gray-600">
            <span>👍</span>
            <span className="ml-2">Like</span>
          </button>
          <button className="flex items-center justify-center py-1 px-4 rounded-md hover:bg-gray-100 text-gray-600">
            <span>💬</span>
            <span className="ml-2">Comment</span>
          </button>
          <button className="flex items-center justify-center py-1 px-4 rounded-md hover:bg-gray-100 text-gray-600">
            <span>↗️</span>
            <span className="ml-2">Share</span>
          </button>
        </div>
      </div>
    ))
  }

  return (
    <div className="py-4 mt-2">
      <CreatePostBox />
      {renderPosts()}
    </div>
  )
}
