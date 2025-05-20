"use client"

import { useEffect, useRef, useState } from "react"
import { CreatePostBox } from "@/components/ui/create-post-box"
import { useFeedStore } from "@/store/FeedStore"
import { Heart, MessageCircle, Share2, MoreHorizontal, Users, Bookmark, Bot, CalendarDays, Sparkles, UserCircle } from "lucide-react"
import { useNavigate } from "react-router-dom"

export function FeedPage() {
  const { isLoading, error, fetchFeedList, reactPost, posts, clearPosts } = useFeedStore()
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  const observer = useRef<IntersectionObserver | null>(null)
  const [showSidebars, setShowSidebars] = useState(false)
  const navigate = useNavigate()
  const [localLikes, setLocalLikes] = useState<Record<string, { isLiked: boolean; count: number }>>({})

  // Update local likes when posts change
  useEffect(() => {
    const newLocalLikes: Record<string, { isLiked: boolean; count: number }> = {}
    posts.forEach(post => {
      newLocalLikes[post.id] = {
        isLiked: post.isLiked,
        count: post.likeCount
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
      
      observer.current = new IntersectionObserver(entries => {
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
    setLocalLikes(prev => {
      const current = prev[feedId]
      const newIsLiked = type === 1
      return {
        ...prev,
        [feedId]: {
          isLiked: newIsLiked,
          count: current.count + (newIsLiked ? 1 : -1)
        }
      }
    })

    // Then make API call
    await reactPost(feedId, type, feedOwnerId)
  }

  const renderLoadingSkeleton = () => {
    return Array(3)
      .fill(0)
      .map((_, i) => (
        <div key={`skeleton-${i}`} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200 p-6 mb-4 animate-pulse">
          <div className="flex items-start space-x-4 mb-4">
            <div className="h-12 w-12 rounded-full bg-gray-200 border-2 border-white shadow-sm"></div>
            <div className="flex-1">
              <div className="h-5 bg-gray-200 rounded-xl w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded-xl w-1/5 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded-xl w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded-xl w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded-xl w-3/4"></div>
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
        <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 p-6 rounded-2xl shadow-sm">
          <p>{error}</p>
          <button 
            onClick={() => fetchFeedList()} 
            className="mt-3 text-sm font-medium text-red-600 hover:text-red-800 bg-red-100 px-4 py-2 rounded-xl transition-colors"
          >
            Try again
          </button>
        </div>
      )
    }

    if (initialLoadDone && posts.length === 0) {
      return (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-600 mb-4">You have discovered all the feeds.<br />
          <span className="text-sm">Follow more to get more feeds!</span></p>
        </div>
      )
    }

    return posts.map((post, index) => {
      const PostContent = () => (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200 p-6 mb-4 transition-all duration-200 hover:shadow-md">
          <div className="flex items-start space-x-4 mb-4">
            <div className="relative cursor-pointer" onClick={() => navigate(`/profile/${post.userOverview.id}`)}>
              <img
                src={post.userOverview.avatar || `https://ui-avatars.com/api/?name=${post.userOverview.firstName}+${post.userOverview.lastName}&background=de9151&color=fff`}
                alt="User Avatar"
                className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-sm"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></span>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <div 
                    className="font-medium text-gray-800 cursor-pointer hover:text-[#de9151] transition-colors"
                    onClick={() => navigate(`/profile/${post.userOverview.id}`)}
                  >
                    {post.userOverview.firstName} {post.userOverview.lastName}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full ${
                      post.userOverview.role === 2 
                        ? "bg-purple-100 text-purple-700" 
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {post.userOverview.role === 2 ? "Personal Trainer" : "Fitness Seeker"}
                    </span>
                    <span>•</span>
                    <span>{formatTimeAgo(post.createdAt)}</span>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-800 whitespace-pre-line mt-3 leading-relaxed">{post.content}</p>
              {post.medias && post.medias.length > 0 && (
                <div className="mt-4">
                  {post.medias.map((media, i) => (
                    <img
                      key={i}
                      src={media}
                      alt="Post media"
                      className="mt-3 rounded-xl w-full max-h-96 object-contain border border-gray-200"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-100">
            <button
              className="flex items-center gap-1 px-2.5 py-1 rounded-full hover:bg-red-50 transition-colors group"
              onClick={() => handleReact(post.id, localLikes[post.id]?.isLiked ? 2 : 1, post.userOverview.id)}
            >
              <Heart 
                className={`w-5 h-5 transition-all duration-300 ${
                  localLikes[post.id]?.isLiked 
                    ? 'fill-red-500 text-red-500 scale-110' 
                    : 'text-gray-400 group-hover:text-red-500'
                }`} 
              />
              <span className="ml-1 text-sm text-gray-700 font-medium">{localLikes[post.id]?.count || post.likeCount}</span>
            </button>
            <button className="flex items-center gap-1 px-2.5 py-1 rounded-full hover:bg-gray-100 transition-colors group">
              <MessageCircle className="w-5 h-5 text-gray-400 group-hover:text-[#de9151]" />
              <span className="ml-1 text-sm text-gray-700 font-medium">0</span>
            </button>
            <button className="flex items-center gap-1 px-2.5 py-1 rounded-full hover:bg-gray-100 transition-colors group">
              <Share2 className="w-5 h-5 text-gray-400 group-hover:text-[#de9151]" />
              <span className="ml-1 text-sm text-gray-700 font-medium">Share</span>
            </button>
          </div>
        </div>
      )

      if (posts.length === index + 1) {
        return <div key={post.id} ref={lastPostRef}><PostContent /></div>
      } else {
        return <div key={post.id}><PostContent /></div>
      }
    })
  }

  useEffect(() => {
    setTimeout(() => setShowSidebars(true), 50)
  }, [])

  return (
    <div className="relative bg-[#f9fafb] min-h-screen flex justify-center">
      {/* Left Sidebar (solid area, with transition) */}
      <aside
        className={`hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 pt-12 z-30
        transition-all duration-500 ease-out
        ${showSidebars ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}
        style={{ background: 'linear-gradient(to right, #fff 0%, #f9fafb 40%, #f9fafb 100%)' }}
      >
        {/* Blurred accent background */}
        <div className="absolute -top-16 -left-10 w-56 h-56 bg-[#de9151] opacity-20 rounded-full blur-2xl z-0" />
        <nav className="flex-1 px-6 py-8 overflow-y-auto relative z-10">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><span className="w-2 h-2 bg-[#de9151] rounded-full inline-block"></span>Quick Access</h3>
          <ul className="space-y-2 text-[15px] mb-6">
            <li className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 rounded-lg px-2 py-2 transition">
              <Users className="w-5 h-5 text-blue-500" />
              <span>Groups</span>
            </li>
            <li className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 rounded-lg px-2 py-2 transition">
              <Bookmark className="w-5 h-5 text-purple-500" />
              <span>Saved Posts</span>
            </li>
            <li className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 rounded-lg px-2 py-2 transition">
              <Bot className="w-5 h-5 text-green-500" />
              <span>AI Assistant</span>
            </li>
          </ul>
          <hr className="border-gray-200 my-4" />
          <section className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><span className="w-2 h-2 bg-[#de9151] rounded-full inline-block"></span>My Groups</h3>
            <ul className="space-y-2">
              {["Yoga Lovers", "HIIT Squad", "Runners Club"].map((group, i) => (
                <li key={i} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 rounded-lg px-2 py-1.5 transition">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  <span className="truncate">{group}</span>
                </li>
              ))}
            </ul>
          </section>
          <hr className="border-gray-200 my-4" />
          <section>
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><span className="w-2 h-2 bg-[#de9151] rounded-full inline-block"></span>Leaderboard</h3>
            <ul className="space-y-2">
              {[
                { name: "Alice", score: 120 },
                { name: "Bob", score: 110 },
                { name: "Charlie", score: 95 }
              ].map((user, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className={`font-bold text-lg ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-500' : 'text-orange-700'}`}>{i + 1}</span>
                  <UserCircle className="w-6 h-6 text-gray-300" />
                  <span className="truncate flex-1">{user.name}</span>
                  <span className="text-xs text-gray-500 font-semibold">{user.score}</span>
                </li>
              ))}
            </ul>
          </section>
        </nav>
      </aside>

      {/* Main Feed (centered, unaffected by sidebars) */}
      <main className="mx-auto w-full max-w-3xl px-2 sm:px-4 py-4 z-10">
        <div className="mb-6">
          <CreatePostBox />
        </div>
        {renderPosts()}
        {loadingMore && renderLoadingSkeleton()}
        {!hasMore && !loadingMore && posts.length > 0 && (
          <div className="text-center text-gray-500 py-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200">
            <p className="text-lg font-medium mb-2">You've reached the end!</p>
            <p className="text-sm text-gray-400">Follow more people to get more feeds in your timeline.</p>
          </div>
        )}
      </main>

      {/* Right Sidebar (solid area, with transition) */}
      <aside
        className={`hidden xl:flex flex-col fixed right-0 top-0 h-full w-80 pt-12 z-30
        transition-all duration-500 ease-out
        ${showSidebars ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
        style={{ background: 'linear-gradient(to left, #fff 0%, #f9fafb 40%, #f9fafb 100%)' }}
      >
        {/* Blurred accent background */}
        <div className="absolute -top-16 -right-10 w-56 h-56 bg-[#de9151] opacity-20 rounded-full blur-2xl z-0" />
        <div className="flex-1 px-6 py-8 overflow-y-auto relative z-10">
          <section className="mb-8">
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><span className="w-2 h-2 bg-[#de9151] rounded-full inline-block"></span>Friend Suggestions</h3>
            <ul className="space-y-3">
              {[1,2,3].map(i => (
                <li key={i} className="flex items-center gap-3">
                  <UserCircle className="w-8 h-8 text-gray-300" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-700">User {i}</div>
                    <button className="text-xs text-blue-600 hover:underline">Add Friend</button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
          <hr className="border-gray-200 my-6" />
          <section className="mb-8">
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><span className="w-2 h-2 bg-[#de9151] rounded-full inline-block"></span>Who's Online</h3>
            <ul className="flex flex-wrap gap-3">
              {["Anna", "Ben", "Chris", "Dana"].map((name, i) => (
                <li key={i} className="flex flex-col items-center">
                  <span className="relative">
                    <UserCircle className="w-8 h-8 text-gray-300" />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></span>
                  </span>
                  <span className="text-xs text-gray-600 mt-1">{name}</span>
                </li>
              ))}
            </ul>
          </section>
          <hr className="border-gray-200 my-6" />
          <section className="mb-8">
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><span className="w-2 h-2 bg-[#de9151] rounded-full inline-block"></span>Birthday Reminders</h3>
            <ul className="space-y-2">
              {[
                { name: "Emily", date: "Today" },
                { name: "Frank", date: "Tomorrow" }
              ].map((user, i) => (
                <li key={i} className="flex items-center gap-2">
                  <UserCircle className="w-6 h-6 text-gray-300" />
                  <span className="truncate flex-1">{user.name}</span>
                  <span className="text-xs text-gray-500">{user.date}</span>
                </li>
              ))}
            </ul>
          </section>
          <hr className="border-gray-200 my-6" />
          <section className="mb-8">
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><span className="w-2 h-2 bg-[#de9151] rounded-full inline-block"></span>Upcoming Events</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-3">
                <CalendarDays className="w-5 h-5 text-orange-500" />
                <div>
                  <div className="font-medium text-gray-700">Yoga Class</div>
                  <div className="text-xs text-gray-500">Tomorrow, 7:00 AM</div>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-pink-500" />
                <div>
                  <div className="font-medium text-gray-700">AI Q&A Live</div>
                  <div className="text-xs text-gray-500">Friday, 8:00 PM</div>
                </div>
              </li>
            </ul>
          </section>
          <hr className="border-gray-200 my-6" />
          <section>
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><span className="w-2 h-2 bg-[#de9151] rounded-full inline-block"></span>Motivational Quote</h3>
            <div className="italic text-gray-500 text-sm">“The only bad workout is the one that didn't happen.”</div>
          </section>
        </div>
      </aside>
    </div>
  )
}
