import { useEffect, useState } from "react"
import { useFinderStore } from "@/store/FinderStore"
import { AppLeftSidebar } from "@/components/layout/AppLeftSidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search,
  User,
  MapPin,
  Calendar,
  MessageSquare,
  Star,
  Loader2,
  Filter,
  Users,
  Sparkles,
  Clock,
  Lightbulb,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

export function SeekerRecommendationsPage() {
  const navigate = useNavigate()
  const { 
    seekerRecommendations, 
    isLoadingRecommendations, 
    error, 
    fetchSeekerRecommendations 
  } = useFinderStore()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [showSidebars, setShowSidebars] = useState(() => {
    const sidebarState = localStorage.getItem("sidebarShow")
    return sidebarState === null ? true : sidebarState === "true"
  })

  useEffect(() => {
    fetchSeekerRecommendations()
  }, [fetchSeekerRecommendations])

  const filteredRecommendations = seekerRecommendations.filter((rec) => {
    if (!searchQuery) return true
    const searchLower = searchQuery.toLowerCase()
    return (
      rec.seeker.firstName.toLowerCase().includes(searchLower) ||
      rec.seeker.lastName.toLowerCase().includes(searchLower) ||
      rec.seeker.email.toLowerCase().includes(searchLower) ||
      rec.description.toLowerCase().includes(searchLower)
    )
  })

  const handleSearch = () => {
    // Search is handled by filtering the existing data
  }

  const handleContactSeeker = (seekerId: string) => {
    navigate(`/chat?userId=${seekerId}`)
  }

  const handleViewProfile = (seekerId: string) => {
    navigate(`/profile/${seekerId}`)
  }

  return (
    <div className="relative bg-[#f9fafb] min-h-screen">
      <AppLeftSidebar
        onToggle={() => {
          const newShow = !showSidebars
          setShowSidebars(newShow)
          localStorage.setItem("sidebarShow", String(newShow))
        }}
      />

      <div
        className={cn(
          "p-8 transition-all duration-500",
          showSidebars ? "lg:pl-72" : "lg:pl-24"
        )}
      >
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Seeker Recommendations</h1>
                <p className="text-gray-600 mt-1">AI-powered recommendations for potential clients</p>
              </div>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search seekers by name, email, or description..."
                  className="pl-10 bg-gray-50 border-gray-200 focus:bg-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch()
                    }
                  }}
                />
              </div>
              <Button
                onClick={handleSearch}
                className="bg-[#de9151] hover:bg-[#de9151]/90"
              >
                Search
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {isLoadingRecommendations ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-[#de9151] mx-auto mb-4" />
                  <p className="text-gray-600">Loading recommendations...</p>
                </div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl">
                <p className="font-medium">Error loading recommendations</p>
                <p className="text-sm mt-1">{error}</p>
                <Button
                  onClick={() => fetchSeekerRecommendations()}
                  className="mt-3 bg-red-600 hover:bg-red-700"
                >
                  Try Again
                </Button>
              </div>
            ) : filteredRecommendations.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchQuery ? "No matching recommendations" : "No recommendations yet"}
                </h3>
                <p className="text-gray-600">
                  {searchQuery 
                    ? "Try adjusting your search terms" 
                    : "We'll show you personalized seeker recommendations here"
                  }
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {filteredRecommendations.map((recommendation, index) => (
                  <motion.div
                    key={recommendation.seeker.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="relative">
                        <img
                          src={
                            recommendation.seeker.avatar
                              ? recommendation.seeker.avatar
                              : `https://ui-avatars.com/api/?name=${recommendation.seeker.firstName}+${recommendation.seeker.lastName}&background=de9151&color=fff`
                          }
                          alt={`${recommendation.seeker.firstName} ${recommendation.seeker.lastName}`}
                          className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                        />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                          <Star className="w-3 h-3 text-white" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-1">
                              {recommendation.seeker.firstName} {recommendation.seeker.lastName}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                                Seeker
                              </span>
                              <span>•</span>
                              <span>{recommendation.seeker.email}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewProfile(recommendation.seeker.id)}
                              className="flex items-center gap-2"
                            >
                              <User className="w-4 h-4" />
                              View Profile
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleContactSeeker(recommendation.seeker.id)}
                              className="bg-[#de9151] hover:bg-[#de9151]/90 flex items-center gap-2"
                            >
                              <MessageSquare className="w-4 h-4" />
                              Contact
                            </Button>
                          </div>
                        </div>

                        {/* Recommendation Description */}
                        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-100">
                          <div className="flex items-start gap-2">
                            <Lightbulb className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-purple-800 mb-1">
                                Description
                              </p>
                              <p className="text-gray-700 leading-relaxed">
                                {recommendation.description}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Additional Info */}
                        <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Available for training</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>Location not specified</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>Recommended {new Date(recommendation.recommendedAt).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Results Summary */}
          {!isLoadingRecommendations && !error && filteredRecommendations.length > 0 && (
            <div className="mt-8 text-center text-sm text-gray-600">
              Showing {filteredRecommendations.length} of {seekerRecommendations.length} recommendations
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 