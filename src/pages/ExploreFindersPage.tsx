"use client"

import { useState, useEffect } from "react"
import {
  Search,
  Filter,
  Calendar,
  DollarSign,
  MapPin,
  Clock,
  CheckCircle,
  Briefcase,
  SlidersHorizontal,
  FileText,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/trainer-finder/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/trainer-finder/seperator"
import { ScrollArea } from "@/components/ui/trainer-finder/scroll-area"
import { useMediaQuery } from "@/hooks/use-mobile"
import { AppLeftSidebar } from "@/components/layout/AppLeftSidebar"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/trainer-finder/sheet"
import { ResizablePanel } from "@/components/ui/trainer-finder/resizable-panel"
import { useFinderStore } from "@/store/FinderStore"

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
  status: number // 0: None, 1: Open, 2: Closed
  applyingStatus: number // 0: None, 1: Applying, 2: Canceled
  createdAt: string
  isAnonymous: boolean
}

interface Application {
  id: number
  postId: string
  post: Post
  message: string
  status: number
  createdAt: string
  modifiedAt: string
}

export default function TrainerExplorerPage() {
  const { posts, isLoading, error, hasMore, fetchExplorePosts } = useFinderStore()
  const [activeTab, setActiveTab] = useState<"explore" | "applied">("explore")
  const [applications, setApplications] = useState<Application[]>([])
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([])
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([])
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [searchInput, setSearchInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<string>("nearest")
  const [applicationStatus, setApplicationStatus] = useState<string>("all")
  const [isApplying, setIsApplying] = useState(false)
  const [applicationMessage, setApplicationMessage] = useState("")
  const isMobile = useMediaQuery("(max-width: 1023px)")
  const [sidebarShow, setSidebarShow] = useState(true)
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

  const handleExplore = () => {
    if (!filters.maxDistance || Number(filters.maxDistance) < 1) {
      setFilters(prev => ({ ...prev, maxDistance: "20" }))
    }
    setSearchQuery(searchInput)
    const maxDistanceKm = Number(filters.maxDistance)
    fetchExplorePosts(maxDistanceKm)
  }

  const handleMaxDistanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === "" || (Number(value) >= 1 && Number(value) <= 100)) {
      setFilters(prev => ({ ...prev, maxDistance: value }))
    }
  }

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
          (post.poster && (
            post.poster.firstName.toLowerCase().includes(query) ||
            post.poster.lastName.toLowerCase().includes(query)
          ))
      )
    }

    // Apply price filter
    if (filters.priceMin) {
      result = result.filter((post) => post.startPrice >= Number(filters.priceMin))
    }
    if (filters.priceMax) {
      result = result.filter((post) => post.endPrice <= Number(filters.priceMax))
    }

    // Apply date filters
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom)
      result = result.filter((post) => new Date(post.startTime) >= fromDate)
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo)
      result = result.filter((post) => new Date(post.startTime) <= toDate)
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

    // If the selected post is filtered out, select the first available post
    if (selectedPost && !result.find((post) => post.id === selectedPost.id) && result.length > 0) {
      setSelectedPost(result[0])
    } else if (result.length === 0) {
      setSelectedPost(null)
    }
  }, [posts, searchQuery, sortBy, filters, selectedPost])

  useEffect(() => {
    // Apply filters to applications
    let result = [...applications]

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (app) => app.post.title.toLowerCase().includes(query) || app.post.description.toLowerCase().includes(query),
      )
    }

    // Apply status filter
    if (applicationStatus !== "all") {
      const statusMap: Record<string, number> = {
        pending: 1,
        accepted: 2,
        declined: 3,
      }
      result = result.filter((app) => app.status === statusMap[applicationStatus])
    }

    // Sort by date (newest first)
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    setFilteredApplications(result)

    // If the selected application is filtered out, select the first available application
    if (selectedApplication && !result.find((app) => app.id === selectedApplication.id) && result.length > 0) {
      setSelectedApplication(result[0])
    } else if (result.length === 0) {
      setSelectedApplication(null)
    }
  }, [applications, searchQuery, applicationStatus, selectedApplication])

  useEffect(() => {
    const updateSidebarShow = () => {
      const sidebarState = localStorage.getItem("sidebarShow")
      setSidebarShow(sidebarState === null ? true : sidebarState === "true")
    }
    updateSidebarShow()
    window.addEventListener("storage", updateSidebarShow)
    window.addEventListener("sidebarToggled", updateSidebarShow)
    return () => {
      window.removeEventListener("storage", updateSidebarShow)
      window.removeEventListener("sidebarToggled", updateSidebarShow)
    }
  }, [])

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
        return <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-md font-normal">None</Badge>
      case 1:
        return (
          <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-md font-normal">Open</Badge>
        )
      case 2:
        return (
          <Badge className="bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-md font-normal">Closed</Badge>
        )
      default:
        return <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-md font-normal">Unknown</Badge>
    }
  }

  const getApplyingStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return null
      case 1:
        return <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md font-normal">Applying</Badge>
      case 2:
        return <Badge className="bg-red-50 text-red-600 hover:bg-red-100 rounded-md font-normal">Canceled</Badge>
      default:
        return null
    }
  }

  const getApplicationStatusBadge = (status: number) => {
    switch (status) {
      case 1:
        return <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md font-normal">Pending</Badge>
      case 2:
        return (
          <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-md font-normal">Accepted</Badge>
        )
      case 3:
        return <Badge className="bg-red-50 text-red-600 hover:bg-red-100 rounded-md font-normal">Declined</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-md font-normal">Unknown</Badge>
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
    } else {
      setDetailPanelOpen(true)
    }
  }

  const handleApplicationSelect = (application: Application) => {
    setSelectedApplication(application)
    if (isMobile) {
      setDetailPanelOpen(true)
    } else {
      setDetailPanelOpen(true)
    }
  }

  const handleApply = () => {
    if (!selectedPost) return

    setIsApplying(true)

    // Simulate API call
    setTimeout(() => {
      const newApplication: Application = {
        id: applications.length + 1,
        postId: selectedPost.id,
        post: selectedPost,
        message: applicationMessage,
        status: 1, // Pending
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
      }

      setApplications([newApplication, ...applications])
      setApplicationMessage("")
      setIsApplying(false)

      // Switch to applied tab and select the new application
      setActiveTab("applied")
      setSelectedApplication(newApplication)
    }, 1000)
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

  const handleLoadMore = () => {
    const maxDistanceKm = Number(filters.maxDistance)
    fetchExplorePosts(maxDistanceKm, posts.length / 10 + 1)
  }

  // Update error handling
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-500 mb-2">{error}</p>
          <Button onClick={() => fetchExplorePosts(Number(filters.maxDistance))}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative bg-[#f9fafb] h-screen overflow-hidden">
      <div className="relative h-full">
        <AppLeftSidebar />
        <div
          className={`h-full pt-4 pb-4 px-4 transition-all duration-300 ${
            sidebarShow ? "lg:pl-72" : "lg:pl-24 lg:ml-4"
          }`}
        >
          <div className="flex flex-col gap-4 h-full">
            <ResizablePanel
              leftPanel={
                <div className="bg-white rounded-xl flex flex-col h-full p-4 shadow-lg border border-gray-200">
                  <div className="flex items-center mb-4">
                    <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">Trainer Explorer</h1>
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-auto"
                      onClick={() => setDetailPanelOpen(!detailPanelOpen)}
                    >
                      {detailPanelOpen ? "Hide Details" : "Show Details"}
                    </Button>
                  </div>

                  <Tabs
                    value={activeTab}
                    onValueChange={(v) => setActiveTab(v as "explore" | "applied")}
                    className="flex-1 flex flex-col"
                  >
                    <TabsList className="bg-gray-50/70 p-1 rounded-full flex mb-4">
                      <TabsTrigger
                        value="explore"
                        className={cn(
                          "rounded-full flex-1 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm",
                          activeTab === "explore" &&
                            "data-[state=active]:bg-[#DE9151]/10 data-[state=active]:text-[#DE9151]",
                        )}
                      >
                        Explore Posts
                      </TabsTrigger>
                      <TabsTrigger
                        value="applied"
                        className={cn(
                          "rounded-full flex-1 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm",
                          activeTab === "applied" &&
                            "data-[state=active]:bg-[#4A6FA5]/10 data-[state=active]:text-[#4A6FA5]",
                        )}
                      >
                        My Applications
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="explore" className="flex-1 flex flex-col mt-0 data-[state=inactive]:hidden">
                      <div className="relative mb-2 flex items-center gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            placeholder="Search posts..."
                            className="pl-10 bg-white/90 border-gray-200/80 rounded-md focus-visible:ring-[#4A6FA5]/20 focus-visible:ring-offset-0"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleExplore()
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2 bg-white/90 border border-gray-200/80 rounded-md px-3 py-1">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <Input
                              type="number"
                              min="1"
                              max="100"
                              value={filters.maxDistance}
                              onChange={handleMaxDistanceChange}
                              onBlur={(e) => {
                                if (!e.target.value || Number(e.target.value) < 1) {
                                  setFilters(prev => ({ ...prev, maxDistance: "20" }))
                                }
                              }}
                              className="w-20 border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                            />
                            <span className="text-sm text-gray-500">km</span>
                          </div>
                          <Button
                            className="px-3 py-1 bg-[#DE9151] text-white rounded-md hover:bg-[#DE9151]/90 transition-colors"
                            onClick={handleExplore}
                          >
                            Explore
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center w-full mb-4">
                        <Sheet>
                          <SheetTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1">
                              <SlidersHorizontal className="h-4 w-4" />
                              Filters
                            </Button>
                          </SheetTrigger>
                          <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                            <div className="flex justify-between items-center mb-6">
                              <h3 className="text-lg font-medium">Filters</h3>
                              <Button variant="ghost" size="sm" onClick={resetFilters}>
                                Reset
                              </Button>
                            </div>

                            <div className="space-y-6">
                              <div className="space-y-3">
                                <h4 className="text-sm font-medium">Price Range</h4>
                                <div className="flex gap-3">
                                  <div className="flex-1">
                                    <label className="text-xs text-gray-500">Min ($)</label>
                                    <Input
                                      type="number"
                                      placeholder="0"
                                      value={filters.priceMin}
                                      onChange={(e) => setFilters({ ...filters, priceMin: e.target.value })}
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <label className="text-xs text-gray-500">Max ($)</label>
                                    <Input
                                      type="number"
                                      placeholder="Any"
                                      value={filters.priceMax}
                                      onChange={(e) => setFilters({ ...filters, priceMax: e.target.value })}
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <h4 className="text-sm font-medium">Date Range</h4>
                                <div className="space-y-3">
                                  <div>
                                    <label className="text-xs text-gray-500">From</label>
                                    <Input
                                      type="date"
                                      value={filters.dateFrom}
                                      onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-500">To</label>
                                    <Input
                                      type="date"
                                      value={filters.dateTo}
                                      onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="show-open"
                                  checked={filters.showOnlyOpen}
                                  onCheckedChange={(checked) =>
                                    setFilters({ ...filters, showOnlyOpen: checked as boolean })
                                  }
                                />
                                <label
                                  htmlFor="show-open"
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  Show only open posts
                                </label>
                              </div>

                              <Button
                                className="w-full bg-[#DE9151] hover:bg-[#DE9151]/90"
                                onClick={() => {
                                  const element = document.querySelector("[data-radix-collection-item]")
                                  if (element instanceof HTMLElement) {
                                    element.click()
                                  }
                                }}
                              >
                                Apply Filters
                              </Button>
                            </div>
                          </SheetContent>
                        </Sheet>

                        <div className="ml-auto">
                          <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="bg-white/90 border-gray-200/80 rounded-md focus:ring-[#4A6FA5]/20 focus:ring-offset-0 w-[140px]">
                              <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent className="rounded-lg">
                              <SelectItem value="nearest">Nearest First</SelectItem>
                              <SelectItem value="newest">Newest First</SelectItem>
                              <SelectItem value="price-high">Price: High to Low</SelectItem>
                              <SelectItem value="price-low">Price: Low to High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {filteredPosts.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center bg-white/90 rounded-xl p-6">
                          {isLoading ? (
                            <div className="flex justify-center items-center w-full h-full">
                              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#DE9151]" />
                            </div>
                          ) : (
                            <div className="text-center">
                              <Filter className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                              <p className="text-gray-500">No posts found within {filters.maxDistance} km</p>
                              <Button variant="link" className="text-[#DE9151] mt-2" onClick={resetFilters}>
                                Clear filters
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <ScrollArea className="flex-1 -mx-4 px-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-2 post-grid">
                            {filteredPosts.map((post) => (
                              <div
                                key={post.id}
                                className="p-5 rounded-xl cursor-pointer transition-all bg-white hover:bg-gray-50 border border-transparent hover:border-gray-100 h-full flex flex-col"
                                onClick={() => handlePostSelect(post)}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <h3 className="font-medium text-gray-900 line-clamp-1">{post.title}</h3>
                                  <div className="flex gap-2">
                                    {getStatusBadge(post.status)}
                                    {getApplyingStatusBadge(post.applyingStatus)}
                                  </div>
                                </div>
                                <p className="text-sm text-gray-500 line-clamp-2 mb-3 flex-grow">{post.description}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                  <Clock className="h-3 w-3 mr-1 text-[#DE9151]" />
                                  <span>
                                    {formatTime(post.startTime)} - {formatTime(post.endTime)}
                                  </span>
                                  <span className="mx-2">|</span>
                                  <DollarSign className="h-3 w-3 mr-1 text-[#DE9151]" />
                                  <span>
                                    {post.startPrice === post.endPrice
                                      ? `$${post.startPrice}`
                                      : `$${post.startPrice} - $${post.endPrice}`}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-xs text-gray-400">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>{formatDate(post.startTime)}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    <span>{(post.distanceAway || 0).toFixed(1)} km away</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          {hasMore && posts.length > 0 && (
                            <div className="flex justify-center mt-6 mb-4">
                              <Button
                                variant="outline"
                                className="px-8"
                                onClick={handleLoadMore}
                                disabled={isLoading}
                              >
                                {isLoading ? (
                                  <span className="flex items-center gap-2">
                                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#DE9151]"></span>
                                    Loading...
                                  </span>
                                ) : (
                                  "Explore More"
                                )}
                              </Button>
                            </div>
                          )}
                          {!hasMore && posts.length > 0 && (
                            <div className="text-center text-gray-500 mt-6 mb-4">
                              You've discovered all posts within {filters.maxDistance} km
                            </div>
                          )}
                        </ScrollArea>
                      )}
                    </TabsContent>

                    <TabsContent value="applied" className="flex-1 flex flex-col mt-0 data-[state=inactive]:hidden">
                      <div className="relative mb-2 flex items-center gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            placeholder="Search applications..."
                            className="pl-10 bg-white/90 border-gray-200/80 rounded-md focus-visible:ring-[#4A6FA5]/20 focus-visible:ring-offset-0"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") setSearchQuery(searchInput)
                            }}
                          />
                        </div>
                        <Button
                          className="ml-2 px-3 py-1 bg-[#4A6FA5] text-white rounded-md hover:bg-[#4A6FA5]/90 transition-colors"
                          onClick={() => setSearchQuery(searchInput)}
                        >
                          Search
                        </Button>
                      </div>

                      <div className="flex items-center w-full mb-4">
                        <Select value={applicationStatus} onValueChange={setApplicationStatus}>
                          <SelectTrigger className="bg-white/90 border-gray-200/80 rounded-md focus:ring-[#4A6FA5]/20 focus:ring-offset-0 w-[140px]">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg">
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="accepted">Accepted</SelectItem>
                            <SelectItem value="declined">Declined</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {filteredApplications.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center bg-white/90 rounded-xl p-6">
                          {isLoading ? (
                            <div className="flex justify-center items-center w-full h-full">
                              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4A6FA5]" />
                            </div>
                          ) : (
                            <div className="text-center">
                              <Briefcase className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                              <p className="text-gray-500">No applications found</p>
                              <Button
                                variant="link"
                                className="text-[#4A6FA5] mt-2"
                                onClick={() => {
                                  setSearchInput("")
                                  setSearchQuery("")
                                  setApplicationStatus("all")
                                }}
                              >
                                Clear filters
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <ScrollArea className="flex-1 -mx-4 px-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-2 post-grid">
                            {filteredApplications.map((application) => (
                              <div
                                key={application.id}
                                className="p-5 rounded-xl cursor-pointer transition-all bg-white hover:bg-gray-50 border border-transparent hover:border-gray-100 h-full flex flex-col"
                                onClick={() => handleApplicationSelect(application)}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <h3 className="font-medium text-gray-900 line-clamp-1">{application.post.title}</h3>
                                  {getApplicationStatusBadge(application.status)}
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src="/placeholder.svg" alt={application.post.poster?.firstName} />
                                    <AvatarFallback className="bg-[#DE9151]/10 text-[#DE9151] text-xs">
                                      {application.post.poster?.firstName?.[0]}
                                      {application.post.poster?.lastName?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm text-gray-600">
                                    {application.post.poster?.firstName} {application.post.poster?.lastName}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2 flex-grow">
                                  <Clock className="h-3 w-3 mr-1 text-[#4A6FA5]" />
                                  <span>
                                    {formatTime(application.post.startTime)} - {formatTime(application.post.endTime)}
                                  </span>
                                  <span className="mx-2">|</span>
                                  <DollarSign className="h-3 w-3 mr-1 text-[#4A6FA5]" />
                                  <span>
                                    {application.post.startPrice === application.post.endPrice
                                      ? `$${application.post.startPrice}`
                                      : `$${application.post.startPrice} - $${application.post.endPrice}`}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-xs text-gray-400">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>Applied on {formatDate(application.createdAt)}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              }
              rightPanel={
                <div className="bg-white/90 rounded-xl flex flex-col h-full p-4 shadow-md border border-gray-200/80">
                  {activeTab === "explore" && selectedPost ? (
                    <ScrollArea className="flex-1 -mx-4 px-4">
                      <div className="space-y-6">
                        {/* Post Header */}
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <h2 className="text-2xl font-semibold text-gray-800 tracking-tight">
                                {selectedPost.title}
                              </h2>
                              {getStatusBadge(selectedPost.status)}
                            </div>
                            <p className="text-sm text-gray-400 mt-1">Posted on {formatDate(selectedPost.createdAt)}</p>
                          </div>
                        </div>

                        {/* Poster Info */}
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                            <AvatarImage src="/placeholder.svg" alt={selectedPost.poster?.firstName} />
                            <AvatarFallback className="bg-gradient-to-br from-[#DE9151] to-[#c27a40] text-white">
                              {selectedPost.poster?.firstName?.[0]}
                              {selectedPost.poster?.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {selectedPost.poster?.firstName} {selectedPost.poster?.lastName}
                            </h3>
                            <p className="text-sm text-gray-400">@{selectedPost.poster?.username}</p>
                          </div>
                        </div>

                        {/* Post Description */}
                        <div>
                          <h3 className="text-lg font-medium text-gray-800 mb-2">Description</h3>
                          <p className="text-gray-600 leading-relaxed">{selectedPost.description}</p>
                        </div>

                        {/* Post Details */}
                        <div className="grid grid-cols-1 gap-6">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-md bg-gradient-to-br from-[#DE9151]/5 to-[#4A6FA5]/10 flex items-center justify-center flex-shrink-0">
                              <Clock className="h-5 w-5 text-[#DE9151]" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">Session Time</p>
                              <p className="text-gray-500 mt-1">
                                {formatDate(selectedPost.startTime)}
                                <br />
                                {formatTime(selectedPost.startTime)} - {formatTime(selectedPost.endTime)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-md bg-gradient-to-br from-[#DE9151]/5 to-[#4A6FA5]/10 flex items-center justify-center flex-shrink-0">
                              <DollarSign className="h-5 w-5 text-[#DE9151]" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">Price</p>
                              <p className="text-gray-500 mt-1">
                                {selectedPost.startPrice === selectedPost.endPrice
                                  ? `$${selectedPost.startPrice}`
                                  : `$${selectedPost.startPrice} - $${selectedPost.endPrice}`}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-md bg-gradient-to-br from-[#DE9151]/5 to-[#4A6FA5]/10 flex items-center justify-center flex-shrink-0">
                              <Calendar className="h-5 w-5 text-[#DE9151]" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">Frequency</p>
                              <p className="text-gray-500 mt-1">{getRepeatTypeText(selectedPost.repeatType)}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-md bg-gradient-to-br from-[#DE9151]/5 to-[#4A6FA5]/10 flex items-center justify-center flex-shrink-0">
                              <MapPin className="h-5 w-5 text-[#DE9151]" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">Location</p>
                              <p className="text-gray-500 mt-1">
                                {selectedPost.hideAddress
                                  ? "Exact address will be shared after acceptance"
                                  : "Address visible to applicants"}
                              </p>
                              <p className="text-sm text-gray-400 mt-1">
                                {(selectedPost.distanceAway || 0).toFixed(1)} km from your location
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Map Section */}
                        {!selectedPost.hideAddress && selectedPost.lat && selectedPost.lng && (
                          <div className="w-full">
                            <div className="rounded-lg overflow-hidden border w-full h-[200px]">
                              <iframe
                                title="Map overview"
                                width="100%"
                                height="200"
                                style={{ border: 0 }}
                                src={`https://maps.google.com/maps?q=${selectedPost.lat},${selectedPost.lng}&z=15&output=embed`}
                                allowFullScreen
                              ></iframe>
                            </div>
                          </div>
                        )}

                        <Separator className="bg-gray-100" />

                        {/* Application Section */}
                        <div>
                          <h3 className="text-lg font-medium text-gray-800 mb-4">Apply for this Post</h3>

                          {/* Check applying status */}
                          {selectedPost.applyingStatus === 1 ? (
                            <div className="space-y-4">
                              <div className="bg-blue-50 text-blue-700 p-4 rounded-lg flex items-center gap-3">
                                <CheckCircle className="h-5 w-5" />
                                <p>You have already applied to this post.</p>
                              </div>
                              <Button
                                variant="destructive"
                                className="w-full"
                                onClick={() => {
                                  // TODO: Implement cancel application
                                  console.log("Cancel application")
                                }}
                              >
                                Cancel Application
                              </Button>
                            </div>
                          ) : selectedPost.applyingStatus === 2 ? (
                            <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-3">
                              <XCircle className="h-5 w-5" />
                              <p>You have canceled your application for this post.</p>
                            </div>
                          ) : selectedPost.status === 1 ? (
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Message to the poster (optional)
                                </label>
                                <textarea
                                  className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-[#4A6FA5] focus:border-transparent"
                                  rows={4}
                                  value={applicationMessage}
                                  onChange={(e) => setApplicationMessage(e.target.value)}
                                  placeholder="Introduce yourself and explain why you're a good fit for this opportunity..."
                                />
                              </div>
                              <Button
                                className="bg-gradient-to-r from-[#DE9151] to-[#c27a40] hover:from-[#c27a40] hover:to-[#a56835] text-white rounded-full shadow-sm px-6"
                                onClick={handleApply}
                                disabled={isApplying}
                              >
                                {isApplying ? (
                                  <span className="flex items-center gap-2">
                                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                    Applying...
                                  </span>
                                ) : (
                                  "Apply Now"
                                )}
                              </Button>
                            </div>
                          ) : (
                            <div className="bg-gray-50 text-gray-700 p-4 rounded-lg flex items-center gap-3">
                              <XCircle className="h-5 w-5" />
                              <p>This post is no longer accepting applications.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </ScrollArea>
                  ) : activeTab === "applied" && selectedApplication ? (
                    <ScrollArea className="flex-1 -mx-4 px-4">
                      <div className="space-y-6">
                        {/* Application Header */}
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <h2 className="text-2xl font-semibold text-gray-800 tracking-tight">
                                {selectedApplication.post.title}
                              </h2>
                              {getApplicationStatusBadge(selectedApplication.status)}
                            </div>
                            <p className="text-sm text-gray-400 mt-1">
                              Applied on {formatDate(selectedApplication.createdAt)}
                            </p>
                          </div>
                        </div>

                        {/* Poster Info */}
                        {selectedApplication.post.poster && (
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                              <AvatarImage src="/placeholder.svg" alt={selectedApplication.post.poster.firstName} />
                              <AvatarFallback className="bg-gradient-to-br from-[#4A6FA5] to-[#3a5a84] text-white">
                                {selectedApplication.post.poster.firstName[0]}
                                {selectedApplication.post.poster.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {selectedApplication.post.poster.firstName} {selectedApplication.post.poster.lastName}
                              </h3>
                              <p className="text-sm text-gray-400">@{selectedApplication.post.poster.username}</p>
                            </div>
                          </div>
                        )}

                        {/* Application Message */}
                        {selectedApplication.message && (
                          <div>
                            <h3 className="text-lg font-medium text-gray-800 mb-2">Your Application Message</h3>
                            <div className="bg-[#4A6FA5]/5 p-4 rounded-lg border border-[#4A6FA5]/10">
                              <p className="text-gray-600 leading-relaxed">{selectedApplication.message}</p>
                            </div>
                          </div>
                        )}

                        {/* Post Description */}
                        <div>
                          <h3 className="text-lg font-medium text-gray-800 mb-2">Post Description</h3>
                          <p className="text-gray-600 leading-relaxed">{selectedApplication.post.description}</p>
                        </div>

                        {/* Post Details */}
                        <div className="grid grid-cols-1 gap-6">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-md bg-gradient-to-br from-[#4A6FA5]/5 to-[#4A6FA5]/10 flex items-center justify-center flex-shrink-0">
                              <Clock className="h-5 w-5 text-[#4A6FA5]" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">Session Time</p>
                              <p className="text-gray-500 mt-1">
                                {formatDate(selectedApplication.post.startTime)}
                                <br />
                                {formatTime(selectedApplication.post.startTime)} -{" "}
                                {formatTime(selectedApplication.post.endTime)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-md bg-gradient-to-br from-[#4A6FA5]/5 to-[#4A6FA5]/10 flex items-center justify-center flex-shrink-0">
                              <DollarSign className="h-5 w-5 text-[#4A6FA5]" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">Price</p>
                              <p className="text-gray-500 mt-1">
                                {selectedApplication.post.startPrice === selectedApplication.post.endPrice
                                  ? `$${selectedApplication.post.startPrice}`
                                  : `$${selectedApplication.post.startPrice} - $${selectedApplication.post.endPrice}`}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-md bg-gradient-to-br from-[#4A6FA5]/5 to-[#4A6FA5]/10 flex items-center justify-center flex-shrink-0">
                              <Calendar className="h-5 w-5 text-[#4A6FA5]" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">Frequency</p>
                              <p className="text-gray-500 mt-1">
                                {getRepeatTypeText(selectedApplication.post.repeatType)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-md bg-gradient-to-br from-[#4A6FA5]/5 to-[#4A6FA5]/10 flex items-center justify-center flex-shrink-0">
                              <MapPin className="h-5 w-5 text-[#4A6FA5]" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">Location</p>
                              <p className="text-gray-500 mt-1">
                                {selectedApplication.post.hideAddress
                                  ? selectedApplication.status === 2
                                    ? "Address will be shared via message"
                                    : "Exact address will be shared after acceptance"
                                  : "Address visible to applicants"}
                              </p>
                              <p className="text-sm text-gray-400 mt-1">
                                {(selectedApplication.post.distanceAway || 0).toFixed(1)} km from your location
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Map Section */}
                        {(!selectedApplication.post.hideAddress || selectedApplication.status === 2) &&
                          selectedApplication.post.lat &&
                          selectedApplication.post.lng && (
                            <div className="w-full">
                              <div className="rounded-lg overflow-hidden border w-full h-[200px]">
                                <iframe
                                  title="Map overview"
                                  width="100%"
                                  height="200"
                                  style={{ border: 0 }}
                                  src={`https://maps.google.com/maps?q=${selectedApplication.post.lat},${selectedApplication.post.lng}&z=15&output=embed`}
                                  allowFullScreen
                                ></iframe>
                              </div>
                            </div>
                          )}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center max-w-md">
                        <div className="w-20 h-20 rounded-md bg-gradient-to-br from-[#DE9151]/10 to-[#4A6FA5]/20 flex items-center justify-center mx-auto mb-6">
                          <FileText className="h-10 w-10 text-[#DE9151]" />
                        </div>
                        <h3 className="text-2xl font-medium text-gray-800 tracking-tight mb-3">
                          {activeTab === "explore" ? "No Post Selected" : "No Application Selected"}
                        </h3>
                        <p className="text-gray-500 mb-8 max-w-xs mx-auto">
                          {activeTab === "explore"
                            ? "Select a post from the list to view its details and apply"
                            : "Select an application from the list to view its details"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              }
              rightPanelOpen={detailPanelOpen}
              onRightPanelOpenChange={setDetailPanelOpen}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
