import { useEffect } from "react"
import { useAuthStore } from "@/store/AuthStore"
import { useFeedStore } from "@/store/FeedStore"
import { Loader2, LogOut, Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react"
import { useNavigate } from "react-router-dom"

// Helper to format time ago
const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  return date.toLocaleDateString()
}

export function HomePage() {
  const { basicInfo, logout } = useAuthStore()
  const { posts, isLoading, fetchFeedList, reactPost } = useFeedStore()
  const navigate = useNavigate()

  useEffect(() => {
    fetchFeedList()
  }, [fetchFeedList])

  const handleLogout = async () => {
    await logout()
    navigate("/auth")
  }

  const handleReact = async (feedId: string, type: number, feedOwnerId: string) => {
    await reactPost(feedId, type, feedOwnerId)
  }

  if (!basicInfo) {
    return null
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">
              Welcome, {basicInfo.firstName} {basicInfo.lastName}
            </h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>

          <div className="mb-4">
            <p className="text-gray-600">
              Role: {basicInfo.role === 1 ? "Seeker" : basicInfo.role === 2 ? "Personal Trainer" : "Admin"}
            </p>
          </div>

          {/* Posts Section */}
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-3">Feed</h2>
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-[#de9151]" />
              </div>
            ) : posts.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-gray-500">
                <p>No posts to show yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <div key={post.id} className="bg-white rounded-xl shadow p-4 mb-3">
                    <div className="flex items-start gap-3 mb-1">
                      <img
                        src={post.userAvatar || `https://ui-avatars.com/api/?name=${post.userFirstName}+${post.userLastName}&background=de9151&color=fff`}
                        alt="Profile"
                        className="w-10 h-10 rounded-full object-cover border"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-base text-gray-900">
                            {post.userFirstName} {post.userLastName}
                          </span>
                          <span className="ml-2 text-xs text-gray-400">• {formatTimeAgo(post.createdAt)}</span>
                        </div>
                      </div>
                      <div className="ml-auto text-gray-400 cursor-pointer">
                        <MoreHorizontal />
                      </div>
                    </div>
                    <div className="mb-1">
                      <div className="text-gray-800 text-sm whitespace-pre-line">{post.content}</div>
                      {post.medias && post.medias.length > 0 && (
                        <div className="mt-2">
                          {post.medias.map((media, index) => (
                            <img
                              key={index}
                              src={media}
                              alt={`Post media ${index + 1}`}
                              className="block w-auto max-w-full max-h-64 object-contain rounded-lg"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <button
                        className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-red-50 transition-colors group"
                        onClick={() => handleReact(post.id, post.isLiked ? 2 : 1, post.userId)}
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
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
