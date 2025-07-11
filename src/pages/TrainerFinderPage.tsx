"use client"

import { useState, useEffect } from "react"
import {
  Search,
  Filter,
  Calendar,
  DollarSign,
  MapPin,
  Clock,
  User,
  ChevronRight,
  Plus,
  FileText,
  EyeOff,
  UserCog,
  Coins,
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
import { useFinderStore } from "@/store/FinderStore"
import { GeoStore } from "@/store/GeoStore"
import axios from "axios"
import { toast } from "react-toastify"
import { useNavigate, useParams } from "react-router-dom"
import { useConversationStore } from "@/store/ConversationStore"

// Helper function to get local datetime string for datetime-local input, 1 hour from now
const getDateTimeLocalStringOneHourFromNow = () => {
  const now = new Date();
  now.setHours(now.getHours() + 1);
  // Format to YYYY-MM-DDTHH:mm for datetime-local input
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

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
  notiCount: number
}

export default function TrainerFinderPage() {
  const navigate = useNavigate()
  const { postId } = useParams()
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([])
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [statusTab, setStatusTab] = useState<"open" | "matched" | "closed">("open")
  const [sortBy, setSortBy] = useState<string>("newest")
  const [applicantTab, setApplicantTab] = useState<string>("applying")
  const isMobile = useMediaQuery("(max-width: 1023px)")
  const [showMobileDetail, setShowMobileDetail] = useState(false)
  const [sidebarShow, setSidebarShow] = useState(true)
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize] = useState(10)
  const { posts: finderPosts, isLoading, fetchFinders, applicants, isLoadingApplicants, fetchApplicants, respondToApplicant, totalCount } = useFinderStore()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [form, setForm] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    priceType: "single", // 'single' or 'range'
    startPrice: "",
    endPrice: "",
    locationSearch: "",
    locationId: "",
    hideAddress: false,
    isAnonymous: false,
  })
  const [formErrors, setFormErrors] = useState<{
    title?: string;
    description?: string;
    startTime?: string;
    endTime?: string;
    startPrice?: string;
    endPrice?: string;
    locationId?: string;
  }>({})
  type LocationResult = { description: string; placeId: string }
  const [locationResults, setLocationResults] = useState<LocationResult[]>([])
  const [locationLoading, setLocationLoading] = useState(false)
  const geoStore = GeoStore()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {})
  const [confirmMessage, setConfirmMessage] = useState("")
  const [locationSearchTimeout, setLocationSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const [respondingId, setRespondingId] = useState<number | null>(null)
  const { getConversationIdByUserId } = useConversationStore()

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

  useEffect(() => {
    fetchFinders({
      status: statusTab === "open" ? "1" : statusTab === "matched" ? "3" : "2",
      search: searchQuery,
      pageNumber,
      pageSize,
    })
  }, [statusTab, searchQuery, pageNumber, pageSize])

  useEffect(() => {
    // Apply filters and search
    let result = [...finderPosts]

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (post) => post.title.toLowerCase().includes(query) || post.description.toLowerCase().includes(query),
      )
    }

    // Apply status tab filter
    if (statusTab === "open") {
      result = result.filter((post) => post.status === 0 || post.status === 1)
    } else if (statusTab === "matched") {
      result = result.filter((post) => post.status === 3)
    } else {
      result = result.filter((post) => post.status === 2)
    }

    // Apply sorting
    if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } else if (sortBy === "oldest") {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
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
  }, [finderPosts, searchQuery, sortBy, statusTab])

  useEffect(() => {
    if (showCreateForm) {
      const start = getDateTimeLocalStringOneHourFromNow();
      const startDateObj = new Date(start);
      const endDateObj = new Date(startDateObj.getTime() + 60 * 60 * 1000);
      
      const pad = (n: number): string => n.toString().padStart(2, '0');
      
      const year = endDateObj.getFullYear();
      const month = pad(endDateObj.getMonth() + 1);
      const day = pad(endDateObj.getDate());
      const hours = pad(endDateObj.getHours());
      const minutes = pad(endDateObj.getMinutes());
      
      const end = `${year}-${month}-${day}T${hours}:${minutes}`;
      
      setForm((f) => ({ ...f, startTime: start, endTime: end }));
    }
  }, [showCreateForm]);

  useEffect(() => {
    if (!form.locationSearch) {
      setLocationResults([])
      return
    }

    // Clear any existing timeout
    if (locationSearchTimeout) {
      clearTimeout(locationSearchTimeout)
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      setLocationLoading(true)
      geoStore.searchLocations(form.locationSearch).then((res) => {
        setLocationResults(res)
        setLocationLoading(false)
      })
    }, 500) // 500ms debounce

    setLocationSearchTimeout(timeout)

    // Cleanup
    return () => {
      if (timeout) {
        clearTimeout(timeout)
      }
    }
  }, [form.locationSearch, geoStore])

  useEffect(() => {
    if (postId && finderPosts.length > 0) {
      const post = finderPosts.find(p => p.id === postId)
      if (post) {
        setSelectedPost(post)
        if (isMobile) {
          setShowMobileDetail(true)
        }
      }
    }
  }, [postId, finderPosts, isMobile])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  }

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-md font-normal">Draft</Badge>
      case 1:
        return (
          <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-md font-normal">Open</Badge>
        )
      case 2:
        return (
          <Badge className="bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-md font-normal">Completed</Badge>
        )
      case 3:
        return <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md font-normal">Matched</Badge>
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
    navigate(`/trainer-finder/${post.id}`)
    fetchApplicants(post.id)
    if (isMobile) {
      setShowMobileDetail(true)
    }
    // Clear notification count for this post
    setFilteredPosts(prev => prev.map(p => 
      p.id === post.id ? { ...p, notiCount: 0 } : p
    ))
  }

  const handleBackToList = () => {
    setShowMobileDetail(false)
    navigate('/trainer-finder')
  }

  const handleCreate = async () => {
    // Validate form
    const errors: typeof formErrors = {}
    if (!form.title.trim()) errors.title = "Title is required"
    if (!form.startTime) errors.startTime = "Start time is required"
    if (!form.endTime) errors.endTime = "End time is required"
    if (!form.locationId) errors.locationId = "Location is required"
    if (!form.startPrice) errors.startPrice = "Start price is required"
    if (form.priceType === "range" && !form.endPrice) errors.endPrice = "End price is required"
    if (form.priceType === "range" && Number(form.startPrice) >= Number(form.endPrice)) {
      errors.endPrice = "End price must be greater than start price"
    }

    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return

    setCreateLoading(true)
    try {
      const payload = {
        title: form.title,
        description: form.description,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        startPrice: Number(form.startPrice),
        endPrice: form.priceType === "single" ? Number(form.startPrice) : Number(form.endPrice),
        locationId: form.locationId,
        hideAddress: form.hideAddress,
        repeatType: 0,
        isAnonymous: form.isAnonymous,
      }
      await axios.post(`${import.meta.env.VITE_API_URL}/api/Finder/postFinder`, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      toast.success("Post created successfully!")
      setShowCreateForm(false)
      setForm({
        title: "",
        description: "",
        startTime: "",
        endTime: "",
        priceType: "single",
        startPrice: "",
        endPrice: "",
        locationSearch: "",
        locationId: "",
        hideAddress: false,
        isAnonymous: false,
      })
      fetchFinders({ status: statusTab === "open" ? "1" : statusTab === "matched" ? "3" : "2", search: searchQuery, pageNumber, pageSize })
    } catch (e: unknown) {
      if (
        e &&
        typeof e === "object" &&
        "response" in e &&
        e.response &&
        typeof e.response === "object" &&
        "data" in e.response &&
        e.response.data &&
        typeof e.response.data === "object" &&
        "message" in e.response.data &&
        typeof (e.response.data as { message?: string }).message === "string"
      ) {
        toast.error((e.response.data as { message?: string }).message || "Failed to create post")
      } else {
        toast.error("Failed to create post")
      }
    } finally {
      setCreateLoading(false)
    }
  }

  const handleCancelCreate = () => {
    // Check if form has data
    const hasFormData = form.title || form.description || form.locationSearch

    if (hasFormData) {
      setConfirmMessage("You have unsaved changes. Are you sure you want to cancel?")
      setConfirmAction(() => () => {
        setShowCreateForm(false)
        setForm({
          title: "",
          description: "",
          startTime: "",
          endTime: "",
          priceType: "single",
          startPrice: "",
          endPrice: "",
          locationSearch: "",
          locationId: "",
          hideAddress: false,
          isAnonymous: false,
        })
        setShowConfirmDialog(false)
      })
      setShowConfirmDialog(true)
    } else {
      setShowCreateForm(false)
    }
  }

  const handlePostSelectWithCheck = (post: Post) => {
    if (showCreateForm) {
      const hasFormData = form.title || form.description || form.locationSearch

      if (hasFormData) {
        setConfirmMessage("You have unsaved changes. Are you sure you want to view this post?")
        setConfirmAction(() => () => {
          setShowCreateForm(false)
          setSelectedPost(post)
          navigate(`/trainer-finder/${post.id}`)
          if (isMobile) {
            setShowMobileDetail(true)
          }
          setShowConfirmDialog(false)
        })
        setShowConfirmDialog(true)
      } else {
        setShowCreateForm(false)
        setSelectedPost(post)
        navigate(`/trainer-finder/${post.id}`)
        if (isMobile) {
          setShowMobileDetail(true)
        }
      }
    } else {
      handlePostSelect(post)
    }
  }

  const handleViewProfile = (userId: string) => {
    window.open(`/profile/${userId}`, '_blank')
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

  const handleAcceptApplicant = async (applicantId: number, postId: string) => {
    setRespondingId(applicantId)
    const ok = await respondToApplicant(applicantId, 1, postId)
    setRespondingId(null)
    if (ok) {
      toast.success("Applicant accepted")
      // Update local state to move post from open to matched
      setFilteredPosts(prev => prev.map(post => 
        post.id === postId ? { ...post, status: 3 } : post
      ))
      // If we're in open tab, remove the post
      if (statusTab === "open") {
        setFilteredPosts(prev => prev.filter(post => post.id !== postId))
      }
    } else {
      toast.error("Failed to accept applicant")
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPageNumber(newPage)
    }
  }

  return (
    <div className="relative bg-[#f9fafb] h-[calc(100vh-3.8rem)] overflow-hidden">
      <div className="relative h-full">
        <AppLeftSidebar />
        <div
          className={`h-full pt-4 pb-4 px-4 transition-all duration-300 ${
            sidebarShow ? "lg:pl-72" : "lg:pl-24 lg:ml-4"
          }`}
        >
          <div className="flex flex-col lg:flex-row gap-4 h-full">
            {/* Left Side - Post List */}
            {(!isMobile || !showMobileDetail) && (
              <div className="w-full lg:w-1/3 flex-shrink-0 flex flex-col h-full">
                <div className="bg-white rounded-xl flex flex-col h-full p-4 shadow-lg border border-gray-200 h-full">
                  <div className="flex items-center mb-4">
                    <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">Your posts</h1>
                    <Button
                      className="bg-white text-[#DE9151] hover:bg-gray-50 border border-[#DE9151] shadow-none ml-auto"
                      onClick={() => {
                        setShowCreateForm(true)
                        setSelectedPost(null)
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      New Post
                    </Button>
                  </div>

                  <div className="relative mb-2 flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search posts..."
                        className="pl-10 bg-white/90 border-gray-200/80 rounded-md focus-visible:ring-[#4A6FA5]/20 focus-visible:ring-offset-0"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") setSearchQuery(searchInput)
                        }}
                      />
                    </div>
                    <Button
                      className="ml-2 px-3 py-1 bg-[#DE9151] text-white rounded-md hover:bg-[#DE9151]/90 transition-colors"
                      onClick={() => setSearchQuery(searchInput)}
                    >
                      Search
                    </Button>
                  </div>

                  <div className="flex items-center w-full mb-2">
                    <Tabs value={statusTab} onValueChange={(v) => setStatusTab(v as "open" | "matched" | "closed")} className="">
                      <TabsList className="bg-gray-50/70 p-1 rounded-full flex">
                        <TabsTrigger
                          value="open"
                          className={cn(
                            "rounded-full w-20 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm",
                            statusTab === "open" &&
                              "data-[state=active]:bg-green-100 data-[state=active]:text-green-700",
                          )}
                        >
                          Open
                        </TabsTrigger>
                        <TabsTrigger
                          value="matched"
                          className={cn(
                            "rounded-full w-20 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm",
                            statusTab === "matched" &&
                              "data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700",
                          )}
                        >
                          Matched
                        </TabsTrigger>
                        <TabsTrigger
                          value="closed"
                          className={cn(
                            "rounded-full w-20 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm",
                            statusTab === "closed" &&
                              "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700",
                          )}
                        >
                          Closed
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                    <div className="ml-auto">
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="bg-white/90 border-gray-200/80 rounded-md focus:ring-[#4A6FA5]/20 focus:ring-offset-0">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg">
                          <SelectItem value="newest">Newest First</SelectItem>
                          <SelectItem value="oldest">Oldest First</SelectItem>
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
                          <p className="text-gray-500">No posts match your filters</p>
                          <Button
                            variant="link"
                            className="text-[#DE9151] mt-2"
                            onClick={() => {
                              setSearchInput("")
                              setSearchQuery("")
                              setStatusTab("open")
                              setSortBy("newest")
                            }}
                          >
                            Clear filters
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-gray-500">
                          {filteredPosts.length} of {totalCount} posts
                        </p>
                        {totalPages > 1 && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange(pageNumber - 1)}
                              disabled={pageNumber === 1}
                              className="h-8 px-3"
                            >
                              Previous
                            </Button>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageIndex
                                if (totalPages <= 5) {
                                  pageIndex = i + 1
                                } else if (pageNumber <= 3) {
                                  pageIndex = i + 1
                                } else if (pageNumber >= totalPages - 2) {
                                  pageIndex = totalPages - 4 + i
                                } else {
                                  pageIndex = pageNumber - 2 + i
                                }

                                return (
                                  <Button
                                    key={pageIndex}
                                    variant={pageNumber === pageIndex ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handlePageChange(pageIndex)}
                                    className={`h-8 w-8 p-0 ${
                                      pageNumber === pageIndex
                                        ? "bg-[#DE9151] text-white hover:bg-[#DE9151]/90"
                                        : "hover:bg-gray-50"
                                    }`}
                                  >
                                    {pageIndex}
                                  </Button>
                                )
                              })}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange(pageNumber + 1)}
                              disabled={pageNumber === totalPages}
                              className="h-8 px-3"
                            >
                              Next
                            </Button>
                          </div>
                        )}
                      </div>
                      <ScrollArea className="flex-1 -mx-4 px-4">
                        <div className="space-y-4 pr-2">
                          {filteredPosts.map((post) => (
                            <div
                              key={post.id}
                              className={`p-5 rounded-xl cursor-pointer transition-all ${
                                selectedPost?.id === post.id
                                  ? "bg-gradient-to-r from-[#DE9151]/5 to-[#DE9151]/10 border-l-2 border-[#DE9151]"
                                  : post.notiCount === 0
                                  ? "bg-gray-50/80 hover:bg-gray-100/80 border border-gray-100/80"
                                  : "bg-white hover:bg-gray-50 border border-transparent hover:border-gray-100"
                              }`}
                              onClick={() => handlePostSelectWithCheck(post)}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h3 className={`font-medium line-clamp-1 ${
                                  post.notiCount === 0 ? "text-gray-600" : "text-gray-900"
                                }`}>{post.title}</h3>
                                <div className="flex items-center gap-2">
                                  {post.notiCount > 0 && (
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                                      {post.notiCount}
                                    </span>
                                  )}
                                  {getStatusBadge(post.status)}
                                </div>
                              </div>
                              <p className={`text-sm line-clamp-2 mb-3 ${
                                post.notiCount === 0 ? "text-gray-400" : "text-gray-500"
                              }`}>{post.description}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                <Clock className={`h-3 w-3 mr-1 ${post.notiCount === 0 ? "text-gray-400" : "text-[#DE9151]"}`} />
                                <span className={post.notiCount === 0 ? "text-gray-400" : ""}>
                                  {(() => {
                                    const startDate = new Date(post.startTime);
                                    const endDate = new Date(post.endTime);
                                    const isSameDay = startDate.toDateString() === endDate.toDateString();
                                    
                                    if (isSameDay) {
                                      return `${formatTime(post.startTime)} - ${formatTime(post.endTime)}`;
                                    } else {
                                      return `${formatDate(post.startTime)} ${formatTime(post.startTime)} - ${formatDate(post.endTime)} ${formatTime(post.endTime)}`;
                                    }
                                  })()}
                                </span>
                                <span className="mx-2">|</span>
                                <DollarSign className={`h-3 w-3 mr-1 ${post.notiCount === 0 ? "text-gray-400" : "text-[#DE9151]"}`} />
                                <span className={post.notiCount === 0 ? "text-gray-400" : ""}>
                                  {post.startPrice === post.endPrice
                                    ? `${post.startPrice}`
                                    : `${post.startPrice} - ${post.endPrice}`}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-xs text-gray-400">
                                <div className="flex items-center gap-1">
                                  <Calendar className={`h-3 w-3 ${post.notiCount === 0 ? "text-gray-300" : ""}`} />
                                  <span className={post.notiCount === 0 ? "text-gray-300" : ""}>{formatDate(post.startTime)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <User className={`h-3 w-3 ${post.notiCount === 0 ? "text-gray-300" : ""}`} />
                                  <span className={post.notiCount === 0 ? "text-gray-300" : ""}>
                                    {applicants.filter(a => a.postId === post.id).length} applicant{applicants.filter(a => a.postId === post.id).length !== 1 ? "s" : ""}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Right Side - Post Details and Applicants */}
            {(!isMobile || showMobileDetail) &&
              (showCreateForm ? (
                <div className="flex-1 flex flex-col h-full">
                  <div className="bg-white/90 rounded-xl flex flex-col h-full p-4 shadow-md border border-gray-200/80 h-full">
                    {isMobile && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="self-start mb-4 -ml-2"
                        onClick={() => setShowCreateForm(false)}
                      >
                        <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
                        Back to posts
                      </Button>
                    )}
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-2xl font-semibold text-gray-800 tracking-tight">Create New Post</h2>
                          <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-md font-normal">
                            Draft
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">Fill in the details below to create your post</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                        onClick={handleCancelCreate}
                      >
                        Cancel
                      </Button>
                    </div>

                    <ScrollArea className="flex-1 -mx-6 px-6">
                      <div className="space-y-8 pr-2">
                        <div>
                          <h3 className="text-lg font-medium text-gray-800 mb-3">Basic Information</h3>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                              <Input
                                className={cn("w-full", formErrors.title && "border-red-500 focus:ring-red-500")}
                                value={form.title}
                                onChange={(e) => {
                                  setForm((f) => ({ ...f, title: e.target.value }))
                                  if (formErrors.title) {
                                    setFormErrors(prev => ({ ...prev, title: undefined }))
                                  }
                                }}
                                placeholder="Enter a descriptive title for your post"
                              />
                              {formErrors.title && <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                              <textarea
                                className={cn("w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-[#4A6FA5] focus:border-transparent", formErrors.description && "border-red-500 focus:ring-red-500")}
                                rows={4}
                                value={form.description}
                                onChange={(e) => {
                                  setForm((f) => ({ ...f, description: e.target.value }))
                                  if (formErrors.description) {
                                    setFormErrors(prev => ({ ...prev, description: undefined }))
                                  }
                                }}
                                placeholder="Describe your needs in detail..."
                              />
                              {formErrors.description && <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-md bg-gradient-to-br from-[#DE9151]/5 to-[#4A6FA5]/10 flex items-center justify-center flex-shrink-0">
                              <Clock className="h-5 w-5 text-[#DE9151]" />
                            </div>
                            <div className="w-full">
                              <p className="font-medium text-gray-800 mb-2">Session Time</p>
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Start Time</label>
                                  <Input
                                    type="datetime-local"
                                    className={cn("w-full", formErrors.startTime && "border-red-500 focus:ring-red-500")}
                                    value={form.startTime}
                                    min={getDateTimeLocalStringOneHourFromNow()}
                                    onChange={(e) => {
                                      setForm((f) => ({
                                        ...f,
                                        startTime: e.target.value,
                                        endTime: f.endTime < e.target.value ? e.target.value : f.endTime,
                                      }))
                                      if (formErrors.startTime) {
                                        setFormErrors(prev => ({ ...prev, startTime: undefined }))
                                      }
                                    }}
                                  />
                                  {formErrors.startTime && <p className="text-red-500 text-xs mt-1">{formErrors.startTime}</p>}
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">End Time</label>
                                  <Input
                                    type="datetime-local"
                                    className={cn("w-full", formErrors.endTime && "border-red-500 focus:ring-red-500")}
                                    value={form.endTime}
                                    min={form.startTime}
                                    onChange={(e) => {
                                      setForm((f) => ({ ...f, endTime: e.target.value }))
                                      if (formErrors.endTime) {
                                        setFormErrors(prev => ({ ...prev, endTime: undefined }))
                                      }
                                    }}
                                  />
                                  {formErrors.endTime && <p className="text-red-500 text-xs mt-1">{formErrors.endTime}</p>}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-md bg-gradient-to-br from-[#DE9151]/5 to-[#4A6FA5]/10 flex items-center justify-center flex-shrink-0">
                              <Coins className="h-5 w-5 text-[#DE9151]" />
                            </div>
                            <div className="w-full">
                              <p className="font-medium text-gray-800 mb-2">Price Range</p>
                              <div className="space-y-3">
                                <div className="flex items-center gap-4">
                                  <label className="flex items-center gap-1 text-sm">
                                    <input
                                      type="radio"
                                      className="text-[#DE9151] focus:ring-[#4A6FA5]"
                                      checked={form.priceType === "single"}
                                      onChange={() =>
                                        setForm((f) => ({ ...f, priceType: "single", endPrice: f.startPrice }))
                                      }
                                    />
                                    Single Price
                                  </label>
                                  <label className="flex items-center gap-1 text-sm">
                                    <input
                                      type="radio"
                                      className="text-[#DE9151] focus:ring-[#4A6FA5]"
                                      checked={form.priceType === "range"}
                                      onChange={() => setForm((f) => ({ ...f, priceType: "range", endPrice: "" }))}
                                    />
                                    Price Range
                                  </label>
                                </div>
                                <div className="flex gap-3 items-center">
                                  <div>
                                    <label className="block text-xs text-gray-500 mb-1">Start Price</label>
                                    <div className="relative">
                                      <Input
                                        type="number"
                                        className={cn("w-full pl-8", formErrors.startPrice && "border-red-500 focus:ring-red-500")}
                                        placeholder="0"
                                        value={form.startPrice}
                                        min={0}
                                        onChange={(e) => {
                                          setForm((f) => ({
                                            ...f,
                                            startPrice: e.target.value,
                                            ...(f.priceType === "single" ? { endPrice: e.target.value } : {}),
                                          }))
                                          if (formErrors.startPrice) {
                                            setFormErrors(prev => ({ ...prev, startPrice: undefined }))
                                          }
                                        }}
                                      />
                                      <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#DE9151]" />
                                    </div>
                                    {formErrors.startPrice && <p className="text-red-500 text-xs mt-1">{formErrors.startPrice}</p>}
                                  </div>
                                  {form.priceType === "range" && (
                                    <div>
                                      <label className="block text-xs text-gray-500 mb-1">End Price ($)</label>
                                      <div className="relative">
                                        <Input
                                          type="number"
                                          className={cn("w-full pl-8", formErrors.endPrice && "border-red-500 focus:ring-red-500")}
                                          placeholder="0"
                                          value={form.endPrice}
                                          min={Number(form.startPrice) + 1}
                                          onChange={(e) => {
                                            setForm((f) => ({ ...f, endPrice: e.target.value }))
                                            if (formErrors.endPrice) {
                                              setFormErrors(prev => ({ ...prev, endPrice: undefined }))
                                            }
                                          }}
                                        />
                                        <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#DE9151]" />
                                      </div>
                                      {formErrors.endPrice && <p className="text-red-500 text-xs mt-1">{formErrors.endPrice}</p>}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-md bg-gradient-to-br from-[#DE9151]/5 to-[#4A6FA5]/10 flex items-center justify-center flex-shrink-0">
                              <MapPin className="h-5 w-5 text-[#DE9151]" />
                            </div>
                            <div className="w-full">
                              <p className="font-medium text-gray-800 mb-2">Location</p>
                              <div className="space-y-3">
                                <div className="relative">
                                  <Input
                                    className={cn("w-full", formErrors.locationId && "border-red-500 focus:ring-red-500")}
                                    placeholder="Search for a location..."
                                    value={form.locationId ? form.locationSearch : form.locationSearch}
                                    onChange={(e) => {
                                      setForm((f) => ({ 
                                        ...f, 
                                        locationSearch: e.target.value,
                                        locationId: "" // Clear selected location when searching
                                      }))
                                      if (formErrors.locationId) {
                                        setFormErrors(prev => ({ ...prev, locationId: undefined }))
                                      }
                                    }}
                                  />
                                  {locationLoading && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-xs text-gray-400">
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-[#DE9151]"></div>
                                      <span>Searching...</span>
                                    </div>
                                  )}
                                  {locationResults.length > 0 && !form.locationId && (
                                    <div className="absolute z-50 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-48 overflow-y-auto">
                                      {locationResults.map((loc) => (
                                        <div
                                          key={loc.placeId}
                                          className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700"
                                          onClick={() => {
                                            setForm((f) => ({
                                              ...f,
                                              locationId: loc.placeId,
                                              locationSearch: loc.description,
                                            }))
                                            setLocationResults([])
                                          }}
                                        >
                                          {loc.description}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                  <label className="flex items-center gap-2 text-sm">
                                    <input
                                      type="checkbox"
                                      className="rounded text-[#DE9151] focus:ring-[#4A6FA5]"
                                      checked={form.hideAddress}
                                      onChange={(e) => setForm((f) => ({ ...f, hideAddress: e.target.checked }))}
                                    />
                                    <span className="flex items-center gap-1">
                                      <EyeOff className="w-3 h-3 text-gray-400" />
                                      Hide exact address from applicants
                                    </span>
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-md bg-gradient-to-br from-[#DE9151]/5 to-[#4A6FA5]/10 flex items-center justify-center flex-shrink-0">
                              <UserCog className="h-5 w-5 text-[#DE9151]" />
                            </div>
                            <div className="w-full">
                              <p className="font-medium text-gray-800 mb-2">Privacy Settings</p>
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <label className="flex items-center gap-2 text-sm">
                                    <input
                                      type="checkbox"
                                      className="rounded text-[#DE9151] focus:ring-[#4A6FA5]"
                                      checked={form.isAnonymous}
                                      onChange={(e) => setForm((f) => ({ ...f, isAnonymous: e.target.checked }))}
                                    />
                                    <span className="flex items-center gap-1">
                                      <UserCog className="w-3 h-3 text-gray-400" />
                                      Post anonymously
                                    </span>
                                  </label>
                                </div>
                                <p className="text-xs text-gray-500">
                                  When posting anonymously, your profile information will be hidden from applicants
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-md bg-gradient-to-br from-[#DE9151]/5 to-[#4A6FA5]/10 flex items-center justify-center flex-shrink-0">
                              <Calendar className="h-5 w-5 text-[#DE9151]" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 mb-2">Frequency</p>
                              <p className="text-gray-500 text-sm">One-time session</p>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4">
                          <Button
                            className="bg-[#DE9151] hover:bg-[#DE9151]/90 text-white rounded-full shadow-sm px-4 py-2"
                            onClick={handleCreate}
                            disabled={createLoading}
                          >
                            {createLoading ? (
                              <span className="flex items-center gap-2">
                                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                Creating...
                              </span>
                            ) : (
                              <span className="flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                Create Post
                              </span>
                            )}
                          </Button>
                        </div>
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              ) : (
                selectedPost && (
                  <div className="flex-1 flex flex-col h-full">
                    <div className="bg-white/90 rounded-xl flex flex-col h-full p-4 shadow-md border border-gray-200/80 h-full">
                      {isMobile && (
                        <Button variant="ghost" size="sm" className="self-start mb-4 -ml-2" onClick={handleBackToList}>
                          <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
                          Back to posts
                        </Button>
                      )}

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
                              <p className="text-sm text-gray-400 mt-1">
                                Posted on {formatDate(selectedPost.createdAt)}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                              >
                                Edit
                              </Button>
                              {selectedPost.status === 1 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  Cancel
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Post Description */}
                          <div>
                            <h3 className="text-lg font-medium text-gray-800 mb-2">Description</h3>
                            <p className="text-gray-600 leading-relaxed">{selectedPost.description}</p>
                          </div>

                          {/* Post Details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-md bg-gradient-to-br from-[#DE9151]/5 to-[#4A6FA5]/10 flex items-center justify-center flex-shrink-0">
                                <Clock className="h-5 w-5 text-[#DE9151]" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">Session Time</p>
                                <p className="text-gray-500 mt-1">
                                  {(() => {
                                    const startDate = new Date(selectedPost.startTime);
                                    const endDate = new Date(selectedPost.endTime);
                                    const isSameDay = startDate.toDateString() === endDate.toDateString();
                                    
                                    if (isSameDay) {
                                      return `${formatTime(selectedPost.startTime)} - ${formatTime(selectedPost.endTime)}`;
                                    } else {
                                      return `${formatDate(selectedPost.startTime)} ${formatTime(selectedPost.startTime)} - ${formatDate(selectedPost.endTime)} ${formatTime(selectedPost.endTime)}`;
                                    }
                                  })()}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-md bg-gradient-to-br from-[#DE9151]/5 to-[#4A6FA5]/10 flex items-center justify-center flex-shrink-0">
                                <Coins className="h-5 w-5 text-[#DE9151]" />
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
                                  {selectedPost.hideAddress ? "Address hidden" : "Address visible to applicants"}
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

                          {/* Applicants Section */}
                          <div>
                            <h3 className="text-lg font-medium text-gray-800 mb-5">Applicants</h3>

                            {isLoadingApplicants ? (
                              <div className="flex justify-center items-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#DE9151]"></div>
                              </div>
                            ) : applicants.length === 0 ? (
                              <div className="text-center py-12 bg-gray-50/50 rounded-xl">
                                <User className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">No applicants yet</p>
                              </div>
                            ) : (
                              <Tabs
                                defaultValue={selectedPost.status === 2 || selectedPost.status === 3 ? "accepted" : "applying"}
                                value={applicantTab}
                                onValueChange={setApplicantTab}
                                className="w-full"
                              >
                                <TabsList className="w-full bg-gray-50/70 p-1 rounded-md mb-6">
                                  {!(selectedPost.status === 2 || selectedPost.status === 3) && (
                                    <TabsTrigger
                                      value="applying"
                                      className="rounded-md data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
                                    >
                                      Applying ({applicants.filter((a) => a.status === 1).length})
                                    </TabsTrigger>
                                  )}
                                  <TabsTrigger
                                    value="accepted"
                                    className="rounded-md data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
                                  >
                                    Accepted ({applicants.filter((a) => a.status === 4).length})
                                  </TabsTrigger>
                                  <TabsTrigger
                                    value="canceled"
                                    className="rounded-md data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
                                  >
                                    Canceled ({applicants.filter((a) => a.status === 2).length})
                                  </TabsTrigger>
                                </TabsList>

                                {!(selectedPost.status === 2 || selectedPost.status === 3) && (
                                  <TabsContent value="applying" className="mt-0">
                                    {applicants.filter((a) => a.status === 1).length === 0 ? (
                                      <div className="text-center py-12 bg-gray-50/50 rounded-xl">
                                        <p className="text-gray-500">No active applicants</p>
                                      </div>
                                    ) : (
                                      <div className="space-y-5">
                                        {applicants
                                          .filter((applicant) => applicant.status === 1)
                                          .map((applicant) => (
                                            <div
                                              key={applicant.id}
                                              className="p-5 rounded-xl bg-white/90 border border-gray-100 hover:border-gray-200 transition-all"
                                            >
                                              <div className="flex items-start gap-4">
                                                <Avatar className="h-12 w-12 rounded-full border-2 border-white shadow-sm">
                                                  <AvatarImage
                                                    src={applicant.trainer.avatar || "/placeholder.svg"}
                                                    alt={`${applicant.trainer.firstName} ${applicant.trainer.lastName}`}
                                                  />
                                                  <AvatarFallback className="bg-gradient-to-br from-[#DE9151] to-[#c27a40] text-white">
                                                    {applicant.trainer.firstName[0]}
                                                    {applicant.trainer.lastName[0]}
                                                  </AvatarFallback>
                                                </Avatar>

                                                <div className="flex-1">
                                                  <div className="flex justify-between items-start">
                                                    <div>
                                                      <h3 className="font-medium text-gray-900">
                                                        {applicant.trainer.firstName} {applicant.trainer.lastName}
                                                      </h3>
                                                      <p className="text-sm text-gray-400">@{applicant.trainer.username}</p>
                                                    </div>
                                                    <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-md font-normal">
                                                      Applying
                                                    </Badge>
                                                  </div>

                                                  {applicant.message && (
                                                    <p className="text-sm mt-2 text-gray-600 bg-gray-50 p-3 rounded-md">
                                                      {applicant.message}
                                                    </p>
                                                  )}

                                                  <p className="text-sm mt-2 text-gray-500">
                                                    Applied on {formatDate(applicant.createdAt)}
                                                  </p>

                                                  <div className="flex gap-2 mt-4">
                                                    <Button
                                                      className="bg-gradient-to-r from-[#DE9151] to-[#c27a40] hover:from-[#c27a40] hover:to-[#a56835] text-white rounded-full shadow-sm"
                                                      disabled={respondingId === applicant.id}
                                                      onClick={() => handleAcceptApplicant(applicant.id, selectedPost.id)}
                                                    >
                                                      {respondingId === applicant.id ? "Accepting..." : "Accept"}
                                                    </Button>
                                                    <Button
                                                      variant="outline"
                                                      className="rounded-md border-gray-200 text-gray-700 hover:bg-gray-50"
                                                      disabled={respondingId === applicant.id}
                                                      onClick={async () => {
                                                        setRespondingId(applicant.id)
                                                        const ok = await respondToApplicant(applicant.id, 2, selectedPost.id)
                                                        setRespondingId(null)
                                                        if (ok) toast.success("Applicant declined")
                                                        else toast.error("Failed to decline applicant")
                                                      }}
                                                    >
                                                      {respondingId === applicant.id ? "Declining..." : "Decline"}
                                                    </Button>
                                                    <Button
                                                      variant="outline"
                                                      className="rounded-md border-gray-200 text-gray-700 hover:bg-gray-50"
                                                      onClick={() => handleViewProfile(applicant.trainer.id)}
                                                    >
                                                      View Profile
                                                    </Button>
                                                    <Button
                                                      variant="outline"
                                                      className="rounded-md border-gray-200 text-gray-700 hover:bg-gray-50"
                                                      onClick={() => handleMessage(applicant.trainer.id)}
                                                    >
                                                      Message
                                                    </Button>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                      </div>
                                    )}
                                  </TabsContent>
                                )}

                                <TabsContent value="accepted" className="mt-0">
                                  {applicants.filter((a) => a.status === 4).length === 0 ? (
                                    <div className="text-center py-12 bg-gray-50/50 rounded-xl">
                                      <p className="text-gray-500">No accepted applicants</p>
                                    </div>
                                  ) : (
                                    <div className="space-y-5">
                                      {applicants
                                        .filter((applicant) => applicant.status === 4)
                                        .map((applicant) => (
                                          <div
                                            key={applicant.id}
                                            className="p-5 rounded-xl bg-white/90 border border-gray-100 hover:border-gray-200 transition-all"
                                          >
                                            <div className="flex items-start gap-4">
                                              <Avatar className="h-12 w-12 rounded-full border-2 border-white shadow-sm">
                                                <AvatarImage
                                                  src={applicant.trainer.avatar || "/placeholder.svg"}
                                                  alt={`${applicant.trainer.firstName} ${applicant.trainer.lastName}`}
                                                />
                                                <AvatarFallback className="bg-gradient-to-br from-[#DE9151] to-[#c27a40] text-white">
                                                  {applicant.trainer.firstName[0]}
                                                  {applicant.trainer.lastName[0]}
                                                </AvatarFallback>
                                              </Avatar>

                                              <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                  <div>
                                                    <h3 className="font-medium text-gray-900">
                                                      {applicant.trainer.firstName} {applicant.trainer.lastName}
                                                    </h3>
                                                    <p className="text-sm text-gray-400">@{applicant.trainer.username}</p>
                                                  </div>
                                                  <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md font-normal">
                                                    Accepted
                                                  </Badge>
                                                </div>

                                                {applicant.message && (
                                                  <p className="text-sm mt-2 text-gray-600 bg-gray-50 p-3 rounded-md">
                                                    {applicant.message}
                                                  </p>
                                                )}

                                                <p className="text-sm mt-2 text-gray-500">
                                                  Applied on {formatDate(applicant.createdAt)}
                                                </p>

                                                <div className="flex gap-2 mt-4">
                                                  <Button
                                                    variant="outline"
                                                    className="rounded-md border-gray-200 text-gray-700 hover:bg-gray-50"
                                                    onClick={() => handleMessage(applicant.trainer.id)}
                                                  >
                                                    Message
                                                  </Button>
                                                  <Button
                                                    variant="outline"
                                                    className="rounded-md border-gray-200 text-gray-700 hover:bg-gray-50"
                                                    onClick={() => handleViewProfile(applicant.trainer.id)}
                                                  >
                                                    View Profile
                                                  </Button>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                    </div>
                                  )}
                                </TabsContent>

                                <TabsContent value="canceled" className="mt-0">
                                  {applicants.filter((a) => a.status === 2).length === 0 ? (
                                    <div className="text-center py-12 bg-gray-50/50 rounded-xl">
                                      <p className="text-gray-500">No canceled applicants</p>
                                    </div>
                                  ) : (
                                    <div className="space-y-5">
                                      {applicants
                                        .filter((applicant) => applicant.status === 2)
                                        .map((applicant) => (
                                          <div
                                            key={applicant.id}
                                            className="p-5 rounded-xl bg-white/90 border border-gray-100 hover:border-gray-200 transition-all"
                                          >
                                            <div className="flex items-start gap-4">
                                              <Avatar className="h-12 w-12 rounded-full border-2 border-white shadow-sm">
                                                <AvatarImage
                                                  src={applicant.trainer.avatar || "/placeholder.svg"}
                                                  alt={`${applicant.trainer.firstName} ${applicant.trainer.lastName}`}
                                                />
                                                <AvatarFallback className="bg-gray-200 text-gray-600">
                                                  {applicant.trainer.firstName[0]}
                                                  {applicant.trainer.lastName[0]}
                                                </AvatarFallback>
                                              </Avatar>

                                              <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                  <div>
                                                    <h3 className="font-medium text-gray-900">
                                                      {applicant.trainer.firstName} {applicant.trainer.lastName}
                                                    </h3>
                                                    <p className="text-sm text-gray-400">@{applicant.trainer.username}</p>
                                                  </div>
                                                  <Badge className="bg-gray-100 text-gray-500 hover:bg-gray-200 rounded-md font-normal">
                                                    Canceled
                                                  </Badge>
                                                </div>

                                                {applicant.cancelReason && (
                                                  <p className="text-sm mt-2 text-gray-600 bg-gray-50 p-3 rounded-md">
                                                    Reason: {applicant.cancelReason}
                                                  </p>
                                                )}

                                                <p className="text-sm mt-2 text-gray-500">
                                                  Applied on {formatDate(applicant.createdAt)}
                                                </p>

                                                <div className="flex gap-2 mt-4">
                                                  <Button
                                                    variant="outline"
                                                    className="rounded-md border-gray-200 text-gray-700 hover:bg-gray-50"
                                                    onClick={() => handleViewProfile(applicant.trainer.id)}
                                                  >
                                                    View Profile
                                                  </Button>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                    </div>
                                  )}
                                </TabsContent>
                              </Tabs>
                            )}
                          </div>
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                )
              ))}

            {/* Empty state when no post is selected */}
            {(!isMobile || showMobileDetail) && !selectedPost && !showCreateForm && (
              <div className="flex-1 flex flex-col h-full">
                <div className="bg-white/90 rounded-xl flex flex-col h-full items-center justify-center p-4 shadow-md border border-gray-200/80 h-full">
                  {isMobile && (
                    <Button variant="ghost" size="sm" className="self-start mb-4 -ml-2" onClick={handleBackToList}>
                      <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
                      Back to posts
                    </Button>
                  )}
                  <div className="text-center max-w-md">
                    <div className="w-20 h-20 rounded-md bg-gradient-to-br from-[#DE9151]/10 to-[#4A6FA5]/20 flex items-center justify-center mx-auto mb-6">
                      <FileText className="h-10 w-10 text-[#DE9151]" />
                    </div>
                    <h3 className="text-2xl font-medium text-gray-800 tracking-tight mb-3">No Post Selected</h3>
                    <p className="text-gray-500 mb-8 max-w-xs mx-auto">
                      Select a post from the list to view its details and manage applicants
                    </p>
                    <Button
                      className="bg-gradient-to-r from-[#DE9151] to-[#c27a40] hover:from-[#c27a40] hover:to-[#a56835] text-white rounded-md shadow-sm px-4 py-2"
                      onClick={() => setShowCreateForm(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Post
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Confirm Action</h3>
            <p className="text-gray-600 mb-5">{confirmMessage}</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                Cancel
              </Button>
              <Button className="bg-[#DE9151] hover:bg-[#DE9151]/90 text-white" onClick={() => confirmAction()}>
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
