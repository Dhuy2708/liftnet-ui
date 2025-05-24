"use client"

import { useState, useEffect } from "react"
import {
  Search,
  Calendar,
  DollarSign,
  MapPin,
  Clock,
  CheckCircle,
  Briefcase,
  FileText,
  XCircle,
  Star,
  Send,
  Eye,
  TrendingUp,
  Filter,
  ArrowUpDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/trainer-finder/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/trainer-finder/seperator"
import { ScrollArea } from "@/components/ui/trainer-finder/scroll-area"
import { Card, CardContent, CardHeader } from "@/components/ui/trainer-finder/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/trainer-finder/sheet"
import { useMediaQuery } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { AppLeftSidebar } from "@/components/layout/AppLeftSidebar"
import { useFinderStore } from "@/store/FinderStore"
import { Panel, PanelGroup, PanelResizeHandle } from "@/components/ui/resizable"
import { toast } from "react-toastify"

// Types
interface Poster {
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

interface Post {
  id: string
  poster: Poster | null
  title: string
  description: string
  startTime: string
  endTime: string
  startPrice: number
  endPrice: number
  lat: number | null
  lng: number | null
  placeName: string | null
  distanceAway: number
  hideAddress: boolean
  repeatType: number
  status: number
  applyingStatus: number
  createdAt: string
  isAnonymous: boolean
}

export default function TrainerExplorerPage() {
  const [activeTab, setActiveTab] = useState<"explore" | "applied">("explore")
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([])
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [searchInput, setSearchInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<string>("nearest")
  const [isApplying, setIsApplying] = useState(false)
  const [applicationMessage, setApplicationMessage] = useState("")
  const isMobile = useMediaQuery("(max-width: 1023px)")
  const [filters, setFilters] = useState({
    priceMin: "",
    priceMax: "",
    distance: "10",
    maxDistance: "20",
    dateFrom: "",
    dateTo: "",
    showOnlyOpen: true,
  })
  const [detailPanelOpen, setDetailPanelOpen] = useState(true)
  const [showSidebars, setShowSidebars] = useState(() => {
    const sidebarState = localStorage.getItem("sidebarShow")
    return sidebarState === null ? true : sidebarState === "true"
  })
  const [allOpportunitiesDiscovered, setAllOpportunitiesDiscovered] = useState(false)

  const { posts, isLoading, hasMore, fetchExplorePosts, fetchAppliedPosts, pageNumber, applyToPost } = useFinderStore()

  const handleExplore = () => {
    setSearchQuery(searchInput)
    setAllOpportunitiesDiscovered(false)
    fetchExplorePosts(Number(filters.maxDistance))
  }

  useEffect(() => {
    if (activeTab === "applied") {
      fetchAppliedPosts()
    }
  }, [activeTab])

  useEffect(() => {
    // Apply filters and search to posts
    let result = [...posts]

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (post) =>
          post.title.toLowerCase().includes(query) ||
          post.description.toLowerCase().includes(query) ||
          (post.poster &&
            (post.poster.firstName.toLowerCase().includes(query) ||
              post.poster.lastName.toLowerCase().includes(query))),
      )
    }

    // Apply price filter
    if (filters.priceMin) {
      result = result.filter((post) => post.startPrice >= Number(filters.priceMin))
    }
    if (filters.priceMax) {
      result = result.filter((post) => post.endPrice <= Number(filters.priceMax))
    }

    // Apply status filter
    if (filters.showOnlyOpen) {
      result = result.filter((post) => post.status === 1)
    }

    // Apply sorting
    if (sortBy === "nearest") {
      result.sort((a, b) => (a.distanceAway || 0) - (b.distanceAway || 0))
    } else if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } else if (sortBy === "price-high") {
      result.sort((a, b) => b.startPrice - a.startPrice)
    } else if (sortBy === "price-low") {
      result.sort((a, b) => a.startPrice - b.startPrice)
    }

    setFilteredPosts(result)

    if (selectedPost && !result.find((post) => post.id === selectedPost.id) && result.length > 0) {
      setSelectedPost(result[0])
    } else if (result.length === 0) {
      setSelectedPost(null)
    }
  }, [posts, searchQuery, sortBy, filters, selectedPost])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return (
          <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200 font-medium">
            Draft
          </Badge>
        )
      case 1:
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200 font-medium">
            Open
          </Badge>
        )
      case 2:
        return (
          <Badge className="bg-violet-100 text-violet-800 border-violet-200 hover:bg-violet-200 font-medium">
            Closed
          </Badge>
        )
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getApplyingStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return null
      case 1:
        return <Badge className="bg-[#de9151]/15 text-[#de9151] border-[#de9151]/30 font-medium">Applied</Badge>
      case 2:
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200 font-medium">
            Canceled
          </Badge>
        )
      default:
        return null
    }
  }

  const getRepeatTypeText = (repeatType: number) => {
    switch (repeatType) {
      case 0:
        return "One-time"
      case 1:
        return "Weekly"
      case 2:
        return "Monthly"
      default:
        return "Custom"
    }
  }

  const handlePostSelect = (post: Post) => {
    setSelectedPost(post)
    if (isMobile) {
      setDetailPanelOpen(true)
    }
  }

  const handleApply = async () => {
    if (!selectedPost) return
    setIsApplying(true)
    try {
      const success = await applyToPost(selectedPost.id, applicationMessage)
      if (success) {
        setSelectedPost(prev => prev ? { ...prev, applyingStatus: 1 } : null)
        
        setFilteredPosts(prev => 
          prev.map(post => 
            post.id === selectedPost.id 
              ? { ...post, applyingStatus: 1 }
              : post
          )
        )
        
        toast.success("Application submitted successfully!")
        setApplicationMessage("")
      } else {
        toast.error("Failed to submit application. Please try again.")
      }
    } catch {
      toast.error("Failed to submit application. Please try again.")
    } finally {
      setIsApplying(false)
    }
  }

  const resetFilters = () => {
    setFilters({
      priceMin: "",
      priceMax: "",
      distance: "10",
      maxDistance: "20",
      dateFrom: "",
      dateTo: "",
      showOnlyOpen: true,
    })
    setSearchInput("")
    setSearchQuery("")
    setSortBy("nearest")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-[#de9151]/5">
      <AppLeftSidebar
        onToggle={() => {
          const newShow = !showSidebars
          setShowSidebars(newShow)
          localStorage.setItem("sidebarShow", String(newShow))
        }}
      />

      <div className={cn("transition-all duration-300 ease-in-out", showSidebars ? "lg:pl-72" : "lg:pl-24")}>
        <div className="container mx-auto px-2 py-4">
          {/* Enhanced Header */}
          <div className="mb-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-black via-slate-800 to-[#de9151] bg-clip-text text-transparent">
                  Trainer Explorer
                </h1>
                <p className="text-sm text-slate-600 max-w-2xl">
                  Discover amazing training opportunities near you and connect with expert trainers
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-sm border border-slate-200">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-slate-700">{filteredPosts.length} opportunities</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <TrendingUp className="h-4 w-4 text-[#de9151]" />
                  <span className="font-medium">Live updates</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <PanelGroup direction="horizontal" className="h-[calc(100vh-14rem)]">
              <Panel defaultSize={70} minSize={30}>
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden h-full mr-4">
                  <CardHeader className="bg-gradient-to-r from-white to-slate-50/50 border-b border-slate-100 pb-4">
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "explore" | "applied")}>
                      <TabsList className="bg-slate-100 p-1 rounded-lg w-full h-auto">
                        <TabsTrigger
                          value="explore"
                          className="flex-1 rounded-md py-2 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-black transition-all duration-200"
                        >
                          <div className="flex items-center gap-2">
                            <Search className="h-4 w-4" />
                            <span className="font-medium text-sm">Explore Posts</span>
                          </div>
                        </TabsTrigger>
                        <TabsTrigger
                          value="applied"
                          className="flex-1 rounded-md py-2 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-black transition-all duration-200"
                        >
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            <span className="font-medium text-sm">My Applications</span>
                          </div>
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </CardHeader>

                  <CardContent className="p-4">
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "explore" | "applied")}>
                      <TabsContent value="explore" className="mt-0 space-y-4">
                        {/* Enhanced Search and Filters */}
                        <div className="space-y-4">
                          <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                              <Input
                                placeholder="Search training opportunities, trainers, or skills..."
                                className="pl-10 h-11 bg-slate-50/50 border-slate-200 rounded-lg focus:ring-2 focus:ring-[#de9151]/20 focus:border-[#de9151] transition-all duration-200 text-sm"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleExplore()
                                }}
                              />
                            </div>
                            <div className="flex items-center gap-2 bg-slate-50/50 border border-slate-200 rounded-lg px-3 h-11">
                              <MapPin className="h-4 w-4 text-slate-400" />
                              <Input
                                type="number"
                                min="1"
                                max="100"
                                value={filters.maxDistance}
                                onChange={(e) => setFilters((prev) => ({ ...prev, maxDistance: e.target.value }))}
                                className="w-16 border-0 p-0 focus-visible:ring-0 bg-transparent text-sm font-medium"
                              />
                              <span className="text-sm text-slate-500 font-medium">km</span>
                            </div>
                            <Button
                              className="bg-gradient-to-r from-[#de9151] to-[#de9151]/90 hover:from-[#de9151]/90 hover:to-[#de9151]/80 text-white rounded-lg h-11 px-6 shadow-md hover:shadow-lg transition-all duration-200 font-medium text-sm"
                              onClick={handleExplore}
                            >
                              <Search className="h-4 w-4 mr-2" />
                              Explore
                            </Button>
                          </div>

                          <div className="flex items-center justify-between">
                            <Sheet>
                              <SheetTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="border-slate-200 rounded-lg h-10 px-4 hover:bg-slate-50 transition-colors text-sm"
                                >
                                  <Filter className="h-4 w-4 mr-2" />
                                  <span className="font-medium">Filters</span>
                                </Button>
                              </SheetTrigger>
                              <SheetContent side="left" className="w-[400px] bg-white">
                                <SheetHeader className="pb-6">
                                  <SheetTitle className="text-2xl font-bold text-black">Filter Options</SheetTitle>
                                </SheetHeader>
                                <ScrollArea className="h-[calc(100vh-120px)]">
                                  <div className="space-y-8 pr-4">
                                    <div className="space-y-4">
                                      <h4 className="font-semibold text-black text-lg">Price Range</h4>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <label className="text-sm font-medium text-slate-600">Min ($)</label>
                                          <Input
                                            type="number"
                                            placeholder="0"
                                            value={filters.priceMin}
                                            onChange={(e) => setFilters({ ...filters, priceMin: e.target.value })}
                                            className="rounded-xl border-slate-200 h-11"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <label className="text-sm font-medium text-slate-600">Max ($)</label>
                                          <Input
                                            type="number"
                                            placeholder="Any"
                                            value={filters.priceMax}
                                            onChange={(e) => setFilters({ ...filters, priceMax: e.target.value })}
                                            className="rounded-xl border-slate-200 h-11"
                                          />
                                        </div>
                                      </div>
                                    </div>

                                    <div className="space-y-4">
                                      <h4 className="font-semibold text-black text-lg">Date Range</h4>
                                      <div className="space-y-4">
                                        <div className="space-y-2">
                                          <label className="text-sm font-medium text-slate-600">From</label>
                                          <Input
                                            type="date"
                                            value={filters.dateFrom}
                                            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                                            className="rounded-xl border-slate-200 h-11"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <label className="text-sm font-medium text-slate-600">To</label>
                                          <Input
                                            type="date"
                                            value={filters.dateTo}
                                            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                                            className="rounded-xl border-slate-200 h-11"
                                          />
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-xl">
                                      <Checkbox
                                        id="show-open"
                                        checked={filters.showOnlyOpen}
                                        onCheckedChange={(checked) =>
                                          setFilters({ ...filters, showOnlyOpen: checked as boolean })
                                        }
                                        className="border-slate-300"
                                      />
                                      <label htmlFor="show-open" className="text-sm font-medium text-black">
                                        Show only open opportunities
                                      </label>
                                    </div>

                                    <div className="flex gap-3 pt-6">
                                      <Button
                                        variant="outline"
                                        onClick={resetFilters}
                                        className="flex-1 rounded-xl border-slate-200 h-12"
                                      >
                                        Reset All
                                      </Button>
                                      <Button className="flex-1 bg-[#de9151] hover:bg-[#de9151]/90 text-white rounded-xl h-12">
                                        Apply Filters
                                      </Button>
                                    </div>
                                  </div>
                                </ScrollArea>
                              </SheetContent>
                            </Sheet>

                            <Select value={sortBy} onValueChange={setSortBy}>
                              <SelectTrigger className="w-48 bg-slate-50/50 border-slate-200 rounded-lg h-10 hover:bg-slate-100/50 transition-colors text-sm">
                                <ArrowUpDown className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Sort by" />
                              </SelectTrigger>
                              <SelectContent className="rounded-lg border-slate-200">
                                <SelectItem value="nearest">Nearest First</SelectItem>
                                <SelectItem value="newest">Newest First</SelectItem>
                                <SelectItem value="price-high">Price: High to Low</SelectItem>
                                <SelectItem value="price-low">Price: Low to High</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Posts Grid */}
                        {filteredPosts.length === 0 ? (
                          <div className="flex items-center justify-center py-16">
                            {isLoading ? (
                              <div className="flex flex-col items-center gap-4">
                                <div className="relative">
                                  <div className="animate-spin rounded-full h-12 w-12 border-3 border-[#de9151]/20 border-t-[#de9151]" />
                                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#de9151]/10 to-transparent animate-pulse" />
                                </div>
                                <div className="text-center">
                                  <p className="text-base font-medium text-slate-700">Discovering opportunities...</p>
                                  <p className="text-sm text-slate-500 mt-1">Finding the best matches for you</p>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center max-w-md">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-4">
                                  <Search className="h-8 w-8 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-black mb-2">No opportunities found</h3>
                                <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                                  We couldn't find any training opportunities matching your criteria. Try adjusting your
                                  search or filters.
                                </p>
                                <Button
                                  variant="outline"
                                  onClick={resetFilters}
                                  className="border-slate-200 rounded-lg px-4 text-sm"
                                >
                                  Clear all filters
                                </Button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <ScrollArea className="h-[calc(100vh-24rem)]">
                            <div className="grid gap-4 p-4" style={{
                              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))'
                            }}>
                              {filteredPosts.map((post) => (
                                <Card
                                  key={post.id}
                                  className={cn(
                                    "cursor-pointer transition-all duration-300 hover:shadow-xl border-0 group overflow-hidden",
                                    selectedPost?.id === post.id
                                      ? "bg-gradient-to-br from-[#de9151]/8 to-[#de9151]/12 shadow-lg ring-2 ring-[#de9151]/40 scale-[1.02]"
                                      : "bg-white hover:bg-slate-50/80 shadow-md hover:scale-[1.01] border border-slate-100",
                                  )}
                                  onClick={() => handlePostSelect(post)}
                                >
                                  <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-3">
                                      <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-black text-base line-clamp-1 group-hover:text-[#de9151] transition-colors duration-200 mb-2">
                                          {post.title}
                                        </h3>
                                        {post.poster && (
                                          <div className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6 ring-1 ring-white shadow-sm">
                                              <AvatarImage
                                                src={post.poster.avatar || "/placeholder.svg"}
                                                alt={post.poster.firstName}
                                              />
                                              <AvatarFallback className="bg-gradient-to-br from-[#de9151] to-[#de9151]/80 text-white text-xs font-semibold">
                                                {post.poster.firstName[0]}
                                                {post.poster.lastName[0]}
                                              </AvatarFallback>
                                            </Avatar>
                                            <span className="text-xs font-medium text-slate-600">
                                              {post.poster.firstName} {post.poster.lastName}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex flex-col gap-1 items-end">
                                        {getStatusBadge(post.status)}
                                        {getApplyingStatusBadge(post.applyingStatus)}
                                      </div>
                                    </div>

                                    <p className="text-slate-600 line-clamp-2 mb-3 leading-relaxed text-sm">{post.description}</p>

                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                      <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                                          <Clock className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div>
                                          <p className="text-xs font-semibold text-black">{formatTime(post.startTime)}</p>
                                          <p className="text-xs text-slate-500">{formatDate(post.startTime)}</p>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                                          <DollarSign className="h-4 w-4 text-emerald-600" />
                                        </div>
                                        <div>
                                          <p className="text-xs font-semibold text-black">
                                            $
                                            {post.startPrice === post.endPrice
                                              ? post.startPrice
                                              : `${post.startPrice}-${post.endPrice}`}
                                          </p>
                                          <p className="text-xs text-slate-500">per session</p>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                                      <div className="flex items-center gap-1 text-xs text-slate-500">
                                        <MapPin className="h-3 w-3" />
                                        <span className="font-medium">{post.distanceAway.toFixed(1)} km away</span>
                                      </div>
                                      <div className="flex items-center gap-1 text-xs text-slate-500">
                                        <Calendar className="h-3 w-3" />
                                        <span className="font-medium">{getRepeatTypeText(post.repeatType)}</span>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>

                            {hasMore && (
                              <div className="flex justify-center mt-10">
                                <Button
                                  variant="outline"
                                  className="border-slate-200 rounded-xl px-8 h-12 hover:bg-slate-50 transition-colors"
                                  onClick={() => {
                                    fetchExplorePosts(Number(filters.maxDistance), pageNumber + 1)
                                      .then(() => {
                                        if (posts.length === 0) {
                                          setAllOpportunitiesDiscovered(true)
                                        }
                                      })
                                      .catch(() => {
                                        toast("Failed to load more opportunities", {
                                          position: "top-right",
                                          autoClose: 3000
                                        })
                                      })
                                  }}
                                  disabled={isLoading}
                                >
                                  {isLoading ? (
                                    <div className="flex items-center gap-3">
                                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#de9151] border-t-transparent" />
                                      <span className="font-medium">Loading...</span>
                                    </div>
                                  ) : (
                                    <span className="font-medium">Load More Opportunities</span>
                                  )}
                                </Button>
                              </div>
                            )}

                            {allOpportunitiesDiscovered && (
                              <div className="mt-6 flex items-center justify-center gap-2 text-slate-600">
                                <CheckCircle className="h-5 w-5 text-emerald-500" />
                                <span className="text-sm font-medium">You've discovered all available opportunities</span>
                              </div>
                            )}
                          </ScrollArea>
                        )}
                      </TabsContent>

                      <TabsContent value="applied" className="mt-0 space-y-4">
                        {/* Search and Sort */}
                        <div className="space-y-4">
                          <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                              <Input
                                placeholder="Search your applications..."
                                className="pl-10 h-11 bg-slate-50/50 border-slate-200 rounded-lg focus:ring-2 focus:ring-[#de9151]/20 focus:border-[#de9151] transition-all duration-200 text-sm"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleExplore()
                                }}
                              />
                            </div>
                            <Button
                              className="bg-gradient-to-r from-[#de9151] to-[#de9151]/90 hover:from-[#de9151]/90 hover:to-[#de9151]/80 text-white rounded-lg h-11 px-6 shadow-md hover:shadow-lg transition-all duration-200 font-medium text-sm"
                              onClick={handleExplore}
                            >
                              <Search className="h-4 w-4 mr-2" />
                              Search
                            </Button>
                          </div>

                          <div className="flex items-center justify-end">
                            <Select value={sortBy} onValueChange={setSortBy}>
                              <SelectTrigger className="w-48 bg-slate-50/50 border-slate-200 rounded-lg h-10 hover:bg-slate-100/50 transition-colors text-sm">
                                <ArrowUpDown className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Sort by" />
                              </SelectTrigger>
                              <SelectContent className="rounded-lg border-slate-200">
                                <SelectItem value="nearest">Nearest First</SelectItem>
                                <SelectItem value="newest">Newest First</SelectItem>
                                <SelectItem value="price-high">Price: High to Low</SelectItem>
                                <SelectItem value="price-low">Price: Low to High</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {isLoading ? (
                          <div className="flex items-center justify-center py-16">
                            <div className="flex flex-col items-center gap-4">
                              <div className="relative">
                                <div className="animate-spin rounded-full h-12 w-12 border-3 border-[#de9151]/20 border-t-[#de9151]" />
                                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#de9151]/10 to-transparent animate-pulse" />
                              </div>
                              <div className="text-center">
                                <p className="text-base font-medium text-slate-700">Loading your applications...</p>
                                <p className="text-sm text-slate-500 mt-1">Please wait a moment</p>
                              </div>
                            </div>
                          </div>
                        ) : filteredPosts.length === 0 ? (
                          <div className="flex items-center justify-center py-16">
                            <div className="text-center max-w-md">
                              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-4">
                                <Briefcase className="h-8 w-8 text-slate-400" />
                              </div>
                              <h3 className="text-lg font-semibold text-black mb-2">No applications yet</h3>
                              <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                                Start exploring and apply to training opportunities that match your interests and goals.
                              </p>
                              <Button
                                onClick={() => setActiveTab("explore")}
                                className="bg-[#de9151] hover:bg-[#de9151]/90 text-white rounded-xl px-6 h-12"
                              >
                                Explore Opportunities
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <ScrollArea className="h-[calc(100vh-24rem)]">
                            <div className="grid gap-4 p-4" style={{
                              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))'
                            }}>
                              {filteredPosts.map((post) => (
                                <Card
                                  key={post.id}
                                  className={cn(
                                    "cursor-pointer transition-all duration-300 hover:shadow-xl border-0 group overflow-hidden",
                                    selectedPost?.id === post.id
                                      ? "bg-gradient-to-br from-[#de9151]/8 to-[#de9151]/12 shadow-lg ring-2 ring-[#de9151]/40 scale-[1.02]"
                                      : "bg-white hover:bg-slate-50/80 shadow-md hover:scale-[1.01] border border-slate-100",
                                  )}
                                  onClick={() => handlePostSelect(post)}
                                >
                                  <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-3">
                                      <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-black text-base line-clamp-1 group-hover:text-[#de9151] transition-colors duration-200 mb-2">
                                          {post.title}
                                        </h3>
                                        {post.poster && (
                                          <div className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6 ring-1 ring-white shadow-sm">
                                              <AvatarImage
                                                src={post.poster.avatar || "/placeholder.svg"}
                                                alt={post.poster.firstName}
                                              />
                                              <AvatarFallback className="bg-gradient-to-br from-[#de9151] to-[#de9151]/80 text-white text-xs font-semibold">
                                                {post.poster.firstName[0]}
                                                {post.poster.lastName[0]}
                                              </AvatarFallback>
                                            </Avatar>
                                            <span className="text-xs font-medium text-slate-600">
                                              {post.poster.firstName} {post.poster.lastName}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex flex-col gap-1 items-end">
                                        {getStatusBadge(post.status)}
                                        {getApplyingStatusBadge(post.applyingStatus)}
                                      </div>
                                    </div>

                                    <p className="text-slate-600 line-clamp-2 mb-3 leading-relaxed text-sm">{post.description}</p>

                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                      <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                                          <Clock className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div>
                                          <p className="text-xs font-semibold text-black">{formatTime(post.startTime)}</p>
                                          <p className="text-xs text-slate-500">{formatDate(post.startTime)}</p>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                                          <DollarSign className="h-4 w-4 text-emerald-600" />
                                        </div>
                                        <div>
                                          <p className="text-xs font-semibold text-black">
                                            $
                                            {post.startPrice === post.endPrice
                                              ? post.startPrice
                                              : `${post.startPrice}-${post.endPrice}`}
                                          </p>
                                          <p className="text-xs text-slate-500">per session</p>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                                      <div className="flex items-center gap-1 text-xs text-slate-500">
                                        <MapPin className="h-3 w-3" />
                                        <span className="font-medium">{post.distanceAway.toFixed(1)} km away</span>
                                      </div>
                                      <div className="flex items-center gap-1 text-xs text-slate-500">
                                        <Calendar className="h-3 w-3" />
                                        <span className="font-medium">{getRepeatTypeText(post.repeatType)}</span>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>

                            {hasMore && (
                              <div className="flex justify-center mt-10">
                                <Button
                                  variant="outline"
                                  className="border-slate-200 rounded-xl px-8 h-12 hover:bg-slate-50 transition-colors"
                                  onClick={() => {
                                    fetchAppliedPosts(pageNumber + 1)
                                      .then(() => {
                                        if (posts.length === 0) {
                                          setAllOpportunitiesDiscovered(true)
                                        }
                                      })
                                      .catch(() => {
                                        toast("Failed to load more applications", {
                                          position: "top-right",
                                          autoClose: 3000
                                        })
                                      })
                                  }}
                                  disabled={isLoading}
                                >
                                  {isLoading ? (
                                    <div className="flex items-center gap-3">
                                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#de9151] border-t-transparent" />
                                      <span className="font-medium">Loading...</span>
                                    </div>
                                  ) : (
                                    <span className="font-medium">Load More Applications</span>
                                  )}
                                </Button>
                              </div>
                            )}

                            {allOpportunitiesDiscovered && (
                              <div className="mt-6 flex items-center justify-center gap-2 text-slate-600">
                                <CheckCircle className="h-5 w-5 text-emerald-500" />
                                <span className="text-sm font-medium">You've discovered all your applications</span>
                              </div>
                            )}
                          </ScrollArea>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </Panel>

              <PanelResizeHandle className="w-1 bg-slate-200 hover:bg-[#de9151] transition-colors mx-2" />

              {detailPanelOpen && (
                <Panel defaultSize={30} minSize={20}>
                  <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm h-full overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-white to-slate-50/50 border-b border-slate-100 pb-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-black">
                          {selectedPost ? "Opportunity Details" : "Select an Opportunity"}
                        </h2>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDetailPanelOpen(false)}
                          className="lg:hidden hover:bg-slate-100 rounded-lg"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4">
                      {selectedPost ? (
                        <ScrollArea className="h-[calc(100vh-14rem)]">
                          <div className="space-y-6 pr-4">
                            {/* Post Header */}
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <h3 className="text-xl font-bold text-black leading-tight pr-4">{selectedPost.title}</h3>
                                <div className="flex flex-col gap-2 items-end">
                                  {getStatusBadge(selectedPost.status)}
                                  {getApplyingStatusBadge(selectedPost.applyingStatus)}
                                </div>
                              </div>
                              <p className="text-sm text-slate-600">Posted on {formatDate(selectedPost.createdAt)}</p>
                            </div>

                            {/* Poster Info */}
                            {selectedPost.poster && (
                              <Card className="border-slate-200 bg-gradient-to-r from-slate-50/80 to-slate-100/50 overflow-hidden">
                                <CardContent className="p-4">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-12 w-12 ring-2 ring-white shadow-md">
                                      <AvatarImage
                                        src={selectedPost.poster.avatar || "/placeholder.svg"}
                                        alt={selectedPost.poster.firstName}
                                      />
                                      <AvatarFallback className="bg-gradient-to-br from-[#de9151] to-[#de9151]/80 text-white font-bold text-base">
                                        {selectedPost.poster.firstName[0]}
                                        {selectedPost.poster.lastName[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <h4 className="font-bold text-black text-base">
                                        {selectedPost.poster.firstName} {selectedPost.poster.lastName}
                                      </h4>
                                      <p className="text-sm text-slate-600">@{selectedPost.poster.username}</p>
                                      <div className="flex items-center gap-1 mt-1">
                                        {[...Array(5)].map((_, i) => (
                                          <Star key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                                        ))}
                                        <span className="text-xs text-slate-600 ml-1 font-medium">(4.9)</span>
                                      </div>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-slate-500 hover:bg-white/50 rounded-lg"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            )}

                            {/* Description */}
                            <div className="space-y-3">
                              <h4 className="font-bold text-black text-base">Description</h4>
                              <div className="bg-gradient-to-r from-slate-50/80 to-slate-100/50 p-4 rounded-xl border border-slate-200">
                                <p className="text-sm text-slate-700 leading-relaxed">{selectedPost.description}</p>
                              </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 gap-3">
                              <Card className="border-slate-200 bg-gradient-to-br from-blue-50/80 to-indigo-50/60 overflow-hidden">
                                <CardContent className="p-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                                      <Clock className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                      <h5 className="font-bold text-black text-base">Session Time</h5>
                                      <p className="text-sm text-slate-600">
                                        {formatDate(selectedPost.startTime)} at {formatTime(selectedPost.startTime)} -{" "}
                                        {formatTime(selectedPost.endTime)}
                                      </p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>

                              <Card className="border-slate-200 bg-gradient-to-br from-emerald-50/80 to-green-50/60 overflow-hidden">
                                <CardContent className="p-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md">
                                      <DollarSign className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                      <h5 className="font-bold text-black text-base">Price Range</h5>
                                      <p className="text-sm text-slate-600">
                                        $
                                        {selectedPost.startPrice === selectedPost.endPrice
                                          ? selectedPost.startPrice
                                          : `${selectedPost.startPrice} - ${selectedPost.endPrice}`}{" "}
                                        per session
                                      </p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>

                              <Card className="border-slate-200 bg-gradient-to-br from-[#de9151]/8 to-[#de9151]/15 overflow-hidden">
                                <CardContent className="p-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#de9151] to-[#de9151]/80 flex items-center justify-center shadow-md">
                                      <MapPin className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                      <h5 className="font-bold text-black text-base">Location</h5>
                                      <p className="text-sm text-slate-600">
                                        {selectedPost.isAnonymous ? "Anonymous Location" : 
                                         selectedPost.hideAddress ? "Location Hidden" :
                                         selectedPost.placeName || "Location details"} •{" "}
                                        {selectedPost.distanceAway.toFixed(1)} km away
                                      </p>
                                    </div>
                                  </div>
                                  {!selectedPost.isAnonymous && !selectedPost.hideAddress && selectedPost.lat && selectedPost.lng && (
                                    <div className="mt-3 h-32 rounded-lg overflow-hidden border border-slate-200">
                                      <iframe
                                        title="Map overview"
                                        width="100%"
                                        height="100%"
                                        style={{ border: 0 }}
                                        src={`https://maps.google.com/maps?q=${selectedPost.lat},${selectedPost.lng}&z=15&output=embed`}
                                        allowFullScreen
                                      />
                                    </div>
                                  )}
                                </CardContent>
                              </Card>

                              <Card className="border-slate-200 bg-gradient-to-br from-violet-50/80 to-purple-50/60 overflow-hidden">
                                <CardContent className="p-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
                                      <Calendar className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                      <h5 className="font-bold text-black text-base">Frequency</h5>
                                      <p className="text-sm text-slate-600">
                                        {getRepeatTypeText(selectedPost.repeatType)} session
                                      </p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>

                            <Separator className="bg-slate-200" />

                            {/* Application Section */}
                            <div className="space-y-4">
                              <h4 className="font-bold text-black text-base">Apply for this Opportunity</h4>

                              {selectedPost.applyingStatus === 1 ? (
                                <Card className="border-[#de9151]/30 bg-gradient-to-r from-[#de9151]/8 to-[#de9151]/12 overflow-hidden">
                                  <CardContent className="p-4">
                                    <div className="flex items-center gap-3 mb-3">
                                      <CheckCircle className="h-5 w-5 text-[#de9151]" />
                                      <div>
                                        <p className="font-bold text-black text-base">Application Submitted</p>
                                        <p className="text-sm text-slate-600">You have already applied to this opportunity</p>
                                      </div>
                                    </div>
                                    <Button
                                      variant="outline"
                                      className="w-full border-red-200 text-red-600 hover:bg-red-50 rounded-xl h-10 text-sm"
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Cancel Application
                                    </Button>
                                  </CardContent>
                                </Card>
                              ) : selectedPost.status === 1 ? (
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <label className="block text-sm font-bold text-black">
                                      Message to the trainer (optional)
                                    </label>
                                    <textarea
                                      className="w-full h-32 border border-slate-200 rounded-xl px-4 py-3 bg-slate-50/50 focus:ring-2 focus:ring-[#de9151]/20 focus:border-[#de9151] resize-none transition-all duration-200 text-sm"
                                      value={applicationMessage}
                                      onChange={(e) => setApplicationMessage(e.target.value)}
                                      placeholder="Introduce yourself and explain why you're perfect for this opportunity..."
                                    />
                                  </div>
                                  <Button
                                    className="w-full bg-gradient-to-r from-[#de9151] to-[#de9151]/90 hover:from-[#de9151]/90 hover:to-[#de9151]/80 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl h-11 font-semibold text-sm"
                                    onClick={handleApply}
                                    disabled={isApplying}
                                  >
                                    {isApplying ? (
                                      <div className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                        Submitting Application...
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <Send className="h-4 w-4" />
                                        Apply Now
                                      </div>
                                    )}
                                  </Button>
                                </div>
                              ) : (
                                <Card className="border-slate-200 bg-gradient-to-r from-slate-50/80 to-slate-100/50 overflow-hidden">
                                  <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                      <XCircle className="h-5 w-5 text-slate-500" />
                                      <div>
                                        <p className="font-bold text-black text-base">Applications Closed</p>
                                        <p className="text-sm text-slate-600">
                                          This opportunity is no longer accepting applications
                                        </p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              )}
                            </div>
                          </div>
                        </ScrollArea>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center max-w-sm">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-4">
                              <FileText className="h-8 w-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-black mb-2">Select an Opportunity</h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                              Choose a training opportunity from the list to view details and apply
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Panel>
              )}
            </PanelGroup>
          </div>
        </div>
      </div>
    </div>
  )
}
