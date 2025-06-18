import { useEffect, useRef, useState } from "react"
import { useParams, Navigate, useSearchParams } from "react-router-dom"
import { useSocialStore } from "@/store/SocialStore"
import { useFeedStore } from "@/store/FeedStore"
import { useProfileStore } from "@/store/ProfileStore"
import { Button } from "@/components/ui/button"
import {
  UserPlus,
  Users,
  Loader2,
  Share2,
  Calendar,
  Award,
  Bookmark,
  Heart,
  Eye,
  Mail,
  MessageSquare,
  EyeOff,
  MoreHorizontal,
  Trophy,
  MessageCircle,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AppLeftSidebar } from "@/components/layout/AppLeftSidebar"
import { AppRightSidebar } from "@/components/layout/AppRightSidebar"

// Helper to format time ago
const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diffInSeconds < 60) return `${diffInSeconds} minutes ago`
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  return date.toLocaleDateString()
}

export function ProfilePage() {
  const { userId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { profile, isLoading: isProfileLoading, getProfile, followUser, unfollowUser } = useSocialStore()
  const { posts, isLoading: isPostsLoading, fetchProfilePosts, reactPost } = useFeedStore()
  const { uploadAvatar } = useProfileStore()
  const activeTab = searchParams.get("tab") || "overview"
  const [localLikes, setLocalLikes] = useState<Record<string, { isLiked: boolean; count: number }>>({})
  const [avatarHover, setAvatarHover] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      // If no userId provided, get the current user's ID from localStorage
      if (!userId) {
        const basicInfo = localStorage.getItem('basicInfo')
        if (basicInfo) {
          const { id } = JSON.parse(basicInfo)
          await getProfile(id)
        }
      } else {
        await getProfile(userId)
      }
    }

    fetchProfile()
  }, [userId, getProfile])

  useEffect(() => {
    if (activeTab === "posts" && profile) {
      fetchProfilePosts(profile.id)
    }
  }, [activeTab, fetchProfilePosts])

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

  const handleTabChange = (tabId: string) => {
    setSearchParams({ tab: tabId })
  }

  const handleReact = async (feedId: string, type: number) => {
    if (!userId) return

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
    await reactPost(feedId, type, userId)
  }

  const handleFollow = async () => {
    if (!profile) return
    if (profile.isFollowing) {
      await unfollowUser(profile.id)
    } else {
      await followUser(profile.id)
    }
  }

  // If no userId and no basicInfo in localStorage, redirect to home
  if (!userId && !localStorage.getItem('basicInfo')) {
    return <Navigate to="/" />
  }

  const primaryTabs = [
    { id: "overview", label: "Overview", icon: Eye },
    { id: "posts", label: "Posts", icon: Award },
    { id: "comments", label: "Comments", icon: MessageSquare },
    { id: "achievements", label: "Achievements", icon: Trophy },
  ]

  const secondaryTabs = [
    { id: "saved", label: "Saved", icon: Bookmark },
    { id: "hidden", label: "Hidden", icon: EyeOff },
    { id: "upvoted", label: "Upvoted", icon: Heart },
    { id: "downvoted", label: "Downvoted", icon: Heart },
  ]

  if (isProfileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#de9151] mx-auto" />
          <p className="mt-4 text-gray-500">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-4">
        <div className="p-8 bg-white rounded-lg shadow-lg text-center">
          <h1 className="text-2xl font-bold text-gray-800">Profile not found</h1>
          <p className="text-gray-600 mt-2">The user profile you're looking for doesn't exist.</p>
          <Button className="mt-4" variant="default">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative bg-[#f9fafb] min-h-screen flex justify-center">
      <AppLeftSidebar />
      <main className="mx-auto w-full max-w-4xl px-2 sm:px-4 py-4 z-10">
        {/* Banner Section */}
        <div className="h-48 bg-gradient-to-r from-[#de9151] to-[#e8b07f] relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>

        {/* Profile Content */}
        <div className="w-[7/10] max-w-7xl mx-auto px-6 -mt-20 relative z-10">
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            {/* Profile Header */}
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div
                className="relative group cursor-pointer"
                onMouseEnter={() => setAvatarHover(true)}
                onMouseLeave={() => setAvatarHover(false)}
                onClick={() => !avatarLoading && fileInputRef.current?.click()}
                style={{ pointerEvents: avatarLoading ? 'none' : undefined }}
              >
                <img
                  src={profile.avatar || `https://ui-avatars.com/api/?name=${profile.firstName}+${profile.lastName}&background=de9151&color=fff`}
                  alt="Profile"
                  className={"w-32 h-32 rounded-xl border-4 border-white shadow-lg object-cover transform transition " + (avatarHover && !avatarLoading ? "scale-105 brightness-90" : "")}
                  style={{ opacity: avatarLoading ? 0.6 : 1 }}
                />
                {/* Overlay on hover */}
                {avatarHover && !avatarLoading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl">
                    <span className="text-white text-sm font-semibold">Click to change</span>
                  </div>
                )}
                {/* Loading spinner */}
                {avatarLoading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl">
                    <span className="w-8 h-8 border-4 border-white/60 border-t-[#de9151] rounded-full animate-spin inline-block"></span>
                  </div>
                )}
                {/* Hidden file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  disabled={avatarLoading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setAvatarLoading(true)
                      const success = await uploadAvatar(file)
                      setAvatarLoading(false)
                      if (success) {
                        // Refresh profile info
                        getProfile(profile.id)
                      }
                    }
                  }}
                />
                {profile.role === 2 && (
                  <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full shadow-md">
                    PT
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{profile.firstName} {profile.lastName}</h1>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                      <span className="font-medium">@{profile.userName}</span>
                      {profile.email && profile.isSelf && (
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-1" />
                          <span>{profile.email}</span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>Joined May 10, 2022</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {!profile.isSelf && (
                      <Button 
                        variant={profile.isFollowing ? "outline" : "default"}
                        className="flex items-center gap-2 px-6 py-2 transition-all hover:shadow-md"
                        onClick={handleFollow}
                      >
                        {profile.isFollowing ? (
                          <>
                            <Users className="h-4 w-4" />
                            <span>Following</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4" />
                            <span>Follow</span>
                          </>
                        )}
                      </Button>
                    )}
                    <Button variant="outline" size="icon" className="rounded-full hover:bg-gray-50">
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-4 gap-4 mt-6">
                  <div className="bg-gray-50 rounded-lg p-4 text-center transform transition-all hover:shadow-md hover:-translate-y-0.5">
                    <div className="text-2xl font-bold text-gray-900">{profile.following}</div>
                    <div className="text-sm text-gray-600">Following</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center transform transition-all hover:shadow-md hover:-translate-y-0.5">
                    <div className="text-2xl font-bold text-gray-900">{profile.follower}</div>
                    <div className="text-sm text-gray-600">Followers</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center transform transition-all hover:shadow-md hover:-translate-y-0.5">
                    <div className="text-2xl font-bold text-gray-900">0</div>
                    <div className="text-sm text-gray-600">Karma</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center transform transition-all hover:shadow-md hover:-translate-y-0.5">
                    <div className="text-2xl font-bold text-gray-900">5</div>
                    <div className="text-sm text-gray-600">Achievements</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-8 border-b">
              <div className="flex items-center gap-1">
                {primaryTabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-all hover:bg-gray-50 ${
                        activeTab === tab.id
                          ? "border-[#de9151] text-[#de9151]"
                          : "border-transparent text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  )
                })}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all hover:bg-gray-50 ${
                        secondaryTabs.some(tab => tab.id === activeTab)
                          ? "border-[#de9151] text-[#de9151]"
                          : "border-transparent text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                      <span>More</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {secondaryTabs.map((tab) => {
                      const Icon = tab.icon
                      return (
                        <DropdownMenuItem
                          key={tab.id}
                          onClick={() => handleTabChange(tab.id)}
                          className={`flex items-center gap-2 px-3 py-2 cursor-pointer ${
                            activeTab === tab.id ? "text-[#de9151]" : ""
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{tab.label}</span>
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
            {/* Main Content */}
            <div className="md:col-span-12">
              {activeTab === "overview" && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-center h-40 text-gray-500">
                    <p>No overview items to show yet.</p>
                  </div>
                </div>
              )}
              {activeTab === "posts" && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  {isPostsLoading ? (
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
                              src={profile?.avatar || `https://ui-avatars.com/api/?name=${profile?.firstName}+${profile?.lastName}&background=de9151&color=fff`}
                              alt="Profile"
                              className="w-10 h-10 rounded-full object-cover border"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-base text-gray-900">{profile?.firstName} {profile?.lastName}</span>
                                <span className="ml-2 text-xs text-gray-400">• {formatTimeAgo(post.createdAt)}</span>
                              </div>
                              {profile?.email && profile?.isSelf && (
                                <div className="text-xs text-gray-500">{profile.email}</div>
                              )}
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
                              onClick={() => handleReact(post.id, localLikes[post.id]?.isLiked ? 2 : 1)}
                            >
                              <Heart 
                                className={`w-5 h-5 transition-all duration-300 ${
                                  localLikes[post.id]?.isLiked 
                                    ? 'fill-red-500 text-red-500 scale-110' 
                                    : 'text-gray-400 group-hover:text-red-500'
                                }`} 
                              />
                              <span className="ml-1 text-gray-700 font-medium">{localLikes[post.id]?.count || post.likeCount}</span>
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
              )}
              {activeTab === "achievements" && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-lg font-semibold mb-6 text-gray-900">Achievements & Trophies</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <Award className="w-8 h-8 text-yellow-500 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">Newcomer</p>
                        <p className="text-sm text-gray-600">Welcome to LiftNet!</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <Trophy className="w-8 h-8 text-blue-500 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">First Post</p>
                        <p className="text-sm text-gray-600">Created your first post</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <Award className="w-8 h-8 text-green-500 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">Popular Post</p>
                        <p className="text-sm text-gray-600">Post reached 100 likes</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {secondaryTabs.map((tab) => (
                activeTab === tab.id && (
                  <div key={tab.id} className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-center h-40 text-gray-500">
                      <p>No {tab.label.toLowerCase()} items to show yet.</p>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>
      </main>
      <AppRightSidebar show={true} />
    </div>
  )
}