import { CalendarDays, Sparkles, UserCircle, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { useSocialStore } from "@/store/SocialStore"
import type { SuggestedFriend } from "@/store/SocialStore"
import { useNavigate } from "react-router-dom"

// Module-level cache for friend suggestions
let cachedSuggestions: SuggestedFriend[] | null = null

export function AppRightSidebar({ show = true }: { show?: boolean }) {
  const [suggested, setSuggested] = useState<SuggestedFriend[]>([])
  const [loading, setLoading] = useState(false)
  const suggestFriends = useSocialStore((s) => s.suggestFriends)
  const navigate = useNavigate()

  const handleRefresh = () => {
    setLoading(true)
    suggestFriends().then((res) => {
      setSuggested(res)
      cachedSuggestions = res
      setLoading(false)
    })
  }

  useEffect(() => {
    if (cachedSuggestions && cachedSuggestions.length > 0) {
      setSuggested(cachedSuggestions)
      setLoading(false)
    } else {
      setLoading(true)
      suggestFriends().then((res) => {
        setSuggested(res)
        cachedSuggestions = res
        setLoading(false)
      })
    }
  }, [suggestFriends])

  return (
    <aside
      className={cn(
        "fixed right-0 top-0 h-full w-80 pt-12 z-30",
        "hidden xl:flex flex-col transition-all duration-500 ease-in-out",
        "bg-white border-l border-gray-100",
        show ? "translate-x-0" : "translate-x-80",
      )}
    >
      {/* Decorative elements */}
      <div className="absolute -top-16 -right-10 w-56 h-56 bg-[#DE9151] opacity-10 rounded-full blur-3xl z-0" />
      <div className="absolute top-1/3 -left-10 w-20 h-20 bg-black opacity-5 rounded-full blur-2xl z-0" />

      <div className="flex-1 px-6 py-8 overflow-y-auto relative z-10">
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4 pl-2 pr-1">
            <h3 className="font-medium text-xs uppercase tracking-wider text-gray-400">Friend Suggestions</h3>
            <button
              className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-[#DE9151] transition-colors duration-200"
              onClick={handleRefresh}
              title="Refresh"
              disabled={loading}
            >
              <RefreshCw className={loading ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
            </button>
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-2 rounded-xl bg-gray-50/80 border border-gray-100 opacity-60 animate-pulse"
                    style={{ minHeight: 48 }}
                  >
                    <div className="w-9 h-9 rounded-full bg-gray-200" />
                    <div className="flex-1 min-w-0">
                      <div className="h-4 w-24 bg-gray-200 rounded mb-1" />
                      <div className="h-3 w-12 bg-gray-100 rounded" />
                    </div>
                    <div className="w-10 h-6 bg-gray-100 rounded-full" />
                  </div>
                ))}
                <div className="flex justify-center mt-1">
                  <div className="px-3 py-1 rounded-lg text-xs bg-gray-100 text-gray-300 font-semibold w-24 h-7" />
                </div>
                <div className="flex justify-center items-center py-2">
                  <span className="w-6 h-6 border-4 border-[#DE9151]/30 border-t-transparent rounded-full animate-spin inline-block"></span>
                </div>
              </div>
            ) : suggested.length === 0 ? (
              <div className="text-center text-gray-400 py-6">No suggestions at the moment.</div>
            ) : (
              <>
                {suggested.slice(0, 4).map((user: SuggestedFriend) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-2 rounded-xl bg-gray-50/80 border border-gray-100 hover:bg-white hover:shadow-sm transition-all duration-300 cursor-pointer"
                    onClick={() => navigate(`/profile/${user.id}`)}
                  >
                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-white shadow-sm border border-gray-100 overflow-hidden">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <UserCircle className="w-6 h-6 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-800 truncate">
                        {user.firstName || user.username} {user.lastName}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        {user.role === 1 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 font-semibold">Seeker</span>
                        )}
                        {user.role === 2 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 font-semibold">PT</span>
                        )}
                      </div>
                    </div>
                    <button
                      className="text-[10px] bg-white text-[#DE9151] px-2 py-1 rounded-full hover:bg-[#DE9151] hover:text-white border border-[#DE9151]/20 transition-colors duration-300 shadow-sm ml-1"
                      onClick={e => { e.stopPropagation(); /* TODO: Add follow logic */ }}
                    >
                      Follow
                    </button>
                  </div>
                ))}
                {suggested.length > 4 && (
                  <div className="flex justify-center mt-1">
                    <button
                      className="px-3 py-1 rounded-lg text-xs bg-[#DE9151]/10 text-[#DE9151] font-semibold hover:bg-[#DE9151]/20 transition-colors duration-200"
                      style={{ fontSize: 12 }}
                      onClick={() => navigate("/friends/suggestions")}
                    >
                      Explore more
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-6" />

        <section className="mb-8">
          <h3 className="font-medium text-xs uppercase tracking-wider text-gray-400 mb-4 pl-2">Upcoming Events</h3>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow transition-all duration-300">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white text-[#DE9151] shadow-sm border border-[#DE9151]/10">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div className="font-medium text-base text-gray-800">Yoga Class</div>
              </div>
              <div className="text-sm text-gray-500 ml-12">Tomorrow, 7:00 AM</div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow transition-all duration-300">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white text-[#DE9151] shadow-sm border border-[#DE9151]/10">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="font-medium text-base text-gray-800">AI Q&A Live</div>
              </div>
              <div className="text-sm text-gray-500 ml-12">Friday, 8:00 PM</div>
            </div>
          </div>
        </section>

        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-6" />

        <section>
          <h3 className="font-medium text-xs uppercase tracking-wider text-gray-400 mb-4 pl-2">Motivational Quote</h3>

          <div className="p-5 rounded-xl bg-gradient-to-br from-[#DE9151]/5 to-white border border-[#DE9151]/10 shadow-sm">
            <p className="italic text-base text-gray-700 leading-relaxed">
              "The only bad workout is the one that didn't happen."
            </p>
            <div className="flex items-center mt-3">
              <div className="h-px flex-1 bg-[#DE9151]/10"></div>
              <p className="text-xs text-gray-500 mx-2">Unknown</p>
              <div className="h-px flex-1 bg-[#DE9151]/10"></div>
            </div>
          </div>
        </section>
      </div>
    </aside>
  )
}
