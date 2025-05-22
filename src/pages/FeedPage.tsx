"use client"

import { useEffect, useRef, useState } from "react"
import { useFeedStore } from "@/store/FeedStore"
import {
  MessageCircle,
  Share2,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  Flame,
  Clock,
  TrendingUp,
  Filter,
  Bookmark,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AppRightSidebar } from "@/components/layout/AppRightSidebar"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

export function FeedPage() {
  const { isLoading, error, fetchFeedList, reactPost, posts, clearPosts } = useFeedStore()
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  const observer = useRef<IntersectionObserver | null>(null)
  const navigate = useNavigate()
  const [localLikes, setLocalLikes] = useState<Record<string, { isLiked: boolean; count: number }>>({})
  const [sortBy, setSortBy] = useState("best")
  const [savedPosts, setSavedPosts] = useState<Record<string, boolean>>({})
  const isSaved = (postId: string) => !!savedPosts[postId]
  const toggleSavePost = (postId: string) => {
    setSavedPosts((prev) => ({ ...prev, [postId]: !prev[postId] }))
  }

  // Update local likes when posts change
  useEffect(() => {
    const newLocalLikes: Record<string, { isLiked: boolean; count: number }> = {}
    posts.forEach((post) => {
      newLocalLikes[post.id] = {
        isLiked: post.isLiked,
        count: post.likeCount,
      }
    })
    setLocalLikes(newLocalLikes)
  }, [posts])

  // Clear posts and reset state when component mounts
  useEffect(() => {
    // Reset all state
    clearPosts()
    setInitialLoadDone(false)
    setHasMore(true)
    setLoadingMore(false)

    // Cleanup function to clear posts when component unmounts
    return () => {
      clearPosts()
      setInitialLoadDone(false)
      setHasMore(true)
      setLoadingMore(false)
      if (observer.current) {
        observer.current.disconnect()
      }
    }
  }, [clearPosts])

  // Initial load and infinite scroll observer setup
  useEffect(() => {
    let mounted = true

    if (!initialLoadDone && !isLoading && !loadingMore) {
      setLoadingMore(true)
      fetchFeedList().then((datas) => {
        if (mounted) {
          setLoadingMore(false)
          setInitialLoadDone(true)
          if (!datas || datas.length === 0) {
            setHasMore(false)
          }
        }
      })
    }

    // Setup intersection observer for infinite scroll
    if (observer.current) observer.current.disconnect()

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && initialLoadDone) {
        setLoadingMore(true)
        fetchFeedList().then((datas) => {
          setLoadingMore(false)
          if (!datas || datas.length === 0) {
            setHasMore(false)
            if (observer.current) {
              observer.current.disconnect()
            }
          }
        })
      }
    })

    return () => {
      mounted = false
      if (observer.current) {
        observer.current.disconnect()
      }
    }
  }, [initialLoadDone, isLoading, loadingMore, hasMore, fetchFeedList])

  // Last post ref for infinite scroll
  const lastPostRef = (node: HTMLDivElement | null) => {
    if (node && observer.current) {
      observer.current.observe(node)
    }
  }

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
    // Update local state immediately
    setLocalLikes((prev) => {
      const current = prev[feedId]
      const newIsLiked = type === 1
      return {
        ...prev,
        [feedId]: {
          isLiked: newIsLiked,
          count: current.count + (newIsLiked ? 1 : -1),
        },
      }
    })

    // Then make API call
    await reactPost(feedId, type, feedOwnerId)
  }

  const renderLoadingSkeleton = () => {
    return Array(3)
      .fill(0)
      .map((_, i) => (
        <div
          key={`skeleton-${i}`}
          className="bg-white rounded-md shadow-sm border border-gray-200 p-4 mb-3 animate-pulse"
        >
          <div className="flex items-start space-x-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-gray-200"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/5 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
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
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md shadow-sm">
          <p>{error}</p>
          <button
            onClick={() => fetchFeedList()}
            className="mt-3 text-sm font-medium text-red-600 hover:text-red-800 bg-red-100 px-3 py-1 rounded-md transition-colors"
          >
            Try again
          </button>
        </div>
      )
    }

    if (initialLoadDone && posts.length === 0) {
      return (
        <div className="bg-white rounded-md shadow-sm border border-gray-200 p-6 text-center">
          <p className="text-gray-600 mb-2">You have discovered all the feeds.</p>
          <p className="text-sm text-gray-500">Follow more to get more feeds!</p>
        </div>
      )
    }

    return posts.map((post, index) => {
      const PostContent = () => (
        <div className="bg-white mb-5 rounded-xl px-6 py-5 transition-all duration-200 hover:shadow-lg hover:bg-gray-50 hover:scale-[1.01]">
          {/* Post header */}
          <div className="flex items-center mb-2">
            <div className="relative cursor-pointer mr-3" onClick={() => navigate(`/profile/${post.userOverview.id}`)}>
              <img
                src={
                  post.userOverview.avatar ||
                  `https://ui-avatars.com/api/?name=${post.userOverview.firstName}+${post.userOverview.lastName}&background=de9151&color=fff`
                }
                alt="User Avatar"
                className="h-9 w-9 rounded-full object-cover border-2 border-gray-200"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="text-base font-semibold text-gray-900 hover:text-[#de9151] transition-colors cursor-pointer"
                onClick={() => navigate(`/profile/${post.userOverview.id}`)}
              >
                {post.userOverview.firstName} {post.userOverview.lastName}
              </div>
              <div className="flex items-center text-xs text-gray-500 mt-0.5">
                <span
                  className={`px-1.5 py-0.5 rounded-sm text-xs ${
                    post.userOverview.role === 2 ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {post.userOverview.role === 2 ? "PT" : "User"}
                </span>
                <span className="mx-1">•</span>
                <span>{formatTimeAgo(post.createdAt)}</span>
              </div>
            </div>
            <button className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>

          {/* Post content */}
          <div className="py-1">
            <p className="text-base text-gray-800 whitespace-pre-line leading-relaxed">{post.content}</p>
          </div>

          {/* Post media */}
          {post.medias && post.medias.length > 0 && (
            <div className="mt-3">
              {post.medias.map((media, i) => (
                <img
                  key={i}
                  src={media || "/placeholder.svg"}
                  alt="Post media"
                  className="w-full max-h-[500px] object-contain bg-white rounded-lg"
                />
              ))}
            </div>
          )}

          {/* Post actions */}
          <div className="flex items-center pt-4 gap-2">
            <div className="flex items-center mr-4 bg-gray-50 rounded-full p-1">
              <motion.button
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full transition-colors text-base",
                  localLikes[post.id]?.isLiked ? "bg-[#de9151]/10 text-[#de9151]" : "hover:bg-gray-100",
                )}
                onClick={() => handleReact(post.id, localLikes[post.id]?.isLiked ? 2 : 1, post.userOverview.id)}
              >
                <ArrowUp
                  className={cn(
                    "w-4 h-4",
                    localLikes[post.id]?.isLiked ? "text-[#de9151] fill-[#de9151]" : "text-gray-500",
                  )}
                />
              </motion.button>
              <AnimatePresence mode="wait">
                <motion.span
                  key={localLikes[post.id]?.count || post.likeCount}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="mx-1 text-sm font-medium text-gray-700 min-w-[20px] text-center"
                >
                  {localLikes[post.id]?.count || post.likeCount}
                </motion.span>
              </AnimatePresence>
              <motion.button
                whileTap={{ scale: 0.9 }}
                className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors text-base"
                onClick={() => handleReact(post.id, localLikes[post.id]?.isLiked ? 2 : 1, post.userOverview.id)}
              >
                <ArrowDown className="w-4 h-4 text-gray-500" />
              </motion.button>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center text-gray-600 hover:bg-gray-100 rounded-full px-3 py-2 mr-2 transition-colors text-sm"
            >
              <MessageCircle className="w-4 h-4 mr-1.5" />
              <span className="font-medium">Comments</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center text-gray-600 hover:bg-gray-100 rounded-full px-3 py-2 transition-colors text-sm"
            >
              <Share2 className="w-4 h-4 mr-1.5" />
              <span className="font-medium">Share</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "ml-auto flex items-center rounded-full px-3 py-2 transition-colors text-sm",
                isSaved(post.id) ? "text-[#de9151] bg-[#de9151]/10" : "text-gray-600 hover:bg-gray-100",
              )}
              onClick={() => toggleSavePost(post.id)}
            >
              <Bookmark className={cn("w-4 h-4 mr-1.5", isSaved(post.id) ? "fill-[#de9151]" : "")} />
              <span className="font-medium">{isSaved(post.id) ? "Saved" : "Save"}</span>
            </motion.button>
          </div>
        </div>
      )

      if (posts.length === index + 1) {
        return (
          <div key={post.id} ref={lastPostRef}>
            <PostContent />
          </div>
        )
      } else {
        return (
          <div key={post.id}>
            <PostContent />
            <div className="h-px bg-gray-200 mx-4" />
          </div>
        )
      }
    })
  }

  return (
    <div className="flex justify-center max-w-7xl mx-auto px-4 pt-4">
      <div className="flex-1 max-w-5xl">
        {/* Sort options */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-4 p-2 flex items-center">
          <div className="flex-1 flex items-center space-x-1">
            <Button
              variant={sortBy === "best" ? "default" : "ghost"}
              size="sm"
              className={`rounded-md text-xs px-3 ${sortBy === "best" ? "bg-[#de9151] hover:bg-[#c27339] text-white" : "text-gray-700"}`}
              onClick={() => setSortBy("best")}
            >
              <Flame className="w-3 h-3 mr-1" />
              Best
            </Button>
            <Button
              variant={sortBy === "hot" ? "default" : "ghost"}
              size="sm"
              className={`rounded-md text-xs px-3 ${sortBy === "hot" ? "bg-[#de9151] hover:bg-[#c27339] text-white" : "text-gray-700"}`}
              onClick={() => setSortBy("hot")}
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              Hot
            </Button>
            <Button
              variant={sortBy === "new" ? "default" : "ghost"}
              size="sm"
              className={`rounded-md text-xs px-3 ${sortBy === "new" ? "bg-[#de9151] hover:bg-[#c27339] text-white" : "text-gray-700"}`}
              onClick={() => setSortBy("new")}
            >
              <Clock className="w-3 h-3 mr-1" />
              New
            </Button>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="rounded-md text-xs text-gray-700">
                <Filter className="w-3 h-3 mr-1" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem>All Posts</DropdownMenuItem>
              <DropdownMenuItem>Following Only</DropdownMenuItem>
              <DropdownMenuItem>Trainers Only</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Create post box
        <div className="mb-4">
          <CreatePostBox />
        </div> */}

        {/* Posts */}
        <div className="bg-transparent rounded-xl">
          {renderPosts()}
          {loadingMore && renderLoadingSkeleton()}
          {!hasMore && !loadingMore && posts.length > 0 && (
            <div className="text-center text-gray-400 py-6">
              <p className="text-sm font-medium mb-1">You've reached the end!</p>
              <p className="text-xs text-gray-500">Follow more people to get more feeds in your timeline.</p>
            </div>
          )}
        </div>
      </div>
      <AppRightSidebar />
    </div>
  )
}
