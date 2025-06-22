"use client"

import { useEffect, useRef, useState } from "react"
import { useFeedStore } from "@/store/FeedStore"
import { useAuthStore } from "@/store/AuthStore"
import {
  MessageCircle,
  Share2,
  MoreHorizontal,
  ArrowBigUp,
  ArrowBigDown,
  Flame,
  Clock,
  TrendingUp,
  Filter,
  Bookmark,
  Loader2,
  ArrowLeft,
  Send,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AppRightSidebar } from "@/components/layout/AppRightSidebar"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

export function FeedPage() {
  const { isLoading, error, fetchFeedList, reactPost, posts, clearPosts, hasMore, addComment, fetchFeedComments } =
    useFeedStore()
  const basicInfo = useAuthStore((state) => state.basicInfo)
  const [loadingMore, setLoadingMore] = useState(false)
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const navigate = useNavigate()
  const [localLikes, setLocalLikes] = useState<Record<string, { isLiked: boolean; isDisliked: boolean; count: number }>>({})
  const [sortBy, setSortBy] = useState("best")
  const [savedPosts, setSavedPosts] = useState<Record<string, boolean>>({})
  const isSaved = (postId: string) => !!savedPosts[postId]
  const toggleSavePost = (postId: string) => {
    setSavedPosts((prev) => ({ ...prev, [postId]: !prev[postId] }))
  }
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null)
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({})
  const [commentLoading, setCommentLoading] = useState(false)
  const [detailPost, setDetailPost] = useState<null | (typeof posts)[0]>(null)
  const [detailComments, setDetailComments] = useState<
    Array<{
      id: string
      user: {
        id: string
        email: string
        username: string
        firstName: string
        lastName: string
        role: number
        avatar: string
        isDeleted: boolean
        isSuspended: boolean
        isFollowing: boolean
      }
      comment: string
      createdAt: string
      modifiedAt: string
    }>
  >([])
  const [detailLoading, setDetailLoading] = useState(false)
  const feedScrollRef = useRef<number>(0)

  // Update local likes when posts change
  useEffect(() => {
    // Check for duplicate IDs
    const postIds = new Set<string>()
    const duplicates = posts.filter((post) => {
      if (postIds.has(post.id)) {
        return true
      }
      postIds.add(post.id)
      return false
    })

    if (duplicates.length > 0) {
      console.warn(
        "Duplicate post IDs found:",
        duplicates.map((p) => p.id),
      )
    }

    const newLocalLikes: Record<string, { isLiked: boolean; isDisliked: boolean; count: number }> = {}
    posts.forEach((post) => {
      newLocalLikes[post.id] = {
        isLiked: post.isLiked,
        isDisliked: false,
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
    setLoadingMore(false)

    // Add event listener for refresh
    const handleRefresh = () => {
      clearPosts()
      setInitialLoadDone(false)
      setLoadingMore(false)
      fetchFeedList()
    }
    window.addEventListener("refreshFeed", handleRefresh)

    // Cleanup function to clear posts when component unmounts
    return () => {
      clearPosts()
      setInitialLoadDone(false)
      setLoadingMore(false)
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
      window.removeEventListener("refreshFeed", handleRefresh)
    }
  }, [clearPosts, fetchFeedList])

  // Initial load
  useEffect(() => {
    if (!initialLoadDone && !isLoading && !loadingMore) {
      setLoadingMore(true)
      fetchFeedList().then(() => {
        setLoadingMore(false)
        setInitialLoadDone(true)
      })
    }
  }, [initialLoadDone, isLoading, loadingMore, fetchFeedList])

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && hasMore) {
          loadMore()
        }
      },
      {
        rootMargin: "500px",
        threshold: 0.1,
      },
    )

    if (lastPostRef.current) {
      observerRef.current.observe(lastPostRef.current)
    }

    return () => {
      if (lastPostRef.current && observerRef.current) {
        observerRef.current.unobserve(lastPostRef.current)
      }
    }
  }, [posts, isLoading, hasMore])

  const loadMore = async () => {
    if (isLoading || !hasMore) return
    setLoadingMore(true)
    await fetchFeedList()
    setLoadingMore(false)
  }

  // Last post ref for infinite scroll
  const lastPostRef = useRef<HTMLDivElement | null>(null)

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
      const current = prev[feedId] || { isLiked: false, isDisliked: false, count: 0 }
      let newIsLiked = current.isLiked
      let newIsDisliked = current.isDisliked
      let newCount = current.count
      if (type === 1) {
        newIsLiked = true
        newIsDisliked = false
        newCount = current.isLiked ? current.count : current.count + 1
      } else if (type === 2) {
        newIsLiked = false
        newIsDisliked = true
        newCount = current.isDisliked ? current.count : current.count - 1
      }
      return {
        ...prev,
        [feedId]: {
          isLiked: newIsLiked,
          isDisliked: newIsDisliked,
          count: newCount,
        },
      }
    })

    // Then make API call
    await reactPost(feedId, type, feedOwnerId)
  }

  const handleCommentSubmit = async (postId: string) => {
    const text = commentTexts[postId] || ""
    if (!text.trim()) return
    setCommentLoading(true)
    if (!basicInfo) {
      setCommentLoading(false)
      return
    }
    // Optimistically increase comment count in overview
    setLocalLikes((likes) => ({ ...likes })) // force rerender if needed
    const postIndex = posts.findIndex((p) => p.id === postId)
    if (postIndex !== -1) {
      posts[postIndex].commentCount = (posts[postIndex].commentCount || 0) + 1
    }
    // Optimistically add comment to top
    setDetailComments((prev) => [
      {
        id: Math.random().toString(36).substr(2, 9),
        user: {
          id: basicInfo.id,
          email: '',
          username: basicInfo.username,
          firstName: basicInfo.firstName,
          lastName: basicInfo.lastName,
          role: basicInfo.role,
          avatar: basicInfo.avatar,
          isDeleted: false,
          isSuspended: false,
          isFollowing: false,
        },
        comment: text,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
      },
      ...prev,
    ])
    // Optimistically increase comment count
    setDetailPost((prev) => prev ? { ...prev, commentCount: (prev.commentCount || 0) + 1 } : prev)
    // Also update the commentCount in the posts array
    setLocalLikes((likes) => ({ ...likes })) // force rerender if needed
    setCommentTexts((prev) => ({ ...prev, [postId]: "" }))
    await addComment(postId, text)
    setCommentLoading(false)
    setActiveCommentPostId(null)
  }

  const handleOpenDetail = async (post: (typeof posts)[0]) => {
    feedScrollRef.current = window.scrollY
    setDetailPost(post)
    setDetailLoading(true)
    const comments = await fetchFeedComments(post.id, null)
    setDetailComments(comments || [])
    setDetailLoading(false)
  }

  const handleBackToFeed = () => {
    setDetailPost(null)
    setDetailComments([])
    setTimeout(() => {
      window.scrollTo({ top: feedScrollRef.current, behavior: "auto" })
    }, 0)
  }

  const renderLoadingSkeleton = () => {
    return (
      <div className="space-y-3">
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="bg-white rounded-md shadow-sm border border-gray-200 p-4 animate-pulse"
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
          ))}
      </div>
    )
  }

  const renderDetailView = () => {
    if (!detailPost) return null
    return (
      <div className="flex-1 max-w-5xl">
        <button
          className="flex items-center gap-2 mb-6 px-4 py-2 bg-white rounded-full shadow hover:bg-gray-50 text-gray-700 transition border border-gray-200 w-fit"
          onClick={handleBackToFeed}
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Feed</span>
        </button>
        {/* Reuse PostContent for detail */}
        <div className="bg-white mb-6 rounded-2xl px-8 py-7 shadow-lg border border-gray-100">
          {/* Post header */}
          <div className="flex items-center mb-2">
            <div className="relative cursor-pointer mr-3">
              <img
                src={
                  detailPost.userOverview?.avatar
                    ? detailPost.userOverview.avatar
                    : detailPost.userOverview
                      ? `https://ui-avatars.com/api/?name=${detailPost.userOverview.firstName}+${detailPost.userOverview.lastName}&background=de9151&color=fff`
                      : "/default-avatar.png"
                }
                alt="User Avatar"
                className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-base font-semibold text-gray-900">
                {detailPost.userOverview.firstName} {detailPost.userOverview.lastName}
              </div>
              <div className="flex items-center text-xs text-gray-500 mt-0.5">
                <span
                  className={`px-1.5 py-0.5 rounded-sm text-xs ${
                    detailPost.userOverview.role === 2 ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {detailPost.userOverview.role === 2 ? "PT" : "User"}
                </span>
                <span className="mx-1">•</span>
                <span>{formatTimeAgo(detailPost.createdAt)}</span>
              </div>
            </div>
          </div>
          {/* Post content */}
          <div className="py-2">
            <p className="text-base text-gray-800 whitespace-pre-line leading-relaxed">{detailPost.content}</p>
          </div>
          {/* Post media */}
          {detailPost.medias && detailPost.medias.length > 0 && (
            <div className="mt-3">
              {detailPost.medias.map((media, i) => (
                <div key={i} className="relative w-full max-h-[500px] rounded-lg overflow-hidden mb-2">
                  {/* Blurred background image */}
                  <div
                    className="absolute inset-0 w-full h-full"
                    style={{
                      backgroundImage: `url(${media || "/placeholder.svg"})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      filter: "blur(20px)",
                      transform: "scale(1.1)",
                    }}
                  />
                  {/* Main image */}
                  <img
                    src={media || "/placeholder.svg"}
                    alt="Post media"
                    className="relative w-full max-h-[500px] object-contain rounded-lg z-10"
                  />
                </div>
              ))}
            </div>
          )}
          {/* Reaction bar and comment input for detail view */}
          {detailPost && (
            <div className="flex flex-col gap-4 ">
              {/* Reaction bar */}
              <div className="flex items-center pt-4 gap-2">
                <div className="flex items-center mr-4 bg-gray-50 rounded-full p-1">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full transition-colors text-base",
                      localLikes[detailPost.id]?.isLiked ? "bg-[#de9151]/10 text-[#de9151]" : "hover:bg-gray-100",
                    )}
                    onClick={() => handleReact(detailPost.id, localLikes[detailPost.id]?.isLiked ? 2 : 1, detailPost.userOverview.id)}
                  >
                    <ArrowBigUp
                      className={cn(
                        "w-6 h-6",
                        localLikes[detailPost.id]?.isLiked ? "text-[#de9151] stroke-[#de9151]" : "text-white stroke-gray-300",
                        "transition-colors"
                      )}
                      fill={localLikes[detailPost.id]?.isLiked ? "#de9151" : "none"}
                      strokeWidth={2}
                    />
                  </motion.button>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={localLikes[detailPost.id]?.count || detailPost.likeCount}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="mx-1 text-sm font-medium text-gray-700 min-w-[20px] text-center"
                    >
                      {localLikes[detailPost.id]?.count || detailPost.likeCount}
                    </motion.span>
                  </AnimatePresence>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors text-base"
                    onClick={() => handleReact(detailPost.id, localLikes[detailPost.id]?.isLiked ? 2 : 1, detailPost.userOverview.id)}
                  >
                    <ArrowBigDown
                      className={cn(
                        "w-6 h-6",
                        localLikes[detailPost.id]?.isDisliked ? "text-[#7c3aed] stroke-[#7c3aed]" : "text-white stroke-gray-300",
                        "transition-colors"
                      )}
                      fill={localLikes[detailPost.id]?.isDisliked ? "#7c3aed" : "none"}
                      strokeWidth={2}
                    />
                  </motion.button>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center text-gray-600 hover:bg-gray-100 rounded-full px-3 py-2 mr-2 transition-colors text-sm"
                  onClick={() => {
                    setActiveCommentPostId(detailPost.id)
                    setTimeout(() => {
                      const input = document.getElementById('detail-comment-input') as HTMLInputElement
                      if (input) input.focus()
                    }, 100)
                  }}
                >
                  <MessageCircle className="w-4 h-4 mr-1.5" />
                  <span className="font-medium">
                    {typeof detailPost.commentCount === "number" ? ` ${detailPost.commentCount}` : ""}
                  </span>
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
                    isSaved(detailPost.id) ? "text-[#de9151] bg-[#de9151]/10" : "text-gray-600 hover:bg-gray-100",
                  )}
                  onClick={() => toggleSavePost(detailPost.id)}
                >
                  <Bookmark className={cn("w-4 h-4 mr-1.5", isSaved(detailPost.id) ? "fill-[#de9151]" : "")}/>
                  <span className="font-medium">{isSaved(detailPost.id) ? "Saved" : "Save"}</span>
                </motion.button>
              </div>
              
            </div>
          )}
        </div>
        <div className="w-full flex justify-center">
          <div className="h-px bg-gray-200 w-3/4 mb-8" />
        </div>
        {/* Comments section with add comment field at the top */}
        <div className="px-0 py-0 mb-12">
          {/* Add comment field box */}
          {detailPost && (
            <div className="flex items-center gap-2 mb-6">
              <input
                id="detail-comment-input"
                className="flex-1 border border-gray-300 rounded-full px-5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#de9151] bg-white placeholder-gray-400 shadow-sm transition-all h-11"
                type="text"
                placeholder="Write a comment..."
                value={commentTexts[detailPost.id] || ""}
                onChange={(e) => setCommentTexts((prev) => ({ ...prev, [detailPost.id]: e.target.value }))}
                disabled={commentLoading}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleCommentSubmit(detailPost.id)
                  }
                }}
              />
              <button
                className="flex items-center justify-center bg-[#de9151] hover:bg-[#c27339] text-white rounded-full w-10 h-10 transition-colors disabled:opacity-60 shadow-sm"
                onClick={() => handleCommentSubmit(detailPost.id)}
                disabled={commentLoading || !(commentTexts[detailPost.id] && commentTexts[detailPost.id].trim())}
                aria-label="Send comment"
                type="button"
              >
                {commentLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          )}
          <h3 className="text-xl font-bold mb-5 text-gray-900">Comments</h3>
          {detailLoading ? (
            <div className="text-center text-gray-400 py-8">Loading comments...</div>
          ) : detailComments.length === 0 ? (
            <div className="text-center text-gray-400 py-8">No comments yet.</div>
          ) : (
            <div className="space-y-5">
              {detailComments.map((c) => (
                <div
                  key={c.id}
                  className="flex items-start gap-3 px-0 py-0"
                >
                  <img
                    src={
                      c.user?.avatar
                        ? c.user.avatar
                        : c.user
                          ? `https://ui-avatars.com/api/?name=${c.user.firstName}+${c.user.lastName}&background=de9151&color=fff`
                          : "/default-avatar.png"
                    }
                    alt="User Avatar"
                    className="h-12 w-12 rounded-full object-cover border"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 text-base">
                        {c.user?.firstName} {c.user?.lastName}
                      </span>
                      <span className="ml-2 text-xs text-gray-400">{formatTimeAgo(c.createdAt)}</span>
                    </div>
                    <div className="text-gray-800 text-sm leading-relaxed">{c.comment}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderPosts = () => {
    if (detailPost) return renderDetailView()
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
        <div
          className="bg-white mb-5 rounded-xl px-6 py-5 transition-all duration-200 hover:shadow-lg hover:bg-gray-50 hover:scale-[1.01] cursor-pointer"
          onClick={() => handleOpenDetail(post)}
        >
          {/* Post header */}
          <div className="flex items-center mb-2">
            <div
              className="relative cursor-pointer mr-3"
              onClick={() => post.userOverview && navigate(`/profile/${post.userOverview.id}`)}
            >
              <img
                src={
                  post.userOverview?.avatar
                    ? post.userOverview.avatar
                    : post.userOverview
                      ? `https://ui-avatars.com/api/?name=${post.userOverview.firstName}+${post.userOverview.lastName}&background=de9151&color=fff`
                      : "/default-avatar.png"
                }
                alt="User Avatar"
                className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
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
                <div key={i} className="relative w-full max-h-[500px] rounded-lg overflow-hidden">
                  {/* Blurred background image */}
                  <div
                    className="absolute inset-0 w-full h-full"
                    style={{
                      backgroundImage: `url(${media || "/placeholder.svg"})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      filter: "blur(20px)",
                      transform: "scale(1.1)",
                    }}
                  />
                  {/* Main image */}
                  <img
                    src={media || "/placeholder.svg"}
                    alt="Post media"
                    className="relative w-full max-h-[500px] object-contain rounded-lg z-10"
                  />
                </div>
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
                onClick={(e) => {
                  e.stopPropagation()
                  handleReact(post.id, localLikes[post.id]?.isLiked ? 2 : 1, post.userOverview.id)
                }}
              >
                <ArrowBigUp
                  className={cn(
                    "w-6 h-6",
                    localLikes[post.id]?.isLiked ? "text-[#de9151] stroke-[#de9151]" : "text-white stroke-gray-300",
                    "transition-colors"
                  )}
                  fill={localLikes[post.id]?.isLiked ? "#de9151" : "none"}
                  strokeWidth={2}
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
                onClick={(e) => {
                  e.stopPropagation()
                  handleReact(post.id, localLikes[post.id]?.isLiked ? 2 : 1, post.userOverview.id)
                }}
              >
                <ArrowBigDown
                  className={cn(
                    "w-6 h-6",
                    localLikes[post.id]?.isDisliked ? "text-[#7c3aed] stroke-[#7c3aed]" : "text-white stroke-gray-300",
                    "transition-colors"
                  )}
                  fill={localLikes[post.id]?.isDisliked ? "#7c3aed" : "none"}
                  strokeWidth={2}
                />
              </motion.button>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center text-gray-600 hover:bg-gray-100 rounded-full px-3 py-2 mr-2 transition-colors text-sm"
              onClick={(e) => {
                e.stopPropagation()
                setActiveCommentPostId(post.id)
              }}
            >
              <MessageCircle className="w-4 h-4 mr-1.5" />
              <span className="font-medium">
                {typeof post.commentCount === "number" ? ` ${post.commentCount}` : ""}
              </span>
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
              onClick={(e) => {
                e.stopPropagation()
                toggleSavePost(post.id)
              }}
            >
              <Bookmark className={cn("w-4 h-4 mr-1.5", isSaved(post.id) ? "fill-[#de9151]" : "")} />
              <span className="font-medium">{isSaved(post.id) ? "Saved" : "Save"}</span>
            </motion.button>
          </div>
          {/* Comment box */}
          <AnimatePresence>
            {activeCommentPostId === post.id && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="mt-4 mb-1 px-3 py-3 bg-gray-50 rounded-xl shadow flex flex-col gap-3 border border-gray-200"
                key="comment-box"
              >
                <div className="flex items-center gap-3">
                  <input
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#de9151] bg-white placeholder-gray-400 shadow-sm transition-all"
                    type="text"
                    placeholder="Write a comment..."
                    value={commentTexts[post.id] || ""}
                    onChange={(e) => setCommentTexts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                    disabled={commentLoading}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleCommentSubmit(post.id)
                      }
                    }}
                  />
                  <button
                    className="bg-[#de9151] text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-[#c27339] disabled:opacity-60 shadow-sm transition-colors flex items-center justify-center min-w-[64px]"
                    onClick={() => handleCommentSubmit(post.id)}
                    disabled={commentLoading || !(commentTexts[post.id] && commentTexts[post.id].trim())}
                  >
                    {commentLoading ? <Loader2 className="animate-spin w-4 h-4" /> : "Post"}
                  </button>
                  <button
                    className="text-gray-400 hover:text-gray-600 px-2 py-1 rounded-md transition-colors"
                    onClick={() => {
                      setActiveCommentPostId(null)
                      setCommentTexts((prev) => ({ ...prev, [post.id]: "" }))
                    }}
                    disabled={commentLoading}
                    title="Cancel"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )

      // Only attach ref to the last post
      if (index === posts.length - 1) {
        return (
          <div key={`${post.id}-${index}`} ref={lastPostRef}>
            <PostContent />
          </div>
        )
      }

      return (
        <div key={`${post.id}-${index}`}>
          <PostContent />
          <div className="h-px bg-gray-200 mx-4" />
        </div>
      )
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
          {!hasMore && !loadingMore && posts.length > 0 && (
            <div className="text-center text-gray-400 py-6">
              <p className="text-sm font-medium mb-1">You've reached the end!</p>
              <p className="text-xs text-gray-500">Follow more people to get more feeds in your timeline.</p>
            </div>
          )}
        </div>

        {/* Loading skeleton - always at bottom when loading more */}
        {loadingMore && <div className="mt-4">{renderLoadingSkeleton()}</div>}
      </div>
      <AppRightSidebar />
    </div>
  )
}
