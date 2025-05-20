import { MapPin, Users, Calendar, Clock, Search, Filter, ArrowUpDown, Edit, Trash2, Plus, X } from "lucide-react"
import { formatInTimeZone } from "date-fns-tz"
import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useNavigate, useParams } from "react-router-dom"
import { useAppointmentStore } from "@/store/AppointmentStore"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useSocialStore } from "@/store/SocialStore"
import { GeoStore } from "@/store/GeoStore"
import axios from "axios"
import { toast } from "react-toastify"

interface Location {
  placeName: string
  placeId: string
  latitude: number
  longitude: number
  formattedAddress: string
}

interface User {
  id: string
  email: string
  username: string
  firstName: string
  lastName: string
  role: number
  avatar: string
  isDeleted: boolean
  isSuspended: boolean
  status?: number
}

interface Appointment {
  id: string
  editable: boolean
  booker: User
  otherParticipants: User[]
  name: string
  description: string
  location: Location
  startTime: string
  endTime: string
  status: number
  repeatingType: number
  created: string
  modified: string
  participantCount: number
}

export function AppointmentsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<"starttime" | "endtime">("endtime")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [hoveredBooker, setHoveredBooker] = useState<{id: string, elementId: string} | null>(null)
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null)
  const navigate = useNavigate()
  const { appointmentId } = useParams<{ appointmentId?: string }>()
  const [bookingStart, setBookingStart] = useState("")
  const [bookingEnd, setBookingEnd] = useState("")
  const [selectedParticipants, setSelectedParticipants] = useState<any[]>([])
  const [participantSearch, setParticipantSearch] = useState("")
  const [participantResults, setParticipantResults] = useState<any[]>([])
  const [isSearchingParticipants, setIsSearchingParticipants] = useState(false)
  const searchFollowedUsers = useSocialStore((s) => s.searchFollowedUsers)
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)
  const [locationSearch, setLocationSearch] = useState("")
  const [locationResults, setLocationResults] = useState<{ description: string; placeId: string }[]>([])
  const [selectedLocation, setSelectedLocation] = useState<{ description: string; placeId: string } | null>(null)
  const [isSearchingLocation, setIsSearchingLocation] = useState(false)
  const geoStore = GeoStore()
  const locationTimeout = useRef<NodeJS.Timeout | null>(null)
  const [repeatingType, setRepeatingType] = useState<number>(0)
  const participantDropdownRef = useRef<HTMLDivElement>(null)
  const locationDropdownRef = useRef<HTMLDivElement>(null)
  const [formErrors, setFormErrors] = useState<{name?: string, start?: string, end?: string}>({})
  const [isBooking, setIsBooking] = useState(false)
  const [bookingMessage, setBookingMessage] = useState<{text: string, success: boolean} | null>(null)

  const { appointments, isLoading, error, fetchAppointments, fetchAppointmentById, totalCount, pageNumber, setPageNumber, setPageSize } = useAppointmentStore()

  useEffect(() => {
    setPageSize(10)
    const loadData = async () => {
      await fetchAppointments(searchQuery, sortBy, sortOrder, statusFilter)
      
      if (appointmentId && (!selectedAppointment || selectedAppointment.id !== appointmentId)) {
        setIsLoadingDetails(true)
        const appointment = await fetchAppointmentById(appointmentId)
        if (appointment) {
          setSelectedAppointment(appointment)
        }
        setIsLoadingDetails(false)
      }
    }
    loadData()
  }, [appointmentId])

  const handleSearch = () => {
    setPageNumber(1)
    setSelectedAppointment(null)
    fetchAppointments(searchQuery, sortBy, sortOrder, statusFilter)
  }

  const handleStatusFilter = (status: number | null) => {
    setStatusFilter(status)
    setPageNumber(1)
    setSelectedAppointment(null)
    fetchAppointments(searchQuery, sortBy, sortOrder, status)
  }

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0:
        return "bg-gray-100 text-gray-800"
      case 1:
        return "bg-yellow-100 text-yellow-800"
      case 2:
        return "bg-green-100 text-green-800"
      case 3:
        return "bg-red-100 text-red-800"
      case 4:
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getAppointmentTimeStatus = (startTime: string, endTime: string) => {
    const now = new Date()
    const start = new Date(startTime)
    const end = new Date(endTime)
    
    if (now > end) return { status: 'expired', color: 'bg-gray-100 text-gray-800' }
    if (now >= start && now <= end) return { status: 'in-progress', color: 'bg-blue-100 text-blue-800' }
    return { status: 'upcoming', color: 'bg-green-100 text-green-800' }
  }

  const getStatusText = (status: number) => {
    switch (status) {
      case 0:
        return "None"
      case 1:
        return "Pending"
      case 2:
        return "Accepted"
      case 3:
        return "Rejected"
      case 4:
        return "Canceled"
      default:
        return "Unknown"
    }
  }

  const getRoleText = (role: number) => {
    if (role === 1) return "Seeker"
    if (role === 2) return "Personal Trainer"
    return "User"
  }

  const getRoleLabel = (role: number) => {
    if (role === 1) return "Seeker";
    if (role === 2) return "Personal Trainer";
    return "User";
  };

  const getRepeatingTypeLabel = (type: number) => {
    switch (type) {
      case 1: return "Daily";
      case 2: return "Weekly";
      case 3: return "Monthly";
      case 4: return "Yearly";
      default: return null;
    }
  };

  const filteredAppointments = appointments
    .filter((appointment) => {
      const matchesStatus = statusFilter === null || appointment.status === statusFilter
      return matchesStatus
    })

  const handleAppointmentClick = async (appointment: Appointment) => {
    setIsLoadingDetails(true)
    const freshAppointment = await fetchAppointmentById(appointment.id)
    if (freshAppointment) {
      setSelectedAppointment(freshAppointment)
    }
    setIsLoadingDetails(false)
    navigate(`/appointments/${appointment.id}`)
  }

  const formatLocalTime = (utcTime: string) => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const date = new Date(utcTime)
    const localTime = formatInTimeZone(date, timeZone, "MMM d, yyyy h:mm a")
    return localTime
  }
  
  const formatLocalDate = (utcTime: string) => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const date = new Date(utcTime)
    return formatInTimeZone(date, timeZone, "MMM d, yyyy")
  }
  
  const formatLocalTimeOnly = (utcTime: string) => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const date = new Date(utcTime)
    return formatInTimeZone(date, timeZone, "h:mm a")
  }

  // Debounced participant search
  useEffect(() => {
    if (!participantSearch) {
      setParticipantResults([])
      return
    }
    setIsSearchingParticipants(true)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(async () => {
      const results = await searchFollowedUsers(participantSearch)
      setParticipantResults(results.filter(u => !selectedParticipants.some(p => p.id === u.id)))
      setIsSearchingParticipants(false)
    }, 500)
    // eslint-disable-next-line
  }, [participantSearch])

  // Debounced location search
  useEffect(() => {
    if (!locationSearch) {
      setLocationResults([])
      return
    }
    setIsSearchingLocation(true)
    if (locationTimeout.current) clearTimeout(locationTimeout.current)
    locationTimeout.current = setTimeout(async () => {
      const results = await geoStore.searchLocations(locationSearch)
      setLocationResults(results)
      setIsSearchingLocation(false)
    }, 500)
    // eslint-disable-next-line
  }, [locationSearch])

  const handleCreateAppointment = async () => {
    const name = (document.getElementById('appointment-name') as HTMLInputElement)?.value || ""
    let errors: {name?: string, start?: string, end?: string} = {}
    if (!name.trim()) errors.name = 'Name is required'
    if (!bookingStart) errors.start = 'Start time is required'
    if (!bookingEnd) errors.end = 'End time is required'
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return
    setIsBooking(true)
    setBookingMessage(null)
    const toUTCISOString = (local: string) => {
      const date = new Date(local + ':00');
      return date.toISOString();
    };
    const body = {
      participantIds: selectedParticipants.map(u => u.id),
      name,
      description: (document.getElementById('appointment-description') as HTMLTextAreaElement)?.value || "",
      placeId: selectedLocation?.placeId,
      startTime: toUTCISOString(bookingStart),
      endTime: toUTCISOString(bookingEnd),
      repeatingType: repeatingType
    };
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/Appointment/book`, body, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        }
      });
      setTimeout(() => {
        setShowBookingForm(false)
        fetchAppointments(searchQuery, sortBy, sortOrder, statusFilter)
      }, 1200)
    } catch (err: any) {
      setBookingMessage({text: err?.response?.data?.message || 'Error', success: false})
    } finally {
      setIsBooking(false)
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        participantDropdownRef.current &&
        !participantDropdownRef.current.contains(event.target as Node)
      ) {
        setParticipantResults([])
      }
      if (
        locationDropdownRef.current &&
        !locationDropdownRef.current.contains(event.target as Node)
      ) {
        setLocationResults([])
      }
    }
    if (showBookingForm) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showBookingForm])

  const handlePageChange = (newPage: number) => {
    setPageNumber(newPage)
    fetchAppointments(searchQuery, sortBy, sortOrder, statusFilter)
  }

  const totalPages = Math.ceil(totalCount / 10)

  const getParticipantStatusColor = (status: number) => {
    switch (status) {
      case 0:
        return "bg-gray-100 text-gray-800"
      case 1:
        return "bg-yellow-100 text-yellow-800"
      case 2:
        return "bg-green-100 text-green-800"
      case 3:
        return "bg-red-100 text-red-800"
      case 4:
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getParticipantStatusText = (status: number) => {
    switch (status) {
      case 0:
        return "None"
      case 1:
        return "Pending"
      case 2:
        return "Accepted"
      case 3:
        return "Rejected"
      case 4:
        return "Canceled"
      default:
        return "Unknown"
    }
  }

  const handleStatusChange = async (newStatus: number) => {
    if (!selectedAppointment) return

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/Appointment/actionRequest`,
        {
          appointmentId: selectedAppointment.id,
          action: newStatus === 2 ? 1 : newStatus === 3 ? 2 : 3
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json"
          }
        }
      )

      if (response.data.success) {
        toast.success(response.data.message || 'Action successful', { position: 'top-right' })
        if (selectedAppointment) {
          setSelectedAppointment({...selectedAppointment, status: newStatus})
        }
        fetchAppointments(searchQuery, sortBy, sortOrder, statusFilter)
      } else {
        toast.error(response.data.message || 'Action failed', { position: 'top-right' })
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Action failed', { position: 'top-right' })
    }
  }

  return (
    <div className="p-8 h-[calc(100vh-4rem)] bg-[#f9fafb]">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search appointments..."
                className="pl-10 w-56 bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch()
                  }
                }}
              />
            </div>
            <Button onClick={handleSearch} className="bg-[#de9151] hover:bg-[#de9151]/90">
              Search
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 bg-white">
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleStatusFilter(null)}>
                  All Statuses
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusFilter(0)}>
                  None
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusFilter(1)}>
                  Pending
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusFilter(2)}>
                  Accepted
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusFilter(3)}>
                  Rejected
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusFilter(4)}>
                  Canceled
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 bg-white">
                  <ArrowUpDown className="h-4 w-4" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => {
                  setSortBy("starttime")
                  setSortOrder("asc")
                }}>
                  Start Time (Oldest First)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setSortBy("starttime")
                  setSortOrder("desc")
                }}>
                  Start Time (Newest First)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setSortBy("endtime")
                  setSortOrder("asc")
                }}>
                  End Time (Oldest First)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setSortBy("endtime")
                  setSortOrder("desc")
                }}>
                  End Time (Newest First)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Button 
            onClick={() => setShowBookingForm(true)}
            className="bg-[#de9151] hover:bg-[#de9151]/90 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Book Appointment
          </Button>
        </div>

        {/* Content Section - Split View */}
        <div className="flex flex-1 gap-2 min-h-0">
          {/* Left Side - List */}
          <div className="w-[30%] flex flex-col h-full">
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="text-sm text-gray-500 mb-2">Total count: {totalCount}</div>
              {filteredAppointments.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                  <p className="text-gray-500">No appointments found</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {filteredAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className={`bg-white rounded-lg shadow-md p-4 cursor-pointer transition-all ${
                          selectedAppointment?.id === appointment.id
                            ? "border-2 border-[#de9151]"
                            : "hover:shadow-lg"
                        }`}
                        onClick={() => handleAppointmentClick(appointment)}
                      >
                        <div className="flex justify-between items-center mb-1 gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <h2 className="text-lg font-semibold truncate">{appointment.name}</h2>
                            <div
                              id={`booker-${appointment.id}`}
                              className="relative flex items-center group"
                              onMouseEnter={() => {
                                hoverTimeout.current = setTimeout(() => {
                                  setHoveredBooker({id: appointment.booker.id, elementId: `booker-${appointment.id}`})
                                }, 300)
                              }}
                              onMouseLeave={() => {
                                if (hoverTimeout.current) clearTimeout(hoverTimeout.current)
                                setHoveredBooker(null)
                              }}
                            >
                              <img
                                src={appointment.booker.avatar}
                                alt={`${appointment.booker.firstName} ${appointment.booker.lastName}`}
                                className="w-6 h-6 rounded-full ml-2 mr-1"
                              />
                              <span className="text-sm text-gray-600 truncate">
                                {appointment.booker.firstName} {appointment.booker.lastName}
                              </span>
                              {hoveredBooker?.id === appointment.booker.id && hoveredBooker.elementId === `booker-${appointment.id}` && (
                                <div
                                  className="absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 rounded-lg bg-white p-4 shadow-lg border text-sm text-gray-800 whitespace-normal"
                                >
                                  <div className="flex items-center mb-2">
                                    <img
                                      src={appointment.booker.avatar}
                                      alt={`${appointment.booker.firstName} ${appointment.booker.lastName}`}
                                      className="w-10 h-10 rounded-full mr-3"
                                    />
                                    <div>
                                      <button
                                        className="font-semibold flex items-center hover:underline focus:outline-none"
                                        onClick={() => navigate(`/profile/${appointment.booker.id}`)}
                                      >
                                        {appointment.booker.firstName} {appointment.booker.lastName}
                                        <span className="text-xs text-gray-400 ml-2">{getRoleText(appointment.booker.role)}</span>
                                      </button>
                                      <button
                                        className="text-xs text-blue-500 hover:underline focus:outline-none text-left"
                                        onClick={() => navigate(`/profile/${appointment.booker.id}`)}
                                      >
                                        {appointment.booker.username}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getRepeatingTypeLabel(appointment.repeatingType) && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {getRepeatingTypeLabel(appointment.repeatingType)}
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                              {getStatusText(appointment.status)}
                            </span>
                            {appointment.status === 2 && (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getAppointmentTimeStatus(appointment.startTime, appointment.endTime).color}`}>
                                {getAppointmentTimeStatus(appointment.startTime, appointment.endTime).status === 'in-progress' ? 'In Progress' : 
                                 getAppointmentTimeStatus(appointment.startTime, appointment.endTime).status === 'expired' ? 'Expired' : 'Upcoming'}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div className="flex items-center text-gray-600 text-sm">
                            <MapPin className="h-4 w-4 mr-1.5" />
                            <span className="truncate">{appointment.location?.formattedAddress || 'No location'}</span>
                          </div>
                          <div className="flex items-center text-gray-600 text-sm">
                            <Users className="h-4 w-4 mr-1.5" />
                            <span>{appointment.participantCount ?? 1} participants</span>
                          </div>
                          {formatLocalDate(appointment.startTime) === formatLocalDate(appointment.endTime) ? (
                            <>
                              <div className="flex items-center text-gray-600 text-sm">
                                <Calendar className="h-4 w-4 mr-1.5" />
                                <span>{formatLocalDate(appointment.startTime)}</span>
                              </div>
                              <div className="flex items-center text-gray-600 text-sm">
                                <Clock className="h-4 w-4 mr-1.5" />
                                <span>
                                  {formatLocalTimeOnly(appointment.startTime)} - {formatLocalTimeOnly(appointment.endTime)}
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="flex items-center text-gray-600 text-sm col-span-2">
                              <Clock className="h-4 w-4 mr-1.5" />
                              <span>
                                {formatLocalTime(appointment.startTime)} - {formatLocalTime(appointment.endTime)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pageNumber - 1)}
                        disabled={pageNumber === 1}
                      >
                        Previous
                      </Button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={page === pageNumber ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className={page === pageNumber ? "bg-[#de9151] hover:bg-[#de9151]/90" : ""}
                        >
                          {page}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pageNumber + 1)}
                        disabled={pageNumber === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right Side - Details */}
          <div className="flex-1 bg-white rounded-lg shadow-xl p-6 overflow-y-auto h-full">
            {isLoadingDetails ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#de9151]"></div>
              </div>
            ) : selectedAppointment ? (
              <>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center w-full justify-between gap-2">
                    <div className="flex items-center gap-4">
                      <h2 className="text-2xl font-bold">{selectedAppointment.name}</h2>
                      {getRepeatingTypeLabel(selectedAppointment.repeatingType) && (
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {getRepeatingTypeLabel(selectedAppointment.repeatingType)}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 items-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            className={`px-3 py-1 rounded-full text-sm font-medium hover:opacity-80 transition-all ${getStatusColor(selectedAppointment.status)} flex items-center gap-1.5`}
                          >
                            {getStatusText(selectedAppointment.status)}
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-32 p-1">
                          {selectedAppointment.status === 1 && (
                            <>
                              <DropdownMenuItem 
                                onClick={() => handleStatusChange(2)}
                                className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer rounded-md hover:bg-green-50 hover:text-green-700 focus:bg-green-50 focus:text-green-700"
                              >
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                Accept
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleStatusChange(3)}
                                className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer rounded-md hover:bg-red-50 hover:text-red-700 focus:bg-red-50 focus:text-red-700"
                              >
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                Decline
                              </DropdownMenuItem>
                            </>
                          )}
                          {selectedAppointment.status === 2 && (
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(4)}
                              className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer rounded-md hover:bg-red-50 hover:text-red-700 focus:bg-red-50 focus:text-red-700"
                            >
                              <div className="w-2 h-2 rounded-full bg-red-500"></div>
                              Cancel
                            </DropdownMenuItem>
                          )}
                          {(selectedAppointment.status === 3 || selectedAppointment.status === 4) && (
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(2)}
                              className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer rounded-md hover:bg-green-50 hover:text-green-700 focus:bg-green-50 focus:text-green-700"
                            >
                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
                              Accept
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      {selectedAppointment.editable && (
                        <>
                          <Button variant="outline" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex gap-8 text-xs text-gray-500">
                    <div>Created: {formatLocalTime(selectedAppointment.created)}</div>
                    <div>Last modified: {formatLocalTime(selectedAppointment.modified)}</div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Description</h3>
                    <p className="text-gray-600">{selectedAppointment.description}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Participants</h3>
                    <div className="space-y-4">
                      {[
                        {...selectedAppointment.booker, roleLabel: 'Booker'}, 
                        ...(selectedAppointment.otherParticipants || []).map(p => ({...p, roleLabel: 'Participant'}))
                      ].map((user) => (
                        <div key={user.id} className="flex items-center gap-3">
                          <button
                            className="focus:outline-none"
                            onClick={() => navigate(`/profile/${user.id}`)}
                          >
                            <img
                              src={user.avatar}
                              alt={`${user.firstName} ${user.lastName}`}
                              className="w-10 h-10 rounded-full"
                            />
                          </button>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <button
                                className="font-medium text-left focus:outline-none truncate"
                                onClick={() => navigate(`/profile/${user.id}`)}
                              >
                                {user.firstName} {user.lastName}
                              </button>
                              <span className="text-xs text-gray-400">{user.roleLabel}</span>
                              {user.status !== undefined && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getParticipantStatusColor(user.status)}`}>
                                  {getParticipantStatusText(user.status)}
                                </span>
                              )}
                            </div>
                            <button
                              className="text-xs text-blue-500 text-left truncate focus:outline-none"
                              onClick={() => navigate(`/profile/${user.id}`)}
                            >
                              {user.email}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Location</h3>
                    <div className="flex items-center text-gray-600 mb-2">
                      <MapPin className="h-5 w-5 mr-2" />
                      <span>{selectedAppointment.location?.formattedAddress || 'No location'}</span>
                    </div>
                    {selectedAppointment.location && (
                      <div className="rounded-lg overflow-hidden border w-[320px] h-[180px]">
                        <iframe
                          title="Map overview"
                          width="320"
                          height="180"
                          style={{ border: 0 }}
                          src={`https://maps.google.com/maps?q=${selectedAppointment.location.latitude},${selectedAppointment.location.longitude}&z=15&output=embed`}
                          allowFullScreen
                        ></iframe>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">{selectedAppointment.repeatingType ? 'Upcoming Schedule' : 'Schedule'}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Start Time</p>
                        <p className="text-gray-600">
                          {formatLocalTime(selectedAppointment.startTime)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">End Time</p>
                        <p className="text-gray-600">
                          {formatLocalTime(selectedAppointment.endTime)}
                        </p>
                      </div>
                      {selectedAppointment.status === 2 && (
                        <div className="col-span-2">
                          <p className="text-sm text-gray-500">Current Status</p>
                          <p className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getAppointmentTimeStatus(selectedAppointment.startTime, selectedAppointment.endTime).color}`}>
                            {getAppointmentTimeStatus(selectedAppointment.startTime, selectedAppointment.endTime).status === 'in-progress' ? 'In Progress' : 
                             getAppointmentTimeStatus(selectedAppointment.startTime, selectedAppointment.endTime).status === 'expired' ? 'Expired' : 'Upcoming'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Select an appointment to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showBookingForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[60vh] max-h-[98vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Book New Appointment</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowBookingForm(false)}
                className="h-8 w-8"
                disabled={isBooking}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              {bookingMessage && (
                <div className={`text-center text-sm font-medium mb-2 ${bookingMessage.success ? 'text-green-600' : 'text-red-600'}`}>{bookingMessage.text}</div>
              )}
              <div>
                <Label className="mb-2 block">Appointment Name</Label>
                <Input id="appointment-name" placeholder="Enter appointment name" disabled={isBooking} />
                {formErrors.name && <div className="text-red-500 text-xs mt-1">{formErrors.name}</div>}
              </div>
              <div>
                <Label className="mb-2 block">Description</Label>
                <Textarea id="appointment-description" placeholder="Enter appointment description" disabled={isBooking} />
              </div>
              <div>
                <Label className="mb-2 block">Participants</Label>
                <div className="relative" ref={participantDropdownRef}>
                  <div className="w-full flex flex-wrap items-center gap-2 rounded-md border border-input bg-white px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-[#2563eb]">
                    {selectedParticipants.map(user => (
                      <div key={user.id} className="flex items-center gap-1 bg-gray-100 rounded-full px-2 py-1 text-sm border border-gray-300">
                        <img src={user.avatar} alt={user.firstName} className="w-6 h-6 rounded-full" />
                        <span className="font-medium">{user.firstName} {user.lastName}</span>
                        <span className="text-xs text-gray-500 ml-1">{getRoleLabel(user.role)}</span>
                        <button
                          className="ml-1 text-gray-400 hover:text-red-500"
                          onClick={() => setSelectedParticipants(selectedParticipants.filter(u => u.id !== user.id))}
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                    <input
                      className="flex-1 min-w-[120px] outline-none border-none bg-transparent h-full"
                      placeholder="Search connected friends"
                      value={participantSearch}
                      onChange={e => setParticipantSearch(e.target.value)}
                      style={{ minWidth: 120 }}
                      disabled={isBooking}
                    />
                  </div>
                  {participantResults.length > 0 && (
                    <div className="absolute z-10 bg-white border rounded w-full mt-1 max-h-48 overflow-y-auto shadow-lg">
                      {participantResults.filter(u => !selectedParticipants.some(p => p.id === u.id)).map(user => (
                        <div
                          key={user.id}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            setSelectedParticipants([...selectedParticipants, user])
                            setParticipantSearch("")
                            setParticipantResults([])
                          }}
                        >
                          <img src={user.avatar} alt={user.firstName} className="w-6 h-6 rounded-full" />
                          <div className="flex flex-col justify-center">
                            <span className="font-medium flex items-center gap-1">{user.firstName} {user.lastName}
                              <span className="text-xs text-gray-500 ml-1">{getRoleLabel(user.role)}</span>
                            </span>
                            <span className="text-xs text-gray-500">{user.email}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {isSearchingParticipants && (
                    <div className="absolute z-10 bg-white border rounded w-full mt-1 px-3 py-2 text-sm text-gray-500">Searching...</div>
                  )}
                </div>
              </div>
              <div>
                <Label className="mb-2 block">Location</Label>
                <div className="relative" ref={locationDropdownRef}>
                  <Input
                    placeholder="Search location"
                    value={selectedLocation ? selectedLocation.description : locationSearch}
                    onChange={e => {
                      setSelectedLocation(null)
                      setLocationSearch(e.target.value)
                    }}
                    disabled={isBooking}
                  />
                  {locationResults.length > 0 && !selectedLocation && (
                    <div className="absolute z-10 bg-white border rounded w-full mt-1 max-h-48 overflow-y-auto shadow-lg">
                      {locationResults.map(loc => (
                        <div
                          key={loc.placeId}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            setSelectedLocation(loc)
                            setLocationSearch("")
                            setLocationResults([])
                          }}
                        >
                          {loc.description}
                        </div>
                      ))}
                    </div>
                  )}
                  {isSearchingLocation && (
                    <div className="absolute z-10 bg-white border rounded w-full mt-1 px-3 py-2 text-sm text-gray-500">Searching...</div>
                  )}
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label className="mb-2 block">Start Time</Label>
                  <Input 
                    type="datetime-local" 
                    min={new Date().toISOString().slice(0, 16)}
                    value={bookingStart}
                    onChange={e => {
                      setBookingStart(e.target.value)
                      if (bookingEnd && e.target.value > bookingEnd) setBookingEnd("")
                    }}
                    lang="en-GB"
                    step={60}
                    disabled={isBooking}
                  />
                  {formErrors.start && <div className="text-red-500 text-xs mt-1">{formErrors.start}</div>}
                </div>
                <div className="flex-1">
                  <Label className="mb-2 block">End Time</Label>
                  <Input 
                    type="datetime-local" 
                    min={bookingStart || new Date().toISOString().slice(0, 16)}
                    value={bookingEnd}
                    onChange={e => setBookingEnd(e.target.value)}
                    lang="en-GB"
                    step={60}
                    disabled={isBooking}
                  />
                  {formErrors.end && <div className="text-red-500 text-xs mt-1">{formErrors.end}</div>}
                </div>
              </div>
              <div>
                <Label className="mb-2 block">Repeating Type</Label>
                <select
                  className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2563eb]"
                  value={repeatingType}
                  onChange={e => setRepeatingType(Number(e.target.value))}
                  disabled={isBooking}
                >
                  <option value={0}>None</option>
                  <option value={1}>Daily</option>
                  <option value={2}>Weekly</option>
                  <option value={3}>Monthly</option>
                  <option value={4}>Yearly</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowBookingForm(false)}
                  disabled={isBooking}
                >
                  Cancel
                </Button>
                <Button className="bg-[#de9151] hover:bg-[#de9151]/90 flex items-center justify-center min-w-[120px]" onClick={handleCreateAppointment} disabled={isBooking}>
                  {isBooking && <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>}
                  Create Appointment
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 