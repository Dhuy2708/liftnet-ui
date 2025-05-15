"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { CreatePostBox } from "@/components/ui/create-post-box"
import { useFeedStore } from "@/store/FeedStore"
import { Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react"

export function FeedPage() {
  const { isLoading, error, fetchFeedList, reactPost, posts, clearPosts } = useFeedStore()
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  const observer = useRef<IntersectionObserver | null>(null)

  // Clear posts and reset state when component mounts
  useEffect(() => {
    clearPosts()
    setInitialLoadDone(false)
    setHasMore(true)
  }, [clearPosts])

  // Initial load
  useEffect(() => {
    if (!initialLoadDone && !isLoading) {
      setLoadingMore(true)
      fetchFeedList().then((datas) => {
        setLoadingMore(false)
        setInitialLoadDone(true)
        if (!datas || datas.length === 0) {
          setHasMore(false)
        }
      })
    }
  }, [initialLoadDone, isLoading, fetchFeedList])

  // Infinite scroll
  const lastPostRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!initialLoadDone || isLoading || loadingMore || !hasMore) return
      
      if (observer.current) observer.current.disconnect()
      
      observer.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          setLoadingMore(true)
          fetchFeedList().then((datas) => {
            setLoadingMore(false)
            if (!datas || datas.length === 0) {
              setHasMore(false)
            }
          })
        }
      })
      
      if (node) observer.current.observe(node)
    },
    [initialLoadDone, isLoading, loadingMore, hasMore, fetchFeedList]
  )

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

  const handleReact = async (feedId: string, type: number, feedOwnerId: string) => {
    await reactPost(feedId, type, feedOwnerId)
  }

  const renderLoadingSkeleton = () => {
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

  const renderPosts = () => {
    if (isLoading && !initialLoadDone) {
      return renderLoadingSkeleton()
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <p>{error}</p>
          <button 
            onClick={() => fetchFeedList()} 
            className="mt-2 text-sm font-medium text-red-600 hover:text-red-800"
          >
            Try again
          </button>
        </div>
      )
    }

    if (initialLoadDone && posts.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600 mb-4">No posts yet. Be the first to share your fitness journey!</p>
        </div>
      )
    }

    return posts.map((post, index) => {
      if (posts.length === index + 1) {
        return (
          <div key={post.id} ref={lastPostRef} className="bg-white rounded-lg shadow p-4 mb-4">
            <div className="flex items-start space-x-3 mb-3">
              <img
                src={post.userOverview.avatar || `https://ui-avatars.com/api/?name=${post.userOverview.firstName}+${post.userOverview.lastName}&background=de9151&color=fff`}
                alt="User Avatar"
                className="h-10 w-10 rounded-full object-cover border"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      {post.userOverview.firstName} {post.userOverview.lastName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {post.userOverview.role === 2 ? "Personal Trainer" : "Fitness Seeker"} • {formatTimeAgo(post.createdAt)}
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-gray-800 whitespace-pre-line mt-2">{post.content}</p>
                {post.medias && post.medias.length > 0 && (
                  <div className="mt-3">
                    {post.medias.map((media, i) => (
                      <img
                        key={i}
                        src={media}
                        alt="Post media"
                        className="mt-3 rounded-lg w-full max-h-64 object-contain"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <button
                className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-red-50 transition-colors group"
                onClick={() => handleReact(post.id, post.isLiked ? 2 : 1, post.userOverview.id)}
              >
                <Heart className={`w-5 h-5 transition ${post.isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400 group-hover:text-red-500'}`} />
                <span className="ml-1 text-gray-700 font-medium">{post.likeCount}</span>
              </button>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer">
                <MessageCircle className="w-5 h-5 text-gray-400" />
                <span className="ml-1 text-gray-700 font-medium">0</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer">
                <Share2 className="w-5 h-5 text-gray-400" />
                <span className="ml-1 text-gray-700 font-medium">Share</span>
              </div>
            </div>
          </div>
        )
      } else {
        return (
          <div key={post.id} className="bg-white rounded-lg shadow p-4 mb-4">
            <div className="flex items-start space-x-3 mb-3">
              <img
                src={post.userOverview.avatar || `https://ui-avatars.com/api/?name=${post.userOverview.firstName}+${post.userOverview.lastName}&background=de9151&color=fff`}
                alt="User Avatar"
                className="h-10 w-10 rounded-full object-cover border"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      {post.userOverview.firstName} {post.userOverview.lastName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {post.userOverview.role === 2 ? "Personal Trainer" : "Fitness Seeker"} • {formatTimeAgo(post.createdAt)}
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-gray-800 whitespace-pre-line mt-2">{post.content}</p>
                {post.medias && post.medias.length > 0 && (
                  <div className="mt-3">
                    {post.medias.map((media, i) => (
                      <img
                        key={i}
                        src={media}
                        alt="Post media"
                        className="mt-3 rounded-lg w-full max-h-64 object-contain"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <button
                className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-red-50 transition-colors group"
                onClick={() => handleReact(post.id, post.isLiked ? 2 : 1, post.userOverview.id)}
              >
                <Heart className={`w-5 h-5 transition ${post.isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400 group-hover:text-red-500'}`} />
                <span className="ml-1 text-gray-700 font-medium">{post.likeCount}</span>
              </button>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer">
                <MessageCircle className="w-5 h-5 text-gray-400" />
                <span className="ml-1 text-gray-700 font-medium">0</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer">
                <Share2 className="w-5 h-5 text-gray-400" />
                <span className="ml-1 text-gray-700 font-medium">Share</span>
              </div>
            </div>
          </div>
        )
      }
    })
  }

  return (
    <div className="py-4 mt-2">
      <CreatePostBox />
      {renderPosts()}
      {loadingMore && renderLoadingSkeleton()}
      {!hasMore && !loadingMore && (
        <div className="text-center text-gray-500 py-6">
          You have discovered all the feeds.<br />
          <span className="text-sm">Follow more to get more feeds!</span>
        </div>
      )}
    </div>
  )
}
