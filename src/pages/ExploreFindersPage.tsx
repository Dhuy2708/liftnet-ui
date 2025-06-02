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
  X,
  Coins,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/trainer-finder/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/trainer-finder/scroll-area"
import { Card, CardContent, CardHeader } from "@/components/ui/trainer-finder/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/trainer-finder/sheet"
import { cn } from "@/lib/utils"
import { AppLeftSidebar } from "@/components/layout/AppLeftSidebar"
import { useFinderStore } from "@/store/FinderStore"
import { Panel, PanelGroup, PanelResizeHandle } from "@/components/ui/resizable"
import { toast } from "react-toastify"
import { useProfileStore } from "@/store/ProfileStore"
import { useNavigate } from "react-router-dom"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useConversationStore } from "@/store/ConversationStore"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import axios from "axios"

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
  const [applicantTab, setApplicantTab] = useState<"applying" | "accepted" | "canceled">("applying")
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([])
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [searchInput, setSearchInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<string>("nearest")
  const [isApplying, setIsApplying] = useState(false)
  const [applicationMessage, setApplicationMessage] = useState("")
  const [showApplyForm, setShowApplyForm] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
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
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [isBooking, setIsBooking] = useState(false)
  const [bookingMessage, setBookingMessage] = useState<{text: string, success: boolean} | null>(null)
  const [appointmentName, setAppointmentName] = useState("")
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)

  const { posts, isLoading, hasMore, fetchExplorePosts, fetchAppliedPosts, pageNumber, applyToPost } = useFinderStore()
  const navigate = useNavigate()
  const { address, isLoading: isLoadingAddress, fetchAddress } = useProfileStore()
  const { getConversationIdByUserId } = useConversationStore()

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

    // Apply price filter only in explore tab
    if (activeTab === "explore") {
      if (filters.priceMin) {
        result = result.filter((post) => post.startPrice >= Number(filters.priceMin))
      }
      if (filters.priceMax) {
        result = result.filter((post) => post.endPrice <= Number(filters.priceMax))
      }

      // Apply status filter only in explore tab
      if (filters.showOnlyOpen) {
        result = result.filter((post) => post.status === 1)
      }
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
  }, [posts, searchQuery, sortBy, filters, selectedPost, activeTab])

  useEffect(() => {
    fetchAddress()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatLocalTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

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
      case 3:
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 font-medium">
            Matched
          </Badge>
        )
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getApplyingStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return null // None
      case 1:
        return <Badge className="bg-[#de9151]/15 text-[#de9151] border-[#de9151]/30 font-medium">Applied</Badge>
      case 2:
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200 font-medium">
            Canceled
          </Badge>
        )
      case 3:
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 font-medium">
            Rejected
          </Badge>
        )
      case 4:
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200 font-medium">
            Accepted
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
    setApplicationMessage("")
    setShowApplyForm(false)
  }

  const handleApply = async () => {
    if (!selectedPost) return

    setIsApplying(true)
    try {
      await applyToPost(selectedPost.id, applicationMessage)
      // Update selected post's applyingStatus
        setSelectedPost(prev => prev ? { ...prev, applyingStatus: 1 } : null)
      // Update the post in filteredPosts
        setFilteredPosts(prev => 
          prev.map(post => 
            post.id === selectedPost.id 
              ? { ...post, applyingStatus: 1 }
              : post
          )
        )
      setShowApplyForm(false)
        toast.success("Application submitted successfully!")
    } catch {
      toast.error("Failed to submit application")
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

  const handleMessage = async (userId: string) => {
    try {
      const conversationId = await getConversationIdByUserId(userId)
      if (conversationId) {
        window.open(`/chat/${conversationId}`, '_blank')
      } else {
        toast.error("Failed to start conversation")
      }
    } catch {
      toast.error("Failed to start conversation")
    }
  }

  const handleViewProfile = (userId: string) => {
    window.open(`/profile/${userId}`, '_blank')
  }

  const handleCreateAppointment = async () => {
    if (!selectedPost) return
    setIsBooking(true)
    setBookingMessage(null)

    // Convert local time to UTC
    const toUTCISOString = (localTime: string) => {
      const date = new Date(localTime)
      return date.toISOString()
    }

    const body = {
      participantIds: [selectedPost.poster?.id],
      name: appointmentName || `Appointment with ${selectedPost.poster?.firstName} ${selectedPost.poster?.lastName}`,
      description: "",
      placeId: selectedPost.placeName,
      startTime: toUTCISOString(selectedPost.startTime),
      endTime: toUTCISOString(selectedPost.endTime),
      repeatingType: 0,
      price: selectedPost.startPrice
    }
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/Appointment/book`, body, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        }
      })
      setShowSuccessDialog(true)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      setBookingMessage({text: error?.response?.data?.message || 'Error', success: false})
    } finally {
      setIsBooking(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-[#de9151]/5 h-[calc(100vh-3.8rem)] overflow-auto">
      <AppLeftSidebar
        onToggle={() => {
          const newShow = !showSidebars
          setShowSidebars(newShow)
          localStorage.setItem("sidebarShow", String(newShow))
        }}
      />

      <div className={cn("transition-all duration-300 ease-in-out", showSidebars ? "lg:pl-72" : "lg:pl-24")}>
        <div className="container mx-auto px-0 py-4 pr-4">
          {isLoadingAddress ? (
            <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="animate-spin rounded-full h-12 w-12 border-3 border-[#de9151]/20 border-t-[#de9151]" />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#de9151]/10 to-transparent animate-pulse" />
                </div>
                <div className="text-center">
                  <p className="text-base font-medium text-slate-700">Loading your location...</p>
                  <p className="text-sm text-slate-500 mt-1">Please wait a moment</p>
                </div>
              </div>
            </div>
          ) : !address ? (
            <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-black mb-2">Location Required</h3>
                <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                  To explore training opportunities, you need to add your location in your profile settings. This helps us find the best matches near you.
                </p>
                <Button
                  onClick={() => navigate("/profile")}
                  className="bg-[#de9151] hover:bg-[#de9151]/90 text-white rounded-xl px-6 h-12"
                >
                  Add Location
                </Button>
              </div>
            </div>
          ) : (
            <>
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
                      <MapPin className="h-4 w-4 text-[#de9151]" />
                      <span className="text-sm font-medium text-slate-700">{address.placeName}</span>
                    </div>
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
                <PanelGroup direction="horizontal" className="min-h-[calc(100vh-14rem)]">
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
                                              <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6 ring-1 ring-white shadow-sm">
                                                  <AvatarImage
                                                  src={post.poster?.avatar || "/placeholder.svg"}
                                                  alt={post.poster?.firstName}
                                                  />
                                                  <AvatarFallback className="bg-gradient-to-br from-[#de9151] to-[#de9151]/80 text-white text-xs font-semibold">
                                                  {post.poster?.firstName?.[0]}
                                                  {post.poster?.lastName?.[0]}
                                                  </AvatarFallback>
                                                </Avatar>
                                              {post.isAnonymous ? (
                                                <Badge className="bg-slate-100 text-slate-700 border-slate-200 font-medium text-xs">
                                                  Anonymous
                                                </Badge>
                                              ) : (
                                                <TooltipProvider>
                                                  <Tooltip>
                                                    <TooltipTrigger asChild>
                                                      <span className="text-xs font-medium text-slate-600 truncate max-w-[150px]">
                                                        {post.poster?.email}
                                                </span>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                      <p>{post.poster?.email}</p>
                                                    </TooltipContent>
                                                  </Tooltip>
                                                </TooltipProvider>
                                              )}
                                              </div>
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
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#de9151]/10 to-[#de9151]/20 flex items-center justify-center">
                                              <Coins className="h-4 w-4 text-[#de9151]" />
                                            </div>
                                            <div>
                                              <p className="text-xs font-semibold text-black">
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
                                  <SelectContent>
                                    <SelectItem value="newest">Newest First</SelectItem>
                                    <SelectItem value="oldest">Oldest First</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <Tabs value={applicantTab} onValueChange={(v) => {
                                setApplicantTab(v as "applying" | "accepted" | "canceled")
                                setCurrentPage(1)
                              }}>
                                <TabsList className="w-full bg-slate-100 p-1 rounded-lg">
                                  <TabsTrigger
                                    value="applying"
                                    className="flex-1 rounded-md py-2 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-black transition-all duration-200"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Send className="h-4 w-4" />
                                      <span className="font-medium text-sm">Applying</span>
                            </div>
                                  </TabsTrigger>
                                  <TabsTrigger
                                    value="accepted"
                                    className="flex-1 rounded-md py-2 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-black transition-all duration-200"
                                  >
                                    <div className="flex items-center gap-2">
                                      <CheckCircle className="h-4 w-4" />
                                      <span className="font-medium text-sm">Accepted</span>
                                    </div>
                                  </TabsTrigger>
                                  <TabsTrigger
                                    value="canceled"
                                    className="flex-1 rounded-md py-2 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-black transition-all duration-200"
                                  >
                                    <div className="flex items-center gap-2">
                                      <XCircle className="h-4 w-4" />
                                      <span className="font-medium text-sm">Closed</span>
                                    </div>
                                  </TabsTrigger>
                                </TabsList>

                                <TabsContent value="applying" className="mt-4">
                                  {filteredPosts.filter(post => post.applyingStatus === 1 && post.status === 1).length === 0 ? (
                                    <div className="text-center py-12 bg-slate-50/50 rounded-xl">
                                      <Send className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                                      <p className="text-slate-500">No active applications</p>
                                  </div>
                                  ) : (
                                    <>
                                      <div className="grid gap-4 p-4 pb-8" style={{
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))'
                                      }}>
                                        {filteredPosts
                                          .filter(post => post.applyingStatus === 1 && post.status === 1)
                                          .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                                          .map((post) => (
                                            <Card
                                              key={post.id}
                                              className={cn(
                                                "cursor-pointer transition-all duration-200 hover:shadow-md",
                                                selectedPost?.id === post.id && "ring-2 ring-[#de9151]"
                                              )}
                                              onClick={() => handlePostSelect(post)}
                                            >
                                              <CardContent className="p-4">
                                                <div className="flex items-start justify-between mb-3">
                                                  <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10">
                                                      <AvatarImage src={post.poster?.avatar} />
                                                      <AvatarFallback>
                                                        {post.poster?.firstName?.[0]}
                                                        {post.poster?.lastName?.[0]}
                                                      </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                      <h3 className="font-medium text-black">
                                                        {post.poster?.firstName} {post.poster?.lastName}
                                                      </h3>
                                                      <p className="text-sm text-slate-500">@{post.poster?.username}</p>
                                  </div>
                                </div>
                                                  <div className="flex flex-col gap-1 items-end">
                                                    {getStatusBadge(post.status)}
                                                    {getApplyingStatusBadge(post.applyingStatus)}
                              </div>
                                  </div>
                                                <h4 className="font-semibold text-black mb-2">{post.title}</h4>
                                                <p className="text-sm text-slate-600 line-clamp-2 mb-3">{post.description}</p>
                                                <div className="flex items-center gap-4 text-sm text-slate-500">
                                                  <div className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    <span>{formatDate(post.startTime)}</span>
                                                  </div>
                                                  <div className="flex items-center gap-1">
                                                    <Clock className="h-4 w-4" />
                                                    <span>{formatTime(post.startTime)}</span>
                                                  </div>
                                                  <div className="flex items-center gap-1.5 bg-[#de9151]/10 px-2 py-1 rounded-lg">
                                                    <Coins className="h-4 w-4 text-[#de9151]" />
                                                    <span className="text-[#de9151] font-semibold text-base">
                                                      {post.startPrice === post.endPrice
                                                        ? post.startPrice
                                                        : `${post.startPrice}-${post.endPrice}`}
                                                    </span>
                                                  </div>
                                                </div>
                                              </CardContent>
                                            </Card>
                                          ))}
                                      </div>
                                      {Math.ceil(filteredPosts.filter(post => post.applyingStatus === 1 && post.status === 1).length / pageSize) > 1 && (
                                        <div className="flex justify-center gap-2 mt-4">
                                  <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                  >
                                            Previous
                                  </Button>
                                          <div className="flex items-center gap-1">
                                            {Array.from({ length: Math.ceil(filteredPosts.filter(post => post.applyingStatus === 1 && post.status === 1).length / pageSize) }, (_, i) => (
                                              <Button
                                                key={i + 1}
                                                variant={currentPage === i + 1 ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setCurrentPage(i + 1)}
                                                className={cn(
                                                  "w-8 h-8 p-0",
                                                  currentPage === i + 1 && "bg-[#de9151] text-white hover:bg-[#de9151]/90"
                                                )}
                                              >
                                                {i + 1}
                                            </Button>
                                          ))}
                                </div>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredPosts.filter(post => post.applyingStatus === 1 && post.status === 1).length / pageSize), prev + 1))}
                                            disabled={currentPage === Math.ceil(filteredPosts.filter(post => post.applyingStatus === 1 && post.status === 1).length / pageSize)}
                                          >
                                            Next
                                          </Button>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </TabsContent>

                                <TabsContent value="accepted" className="mt-4">
                                  {filteredPosts.filter(post => post.applyingStatus === 4).length === 0 ? (
                                    <div className="text-center py-12 bg-slate-50/50 rounded-xl">
                                      <CheckCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                                      <p className="text-slate-500">No accepted applications</p>
                              </div>
                            ) : (
                                    <>
                                      <div className="grid gap-4 p-4 pb-8" style={{
                                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))'
                                }}>
                                        {filteredPosts
                                          .filter(post => post.applyingStatus === 4)
                                          .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                                          .map((post) => (
                                    <Card
                                      key={post.id}
                                      className={cn(
                                                "cursor-pointer transition-all duration-200 hover:shadow-md",
                                                selectedPost?.id === post.id && "ring-2 ring-[#de9151]"
                                      )}
                                      onClick={() => handlePostSelect(post)}
                                    >
                                      <CardContent className="p-4">
                                                <div className="flex items-start justify-between mb-3">
                                                  <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10">
                                                      <AvatarImage src={post.poster?.avatar} />
                                                      <AvatarFallback>
                                                        {post.poster?.firstName?.[0]}
                                                        {post.poster?.lastName?.[0]}
                                                  </AvatarFallback>
                                                </Avatar>
                                                    <div>
                                                      <h3 className="font-medium text-black">
                                                        {post.poster?.firstName} {post.poster?.lastName}
                                                      </h3>
                                                      <p className="text-sm text-slate-600">@{post.poster?.username}</p>
                                              </div>
                                          </div>
                                          <div className="flex flex-col gap-1 items-end">
                                            {getStatusBadge(post.status)}
                                            {getApplyingStatusBadge(post.applyingStatus)}
                                          </div>
                                        </div>
                                                <h4 className="font-semibold text-black mb-2">{post.title}</h4>
                                                <p className="text-sm text-slate-600 line-clamp-2 mb-3">{post.description}</p>
                                                <div className="flex items-center gap-4 text-sm text-slate-500">
                                                  <div className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    <span>{formatDate(post.startTime)}</span>
                                            </div>
                                                  <div className="flex items-center gap-1">
                                                    <Clock className="h-4 w-4" />
                                                    <span>{formatTime(post.startTime)}</span>
                                                  </div>
                                                  <div className="flex items-center gap-1.5 bg-[#de9151]/10 px-2 py-1 rounded-lg">
                                                    <Coins className="h-4 w-4 text-[#de9151]" />
                                                    <span className="text-[#de9151] font-semibold text-base">
                                                      {post.startPrice === post.endPrice
                                                        ? post.startPrice
                                                        : `${post.startPrice}-${post.endPrice}`}
                                                    </span>
                                                  </div>
                                                </div>
                                              </CardContent>
                                            </Card>
                                          ))}
                                      </div>
                                      {Math.ceil(filteredPosts.filter(post => post.applyingStatus === 4).length / pageSize) > 1 && (
                                        <div className="flex justify-center gap-2 mt-4">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                          >
                                            Previous
                                          </Button>
                                          <div className="flex items-center gap-1">
                                            {Array.from({ length: Math.ceil(filteredPosts.filter(post => post.applyingStatus === 4).length / pageSize) }, (_, i) => (
                                              <Button
                                                key={i + 1}
                                                variant={currentPage === i + 1 ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setCurrentPage(i + 1)}
                                                className={cn(
                                                  "w-8 h-8 p-0",
                                                  currentPage === i + 1 && "bg-[#de9151] text-white hover:bg-[#de9151]/90"
                                                )}
                                              >
                                                {i + 1}
                                            </Button>
                                          ))}
                                          </div>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredPosts.filter(post => post.applyingStatus === 4).length / pageSize), prev + 1))}
                                            disabled={currentPage === Math.ceil(filteredPosts.filter(post => post.applyingStatus === 4).length / pageSize)}
                                          >
                                            Next
                                          </Button>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </TabsContent>

                                <TabsContent value="canceled" className="mt-4">
                                  {filteredPosts.filter(post => (post.applyingStatus === 2 || post.applyingStatus === 3) || post.status === 2).length === 0 ? (
                                    <div className="text-center py-12 bg-slate-50/50 rounded-xl">
                                      <XCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                                      <p className="text-slate-500">No canceled applications</p>
                                            </div>
                                  ) : (
                                    <>
                                      <div className="grid gap-4 p-4 pb-8" style={{
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))'
                                      }}>
                                        {filteredPosts
                                          .filter(post => (post.applyingStatus === 2 || post.applyingStatus === 3) || post.status === 2)
                                          .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                                          .map((post) => (
                                            <Card
                                              key={post.id}
                                              className={cn(
                                                "cursor-pointer transition-all duration-200 hover:shadow-md",
                                                selectedPost?.id === post.id && "ring-2 ring-[#de9151]"
                                              )}
                                              onClick={() => handlePostSelect(post)}
                                            >
                                              <CardContent className="p-4">
                                                <div className="flex items-start justify-between mb-3">
                                                  <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10">
                                                      <AvatarImage src={post.poster?.avatar} />
                                                      <AvatarFallback>
                                                        {post.poster?.firstName?.[0]}
                                                        {post.poster?.lastName?.[0]}
                                                      </AvatarFallback>
                                                    </Avatar>
                                            <div>
                                                      <h3 className="font-medium text-black">
                                                        {post.poster?.firstName} {post.poster?.lastName}
                                                      </h3>
                                                      <p className="text-sm text-slate-500">@{post.poster?.username}</p>
                                            </div>
                                          </div>
                                                  <div className="flex flex-col gap-1 items-end">
                                                    {getStatusBadge(post.status)}
                                                    {getApplyingStatusBadge(post.applyingStatus)}
                                        </div>
                                          </div>
                                                <h4 className="font-semibold text-black mb-2">{post.title}</h4>
                                                <p className="text-sm text-slate-600 line-clamp-2 mb-3">{post.description}</p>
                                                <div className="flex items-center gap-4 text-sm text-slate-500">
                                                  <div className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    <span>{formatDate(post.startTime)}</span>
                                                  </div>
                                                  <div className="flex items-center gap-1">
                                                    <Clock className="h-4 w-4" />
                                                    <span>{formatTime(post.startTime)}</span>
                                                  </div>
                                                  <div className="flex items-center gap-1.5 bg-[#de9151]/10 px-2 py-1 rounded-lg">
                                                    <Coins className="h-4 w-4 text-[#de9151]" />
                                                    <span className="text-[#de9151] font-semibold text-base">
                                                      {post.startPrice === post.endPrice
                                                        ? post.startPrice
                                                        : `${post.startPrice}-${post.endPrice}`}
                                                    </span>
                                                  </div>
                                                </div>
                                              </CardContent>
                                            </Card>
                                          ))}
                                </div>
                                      {Math.ceil(filteredPosts.filter(post => (post.applyingStatus === 2 || post.applyingStatus === 3) || post.status === 2).length / pageSize) > 1 && (
                                        <div className="flex justify-center gap-2 mt-4">
                                    <Button
                                      variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                    >
                                            Previous
                                          </Button>
                                          <div className="flex items-center gap-1">
                                            {Array.from({ length: Math.ceil(filteredPosts.filter(post => (post.applyingStatus === 2 || post.applyingStatus === 3) || post.status === 2).length / pageSize) }, (_, i) => (
                                              <Button
                                                key={i + 1}
                                                variant={currentPage === i + 1 ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setCurrentPage(i + 1)}
                                                className={cn(
                                                  "w-8 h-8 p-0",
                                                  currentPage === i + 1 && "bg-[#de9151] text-white hover:bg-[#de9151]/90"
                                                )}
                                              >
                                                {i + 1}
                                    </Button>
                                            ))}
                                  </div>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredPosts.filter(post => (post.applyingStatus === 2 || post.applyingStatus === 3) || post.status === 2).length / pageSize), prev + 1))}
                                            disabled={currentPage === Math.ceil(filteredPosts.filter(post => (post.applyingStatus === 2 || post.applyingStatus === 3) || post.status === 2).length / pageSize)}
                                          >
                                            Next
                                          </Button>
                                  </div>
                                )}
                                    </>
                            )}
                                </TabsContent>
                              </Tabs>
                            </div>
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
                                  <div className="flex items-center gap-4 text-sm text-slate-600">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-4 w-4" />
                                      <span>Posted on {formatDate(selectedPost.createdAt)}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-[#de9151]/10 px-2 py-1 rounded-lg">
                                      <Coins className="h-4 w-4 text-[#de9151]" />
                                      <span className="text-[#de9151] font-semibold text-base">
                                        {selectedPost.startPrice === selectedPost.endPrice
                                          ? selectedPost.startPrice
                                          : `${selectedPost.startPrice}-${selectedPost.endPrice}`}
                                      </span>
                                    </div>
                                  </div>
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
                                        <div className="flex gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-slate-500 hover:bg-white/50 rounded-lg"
                                            onClick={() => handleMessage(selectedPost.poster?.id || "")}
                                          >
                                            <Send className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-slate-500 hover:bg-white/50 rounded-lg"
                                            onClick={() => handleViewProfile(selectedPost.poster?.id || "")}
                                        >
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                )}

                                {/* Description */}
                                {selectedPost.description && selectedPost.description.trim() !== "" && (
                                  <div className="space-y-3">
                                    <h4 className="font-bold text-black text-base">Description</h4>
                                    <div className="bg-gradient-to-r from-slate-50/80 to-slate-100/50 p-4 rounded-xl border border-slate-200">
                                      <p className="text-sm text-slate-700 leading-relaxed">{selectedPost.description}</p>
                                    </div>
                                  </div>
                                )}

                                {/* Application Details */}
                                <div className="space-y-4">
                                  <h4 className="font-bold text-black text-base">Apply for this Opportunity</h4>

                                  {selectedPost.applyingStatus === 4 ? (
                                    <Card className="border-[#de9151]/30 bg-gradient-to-r from-[#de9151]/8 to-[#de9151]/12 overflow-hidden">
                                      <CardContent className="p-4">
                                        <div className="flex items-center gap-3 mb-3">
                                          <CheckCircle className="h-5 w-5 text-[#de9151]" />
                                          <div>
                                            <p className="font-bold text-black text-base">Application Accepted</p>
                                            <p className="text-sm text-slate-600">Your application has been accepted. You can now create an appointment with the trainer.</p>
                                          </div>
                                        </div>
                                        <Button
                                          className="w-full bg-[#de9151] hover:bg-[#de9151]/90 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl h-11 font-semibold text-sm"
                                          onClick={() => setShowBookingForm(true)}
                                        >
                                          Create Appointment
                                        </Button>
                                      </CardContent>
                                    </Card>
                                  ) : selectedPost.applyingStatus === 0 ? (
                                    <Card className="border-slate-200 bg-gradient-to-r from-slate-50/80 to-slate-100/50 overflow-hidden">
                                      <CardContent className="p-4">
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
                                      </CardContent>
                                    </Card>
                                  ) : selectedPost.applyingStatus === 1 ? (
                                    <Card className="border-slate-200 bg-gradient-to-r from-slate-50/80 to-slate-100/50 overflow-hidden">
                                      <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                          <Send className="h-5 w-5 text-[#de9151]" />
                                          <div>
                                            <p className="font-bold text-black text-base">Application Submitted</p>
                                            <p className="text-sm text-slate-600">Your application is being reviewed by the trainer</p>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ) : selectedPost.applyingStatus === 2 ? (
                                    <Card className="border-slate-200 bg-gradient-to-r from-slate-50/80 to-slate-100/50 overflow-hidden">
                                      <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                          <XCircle className="h-5 w-5 text-red-500" />
                                          <div>
                                            <p className="font-bold text-black text-base">Application Canceled</p>
                                            <p className="text-sm text-slate-600">Your application has been canceled</p>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ) : selectedPost.applyingStatus === 3 ? (
                                    <Card className="border-slate-200 bg-gradient-to-r from-slate-50/80 to-slate-100/50 overflow-hidden">
                                      <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                          <XCircle className="h-5 w-5 text-red-500" />
                                          <div>
                                            <p className="font-bold text-black text-base">Application Rejected</p>
                                            <p className="text-sm text-slate-600">Your application has been rejected</p>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
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
            </>
          )}
        </div>
      </div>

      {showBookingForm && selectedPost && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          style={{
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div 
            className="bg-white rounded-2xl p-6 w-[60vh] max-h-[98vh] overflow-y-auto shadow-2xl border border-slate-100"
            style={{
              animation: 'popIn 0.2s ease-out'
            }}
          >
            <style>
              {`
                @keyframes fadeIn {
                  from { opacity: 0; }
                  to { opacity: 1; }
                }
                @keyframes popIn {
                  from { 
                    opacity: 0;
                    transform: scale(0.95);
                  }
                  to { 
                    opacity: 1;
                    transform: scale(1);
                  }
                }
              `}
            </style>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-black to-[#de9151] bg-clip-text text-transparent">Create Appointment</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowBookingForm(false)}
                className="h-8 w-8 hover:bg-slate-100 rounded-xl transition-all duration-200 hover:scale-110"
                disabled={isBooking}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {bookingMessage && bookingMessage.text && (
                <div 
                  className={`p-2 rounded-lg text-sm font-medium ${bookingMessage.success ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}
                >
                  {bookingMessage.text}
                </div>
              )}

              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-slate-50/80 to-slate-100/50 rounded-xl border border-slate-200">
                <img
                  src={selectedPost?.poster?.avatar}
                  alt={`${selectedPost?.poster?.firstName || ''} ${selectedPost?.poster?.lastName || ''}`}
                  className="w-10 h-10 rounded-lg ring-2 ring-white shadow-sm"
                />
                <div className="flex-1">
                  <p className="font-semibold text-black">{selectedPost?.poster?.firstName || ''} {selectedPost?.poster?.lastName || ''}</p>
                  <p className="text-sm text-slate-500">@{selectedPost?.poster?.username || ''}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <span className="text-sm font-medium text-[#de9151]">{selectedPost?.startPrice || 0}</span>
                    <Coins className="h-4 w-4 text-[#de9151]" />
                  </div>
                  <p className="text-xs text-slate-500">per session</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium text-slate-700 mb-1 block">Appointment Name</Label>
                  <Input 
                    value={appointmentName || `Appointment with ${selectedPost?.poster?.firstName || ''} ${selectedPost?.poster?.lastName || ''}`}
                    onChange={(e) => setAppointmentName(e.target.value)}
                    disabled={isBooking}
                    className="h-9 bg-slate-50/50 border-slate-200 rounded-lg focus:ring-2 focus:ring-[#de9151]/20 focus:border-[#de9151] transition-all duration-200"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-700 mb-1 block">Repeating Type</Label>
                  <Input 
                    value="Once"
                    disabled={true}
                    className="h-9 bg-slate-50/50 border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium text-slate-700 mb-1 block">Description</Label>
                <Textarea 
                  placeholder="Enter appointment description" 
                  disabled={isBooking}
                  className="min-h-[80px] bg-slate-50/50 border-slate-200 rounded-lg focus:ring-2 focus:ring-[#de9151]/20 focus:border-[#de9151] transition-all duration-200 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium text-slate-700 mb-1 block">Start Time</Label>
                  <Input 
                    value={formatLocalTime(selectedPost?.startTime || '')}
                    disabled={true}
                    className="h-9 bg-slate-50/50 border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-700 mb-1 block">End Time</Label>
                  <Input 
                    value={formatLocalTime(selectedPost?.endTime || '')}
                    disabled={true}
                    className="h-9 bg-slate-50/50 border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              {selectedPost?.placeName && (
                <div className="rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                  <iframe
                    title="Map overview"
                    width="100%"
                    height="140"
                    style={{ border: 0 }}
                    src={`https://maps.google.com/maps?q=${selectedPost?.lat},${selectedPost?.lng}&z=15&output=embed`}
                    allowFullScreen
                  ></iframe>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowBookingForm(false)}
                  disabled={isBooking}
                  className="h-9 px-4 rounded-lg border-slate-200 hover:bg-slate-50 transition-all duration-200 hover:scale-105"
                >
                  Cancel
                </Button>
                <Button 
                  className="bg-gradient-to-r from-[#de9151] to-[#de9151]/90 hover:from-[#de9151]/90 hover:to-[#de9151]/80 text-white h-9 px-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105" 
                  onClick={handleCreateAppointment} 
                  disabled={isBooking}
                >
                  {isBooking ? (
                    <div className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                      Creating...
                    </div>
                  ) : (
                    'Create Appointment'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Dialog */}
      {showSuccessDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17L4 12" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Appointment Created Successfully!</h3>
              <p className="text-gray-600 mb-6">Would you like to go to the appointments page?</p>
              <div className="flex justify-center gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowSuccessDialog(false)}
                  className="hover:bg-gray-50"
                >
                  Stay Here
                </Button>
                <Button 
                  className="bg-[#de9151] hover:bg-[#de9151]/90 text-white" 
                  onClick={() => {
                    setShowSuccessDialog(false)
                    navigate('/appointments')
                  }}
                >
                  Go to Appointments
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
