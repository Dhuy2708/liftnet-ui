"use client"

// Friend Suggestions Page: shows all suggested friends with AppLeftSidebar
import { useEffect, useState } from "react"
import { useSocialStore, type SuggestedFriend } from "@/store/SocialStore"
import { AppLeftSidebar } from "@/components/layout/AppLeftSidebar"
import { UserCircle, Users, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router-dom"

export function SuggestionsPage() {
  const [suggested, setSuggested] = useState<SuggestedFriend[]>([])
  const [loading, setLoading] = useState(false)
  const suggestFriends = useSocialStore((s) => s.suggestFriends)
  const [showSidebars, setShowSidebars] = useState(() => {
    const sidebarState = localStorage.getItem("sidebarShow")
    return sidebarState === null ? true : sidebarState === "true"
  })
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    suggestFriends().then((res) => {
      setSuggested(res)
      setLoading(false)
    })
  }, [suggestFriends])

  const handleExploreMore = () => {
    setLoading(true)
    suggestFriends().then((res) => {
      setSuggested((prev) => {
        const ids = new Set(prev.map((u) => u.id))
        return [...prev, ...res.filter((u) => !ids.has(u.id))]
      })
      setLoading(false)
    })
  }

  return (
    <div className="relative bg-gray-50 min-h-[calc(100vh-3.8rem)]">
      <AppLeftSidebar
        onToggle={() => {
          const newShow = !showSidebars
          setShowSidebars(newShow)
          localStorage.setItem("sidebarShow", String(newShow))
        }}
      />

      <div
        className={cn(
          "p-6 lg:p-8 min-h-[calc(100vh-4rem)] transition-all duration-300",
          showSidebars ? "lg:pl-72" : "lg:pl-24",
        )}
      >
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#de9151] rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">People you may know</h1>
                <p className="text-sm text-gray-600 mt-1">Discover and connect with new people</p>
              </div>
            </div>
          </div>

          {/* Content */}
          {loading && suggested.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-[#de9151]/30 border-t-[#de9151] rounded-full animate-spin"></div>
                <span className="text-gray-600">Loading suggestions...</span>
              </div>
            </div>
          ) : suggested.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No suggestions available</h3>
              <p className="text-gray-600">Check back later for new recommendations</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* User Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {suggested.map((user) => (
                  <div
                    key={user.id}
                    className="bg-white rounded-xl p-6 border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                    onClick={() => navigate(`/profile/${user.id}`)}
                  >
                    {/* Avatar with Badge */}
                    <div className="flex justify-center mb-4">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100">
                          {user.avatar ? (
                            <img
                              src={user.avatar || "/placeholder.svg"}
                              alt={user.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <UserCircle className="w-10 h-10 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Role Badge */}
                        {user.role && (
                          <div className="absolute -bottom-1 -right-1">
                            {user.role === 1 && (
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                                <span className="text-[10px] font-bold text-white">S</span>
                              </div>
                            )}
                            {user.role === 2 && (
                              <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center border-2 border-white">
                                <span className="text-[10px] font-bold text-white">PT</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="text-center space-y-3">
                      <div>
                        <h3 className="font-medium text-gray-900 text-sm leading-tight">
                          {user.firstName || user.username} {user.lastName}
                        </h3>
                      </div>

                      {/* Follow Button */}
                      <button
                        className="w-full py-2 px-4 text-sm font-medium text-[#de9151] bg-[#de9151]/5 hover:bg-[#de9151] hover:text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                        onClick={(e) => {
                          e.stopPropagation()
                          /* TODO: Add follow logic */
                        }}
                      >
                        <Plus className="w-4 h-4" />
                        Follow
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More Button */}
              <div className="flex justify-center pt-4">
                <button
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  onClick={handleExploreMore}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      Loading...
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4" />
                      Show more people
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SuggestionsPage
