import { MapPin, Users, Calendar, Clock, Search, Filter, ArrowUpDown, Edit, Trash2, Plus, X, CalendarClock, Clock4, History, Coins, CheckCircle } from "lucide-react"
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
import { AppLeftSidebar } from "@/components/layout/AppLeftSidebar"
import axios from "axios"
import { toast, ToastContainer } from "react-toastify"
import { cn } from "@/lib/utils"
import { useWalletStore } from "@/store/WalletStore"
import "react-toastify/dist/ReactToastify.css"
import { useAuthStore } from "@/store/AuthStore"

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
  notiCount: number
  price: number
  confirmationRequest: {
    id: number
    img: string
    content: string
    status: number
    createdAt: string
    modifiedAt: string
    expiresdAt: string
  } | null
}

interface BasicInfo {
  id: string
  role: number
}

// Add these styles at the top of the file, after the imports
const styles = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.15s ease-out;
}

.animate-slideUp {
  animation: slideUp 0.2s ease-out;
}
`;

// Add this right after the styles constant
const styleSheet = document.createElement("style");
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

export function AppointmentsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<"starttime" | "endtime" | undefined>(undefined)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | undefined>(undefined)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [hoveredBooker, setHoveredBooker] = useState<{id: string, elementId: string} | null>(null)
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null)
  const navigate = useNavigate()
  const { appointmentId } = useParams<{ appointmentId?: string }>()
  const [bookingStart, setBookingStart] = useState(() => {
    const now = new Date()
    now.setHours(now.getHours() + 1)
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    return formatInTimeZone(now, timeZone, "yyyy-MM-dd'T'HH:mm")
  })
  const [bookingEnd, setBookingEnd] = useState(() => {
    const now = new Date()
    now.setHours(now.getHours() + 2)
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    return formatInTimeZone(now, timeZone, "yyyy-MM-dd'T'HH:mm")
  })
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
  const [showSidebars, setShowSidebars] = useState(() => {
    const sidebarState = localStorage.getItem("sidebarShow")
    return sidebarState === null ? true : sidebarState === "true"
  })
  const [appointmentStatus, setAppointmentStatus] = useState<number>(1) // 1: upcoming, 2: in progress, 3: expired
  const [viewedNotifications, setViewedNotifications] = useState<Set<string>>(new Set())
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {})
  const [confirmMessage, setConfirmMessage] = useState("")
  const [isConfirmLoading, setIsConfirmLoading] = useState(false)
  const [confirmStatus, setConfirmStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [confirmError, setConfirmError] = useState("")
  const [confirmButtonText, setConfirmButtonText] = useState<React.ReactNode>("Confirm")
  const [showConfirmationForm, setShowConfirmationForm] = useState(false)
  const [confirmationMessage, setConfirmationMessage] = useState("")
  const [confirmationImage, setConfirmationImage] = useState<File | null>(null)
  const [isSendingConfirmation, setIsSendingConfirmation] = useState(false)
  const [showConfirmationRequestForm, setShowConfirmationRequestForm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showConfirmationDetails, setShowConfirmationDetails] = useState(false)
  const [progress, setProgress] = useState<{[key: string]: number}>({})

  const { appointments, isLoading, error, fetchAppointments, fetchAppointmentById, totalCount, pageNumber, setPageNumber, setPageSize, deleteAppointment, sendConfirmationRequest, confirmRequest } = useAppointmentStore()
  const { getBalance } = useWalletStore()
  const { basicInfo } = useAuthStore()

  useEffect(() => {
    setPageSize(10)
    const loadData = async () => {
      await fetchAppointments(searchQuery, sortBy, sortOrder, statusFilter, appointmentStatus)
      
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
  }, [appointmentId, appointmentStatus])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.toString()) {
      setShowBookingForm(true)
      const name = params.get('name')
      const description = params.get('description')
      const posterId = params.get('posterId')
      const startTime = params.get('startTime')
      const endTime = params.get('endTime')
      const location = params.get('location')
      const placeId = params.get('placeId')
      const lat = params.get('lat')
      const lng = params.get('lng')
      const formattedAddress = params.get('formattedAddress')

      if (name) {
        const nameInput = document.getElementById('appointment-name') as HTMLInputElement
        if (nameInput) nameInput.value = name
      }
      if (description) {
        const descInput = document.getElementById('appointment-description') as HTMLTextAreaElement
        if (descInput) descInput.value = description
      }
      if (startTime) {
        const date = new Date(startTime)
        setBookingStart(date.toISOString().slice(0, 16))
      }
      if (endTime) {
        const date = new Date(endTime)
        setBookingEnd(date.toISOString().slice(0, 16))
      }
      if (location && placeId) {
        setSelectedLocation({ description: location, placeId })
        setLocationSearch(location)
      }
      if (posterId) {
        searchFollowedUsers(posterId).then(results => {
          if (results.length > 0) {
            setSelectedParticipants([results[0]])
          }
        })
      }
    }
  }, [])

  const handleSearch = () => {
    setPageNumber(1)
    setSelectedAppointment(null)
    fetchAppointments(searchQuery, sortBy, sortOrder, statusFilter, appointmentStatus)
  }

  const handleStatusFilter = (status: number | null) => {
    setStatusFilter(status)
    setPageNumber(1)
    setSelectedAppointment(null)
    fetchAppointments(searchQuery, sortBy, sortOrder, status, appointmentStatus)
  }

  const handleAppointmentStatusChange = (status: number) => {
    setAppointmentStatus(status)
    setPageNumber(1)
    setSelectedAppointment(null)
    fetchAppointments(searchQuery, sortBy, sortOrder, statusFilter, status)
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
        return "Finished"
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
      if (appointment.notiCount > 0) {
        setViewedNotifications(prev => new Set([...prev, appointment.id]))
      }
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
    const price = (document.getElementById('appointment-price') as HTMLInputElement)?.value || "0"
    const body = {
      participantIds: selectedParticipants.map(u => u.id),
      name,
      description: (document.getElementById('appointment-description') as HTMLTextAreaElement)?.value || "",
      placeId: selectedLocation?.placeId,
      startTime: toUTCISOString(bookingStart),
      endTime: toUTCISOString(bookingEnd),
      repeatingType: repeatingType,
      price: Number(price)
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
        fetchAppointments(searchQuery, sortBy, sortOrder, statusFilter, appointmentStatus)
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
    fetchAppointments(searchQuery, sortBy, sortOrder, statusFilter, appointmentStatus)
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

    const actionMap = {
      2: 'accept',
      3: 'decline',
      4: 'cancel'
    }

    const action = actionMap[newStatus as keyof typeof actionMap]
    if (!action) return

    // Reset states
    setConfirmStatus('idle')
    setConfirmError("")
    setConfirmButtonText("Confirm")
    
    // Prepare message based on action and price
    let message = `Are you sure you want to ${action} this appointment?`
    if (action === 'accept' && selectedAppointment.price > 0) {
      message = "You are about to accept this appointment. Are you sure you want to proceed?"
      setConfirmButtonText(
        <div className="flex items-center gap-1.5">
          <span>Accept and pay</span>
          <div className="flex items-center text-white font-medium">
            <Coins className="h-4 w-4 mr-1" />
            {selectedAppointment.price}
          </div>
        </div>
      )
    }

    setConfirmMessage(message)
    setConfirmAction(() => async () => {
      setIsConfirmLoading(true)
      setConfirmStatus('loading')
      try {
        if (selectedAppointment.confirmationRequest && newStatus === 2) {
          const result = await confirmRequest(selectedAppointment.confirmationRequest.id)
          if (result.success) {
            setConfirmStatus('success')
            setTimeout(() => {
              if (selectedAppointment && selectedAppointment.confirmationRequest) {
                const updatedConfirmationRequest = {
                  ...selectedAppointment.confirmationRequest,
                  status: 2
                }
                setSelectedAppointment({
                  ...selectedAppointment,
                  confirmationRequest: updatedConfirmationRequest
                })
                getBalance()
              }
              fetchAppointments(searchQuery, sortBy, sortOrder, statusFilter, appointmentStatus)
              setShowConfirmDialog(false)
            }, 1500)
          } else {
            setConfirmStatus('error')
            setConfirmError(result.message)
          }
        } else {
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
          setConfirmStatus('success')
          setTimeout(() => {
            if (selectedAppointment) {
              setSelectedAppointment({...selectedAppointment, status: newStatus})
              getBalance()
            }
            fetchAppointments(searchQuery, sortBy, sortOrder, statusFilter, appointmentStatus)
            setShowConfirmDialog(false)
          }, 1500)
        } else {
          setConfirmStatus('error')
          setConfirmError(response.data.message || 'Action failed')
          }
        }
      } catch (err: any) {
        setConfirmStatus('error')
        setConfirmError(err?.response?.data?.message || 'Action failed')
      } finally {
        setIsConfirmLoading(false)
      }
    })
    setShowConfirmDialog(true)
  }

  const handleDeleteAppointment = async () => {
    if (!selectedAppointment) return

    setConfirmStatus('idle')
    setConfirmError("")
    setConfirmButtonText(
      <div className="flex items-center gap-1.5 text-white">
        <Trash2 className="h-4 w-4" />
        <span>Delete</span>
      </div>
    )
    setConfirmMessage("Are you sure you want to delete this appointment? This action cannot be undone.")
    setConfirmAction(() => async () => {
      setIsConfirmLoading(true)
      setConfirmStatus('loading')
      try {
        const result = await deleteAppointment(selectedAppointment.id)
        if (result.success) {
          setConfirmStatus('success')
          setTimeout(() => {
            setSelectedAppointment(null)
            fetchAppointments(searchQuery, sortBy, sortOrder, statusFilter, appointmentStatus)
            setShowConfirmDialog(false)
          }, 1500)
        } else {
          setConfirmStatus('error')
          setConfirmError(result.message)
        }
      } catch (err) {
        setConfirmStatus('error')
        setConfirmError('Failed to delete appointment')
      } finally {
        setIsConfirmLoading(false)
      }
    })
    setShowConfirmDialog(true)
  }

  const handleSendConfirmation = async () => {
    if (!selectedAppointment) return
    setIsSendingConfirmation(true)
    try {
      const result = await sendConfirmationRequest(selectedAppointment.id, {
        content: confirmationMessage || undefined,
        image: confirmationImage || undefined
      })
      if (result.success) {
        setShowConfirmationForm(false)
        setConfirmationMessage("")
        setConfirmationImage(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
        // Refresh appointment data
        const freshAppointment = await fetchAppointmentById(selectedAppointment.id)
        if (freshAppointment) {
          setSelectedAppointment(freshAppointment)
        }
      }
    } finally {
      setIsSendingConfirmation(false)
    }
  }

  // Calculate progress for an appointment
  const calculateProgress = (startTime: string, endTime: string) => {
    const now = new Date().getTime()
    const start = new Date(startTime).getTime()
    const end = new Date(endTime).getTime()
    const total = end - start
    const elapsed = now - start
    return Math.min(Math.max((elapsed / total) * 100, 0), 100)
  }

  // Update progress for in-progress appointments
  useEffect(() => {
    const interval = setInterval(() => {
      const newProgress: {[key: string]: number} = {}
      appointments.forEach(appointment => {
        if (appointment.status === 1) { // In progress
          newProgress[appointment.id] = calculateProgress(appointment.startTime, appointment.endTime)
        }
      })
      setProgress(newProgress)
    }, 1000) // Update every second

    return () => clearInterval(interval)
  }, [appointments])

  // Add this function to check if user is both coach and booker
  const isCoachAndBooker = (appointment: Appointment) => {
    const storedBasicInfo = localStorage.getItem('basicInfo')
    if (storedBasicInfo) {
      const info = JSON.parse(storedBasicInfo) as BasicInfo
      return info.role === 2 && appointment.booker.id === info.id
    }
    return false
  }

  return (
    <div className="relative bg-[#f9fafb] h-[calc(100vh-3.8rem)]">
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        style={{ top: "3.5rem" }}
      />
      <AppLeftSidebar onToggle={() => {
        const newShow = !showSidebars
        setShowSidebars(newShow)
        localStorage.setItem("sidebarShow", String(newShow))
      }} />
      
      <div className={cn(
        "p-8 h-[calc(100vh-4rem)] transition-all duration-500",
        showSidebars ? "lg:pl-72" : "lg:pl-24"
      )}>
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
                    Finished
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
                    fetchAppointments(searchQuery, "starttime", "asc", statusFilter, appointmentStatus)
                  }}>
                    Start Time (Oldest First)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    setSortBy("starttime")
                    setSortOrder("desc")
                    fetchAppointments(searchQuery, "starttime", "desc", statusFilter, appointmentStatus)
                  }}>
                    Start Time (Newest First)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    setSortBy("endtime")
                    setSortOrder("asc")
                    fetchAppointments(searchQuery, "endtime", "asc", statusFilter, appointmentStatus)
                  }}>
                    End Time (Oldest First)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    setSortBy("endtime")
                    setSortOrder("desc")
                    fetchAppointments(searchQuery, "endtime", "desc", statusFilter, appointmentStatus)
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
            <div className={cn(
              "flex flex-col h-full transition-all duration-500",
              showSidebars ? "w-[30%]" : "w-[35%]"
            )}>
              {/* Appointment Status Tabs */}
              <div className="flex gap-2 mb-4">
                <Button
                  variant={appointmentStatus === 1 ? "default" : "outline"}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2",
                    appointmentStatus === 1 
                      ? "bg-green-500 hover:bg-green-600 text-white" 
                      : "hover:bg-green-50 text-green-600 border-green-200"
                  )}
                  onClick={() => handleAppointmentStatusChange(1)}
                >
                  <CalendarClock className="h-4 w-4" />
                  Upcoming
                </Button>
                <Button
                  variant={appointmentStatus === 2 ? "default" : "outline"}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2",
                    appointmentStatus === 2 
                      ? "bg-blue-500 hover:bg-blue-600 text-white" 
                      : "hover:bg-blue-50 text-blue-600 border-blue-200"
                  )}
                  onClick={() => handleAppointmentStatusChange(2)}
                >
                  <Clock4 className="h-4 w-4" />
                  In Progress
                </Button>
                <Button
                  variant={appointmentStatus === 4 ? "default" : "outline"}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2",
                    appointmentStatus === 4 
                      ? "bg-purple-500 hover:bg-purple-600 text-white" 
                      : "hover:bg-purple-50 text-purple-600 border-purple-200"
                  )}
                  onClick={() => handleAppointmentStatusChange(4)}
                >
                  <History className="h-4 w-4" />
                  Finished
                </Button>
                <Button
                  variant={appointmentStatus === 3 ? "default" : "outline"}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2",
                    appointmentStatus === 3 
                      ? "bg-red-500 hover:bg-red-600 text-white" 
                      : "hover:bg-red-50 text-red-600 border-red-200"
                  )}
                  onClick={() => handleAppointmentStatusChange(3)}
                >
                  <History className="h-4 w-4" />
                  Expired
                </Button>
              </div>

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
                          className={`bg-white rounded-lg shadow-md p-4 cursor-pointer transition-all relative ${
                            selectedAppointment?.id === appointment.id
                              ? "border-2 border-[#de9151]"
                              : "hover:shadow-lg"
                          } ${appointment.notiCount === 0 ? "opacity-75" : ""}`}
                          onClick={() => handleAppointmentClick(appointment)}
                        >
                          <div className="flex justify-between items-center mb-1 gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <h2 className="text-lg font-semibold truncate">{appointment.name}</h2>
                              {appointment.notiCount > 0 && !viewedNotifications.has(appointment.id) && (
                                <span className="flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-red-500 rounded-full">
                                  {appointment.notiCount}
                                </span>
                              )}
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
                            <div className="flex items-center text-gray-600 text-sm col-span-2">
                              <Coins className="h-4 w-4 mr-1.5 text-[#de9151]" />
                              <span className="text-[#de9151] font-medium">{appointment.price === 0 ? 'No cost' : `$${appointment.price}`}</span>
                          </div>
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
            <div className={cn(
              "flex-1 bg-white rounded-lg shadow-xl p-6 overflow-y-auto h-full transition-all duration-500 relative",
              showSidebars ? "w-[70%]" : "w-[65%]"
            )}>
              {isLoadingDetails ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#de9151]"></div>
                </div>
              ) : selectedAppointment ? (
                <>
{appointmentStatus === 4 && (
  <div className="absolute top-0 right-0">
    <div className="relative w-40 h-40 overflow-hidden">
      {/* Premium gradient ribbon with subtle animation */}
      <div className="absolute top-0 right-0 w-56 h-56 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 transform rotate-45 translate-x-28 -translate-y-28 shadow-lg animate-gradient"></div>
      
      {/* Text container with better positioning */}
      <div className="absolute top-[22px] right-[-10px] flex items-center justify-center transform -rotate-45">
        <div className="flex flex-col items-center">
          <span className="text-white font-bold text-sm tracking-widest drop-shadow-md">FINISHED</span>
          <div className="w-12 h-0.5 bg-white/70 mt-1"></div>
        </div>
      </div>
      
      {/* Subtle shine effect */}
      <div className="absolute top-0 right-0 w-56 h-56 bg-gradient-to-t from-white/0 to-white/20 transform rotate-45 translate-x-28 -translate-y-28 animate-shine"></div>
    </div>
  </div>
)}
{/* {appointmentStatus === 4 && (
  <div className="absolute top-3 right-3 group">
    <div className="bg-white text-gray-800 px-4 py-2 rounded-lg shadow-lg border border-purple-200 flex items-center gap-2 transform transition-all hover:scale-105">
      <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      <span className="font-semibold text-sm tracking-wide text-purple-600">FINISHED</span>
    </div>
    <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full animate-ping"></div>
  </div>
)} */}
              <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center w-full justify-between gap-2">
                      <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-bold">{selectedAppointment.name}</h2>
                        {getRepeatingTypeLabel(selectedAppointment.repeatingType) && (
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            {getRepeatingTypeLabel(selectedAppointment.repeatingType)}
                          </span>
                        )}
                        {appointmentStatus === 4 && (
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                            Finished
                          </span>
                        )}
                        <div className="flex items-center gap-1.5 text-[#de9151] font-medium">
                          <Coins className="h-4 w-4" />
                          {selectedAppointment.price === 0 ? 'No cost' : `$${selectedAppointment.price}`}
                        </div>
                      </div>
                      <div className="flex gap-2 items-center">
                        {appointmentStatus === 1 && (
                          selectedAppointment.status === 4 ? (
                            <Button 
                              variant="ghost" 
                              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedAppointment.status)}`}
                              disabled
                            >
                              {getStatusText(selectedAppointment.status)}
                            </Button>
                          ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:from-gray-100 hover:to-gray-200 transition-all duration-200 cursor-pointer group">
                              <div className={`w-2 h-2 rounded-full ${
                                selectedAppointment.status === 0 ? "bg-gray-400" :
                                selectedAppointment.status === 1 ? "bg-yellow-400 animate-pulse" :
                                selectedAppointment.status === 2 ? "bg-green-400" :
                                "bg-red-400"
                              }`}></div>
                              <span className={`text-sm font-medium ${
                                selectedAppointment.status === 0 ? "text-gray-600" :
                                selectedAppointment.status === 1 ? "text-yellow-600" :
                                selectedAppointment.status === 2 ? "text-green-600" :
                                "text-red-600"
                              }`}>
                              {getStatusText(selectedAppointment.status)}
                              </span>
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400 group-hover:text-gray-600 transition-colors">
                                <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-40 p-1.5">
                            {selectedAppointment.status === 1 && (
                              <>
                                <DropdownMenuItem 
                                  onClick={() => handleStatusChange(2)}
                                  className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-green-50 hover:text-green-700 focus:bg-green-50 focus:text-green-700 transition-colors"
                                >
                                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                  Accept
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleStatusChange(3)}
                                  className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-red-50 hover:text-red-700 focus:bg-red-50 focus:text-red-700 transition-colors"
                                >
                                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                  Decline
                                </DropdownMenuItem>
                              </>
                            )}
                            {selectedAppointment.status === 2 && (
                              <DropdownMenuItem 
                                onClick={() => handleStatusChange(4)}
                                className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-red-50 hover:text-red-700 focus:bg-red-50 focus:text-red-700 transition-colors"
                              >
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                Cancel
                              </DropdownMenuItem>
                            )}
                                {selectedAppointment.status === 3 && (
                              <DropdownMenuItem 
                                onClick={() => handleStatusChange(2)}
                                className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-green-50 hover:text-green-700 focus:bg-green-50 focus:text-green-700 transition-colors"
                              >
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                Accept
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                          )
                        )}
                        {appointmentStatus === 1 && selectedAppointment.editable && (
                          <>
                            <Button variant="outline" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={handleDeleteAppointment}
                              className="hover:bg-red-50 hover:text-red-600"
                            >
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
                  

              {/* Ultra Premium Progress Bar */}
              {appointmentStatus === 2 && (() => {
                const start = new Date(selectedAppointment.startTime).getTime();
                const end = new Date(selectedAppointment.endTime).getTime();
                const now = Date.now();
                const progress = Math.max(0, Math.min(1, (now - start) / (end - start)));
                const startDate = formatLocalDate(selectedAppointment.startTime);
                const endDate = formatLocalDate(selectedAppointment.endTime);
                return (
                  <div className="w-full mb-6">
                    <div className="bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-xl border border-white/40 rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.1)] relative overflow-hidden">
                      {/* Subtle background pattern */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30 rounded-2xl"></div>
                      
                      <div className="relative z-10">
                        {/* Status header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
                              <div className="absolute inset-0 w-3 h-3 bg-blue-400 rounded-full animate-ping opacity-75"></div>
                            </div>
                            <span className="text-sm font-semibold text-gray-800">Session in Progress</span>
                          </div>
                          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                            {Math.round(progress * 100)}%
                          </div>
                        </div>
                        
                        {/* Time display */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="text-center">
                            <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Started</div>
                            <div className="text-xs font-semibold text-gray-700 bg-gray-50 px-2 py-1 rounded-lg">
                              {startDate === endDate 
                                ? formatLocalTimeOnly(selectedAppointment.startTime)
                                : formatLocalTime(selectedAppointment.startTime)
                              }
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Ends</div>
                            <div className="text-xs font-semibold text-gray-700 bg-gray-50 px-2 py-1 rounded-lg">
                              {startDate === endDate
                                ? formatLocalTimeOnly(selectedAppointment.endTime)
                                : formatLocalTime(selectedAppointment.endTime)
                              }
                            </div>
                          </div>
                        </div>
                        
                        {/* Advanced progress bar */}
                        <div className="relative mb-3">
                          <div className="w-full h-4 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded-full shadow-inner border border-gray-200/50">
                            <div
                              className="h-4 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 rounded-full transition-all duration-1000 ease-out relative overflow-hidden shadow-lg"
                              style={{ width: `${progress * 100}%` }}
                            >
                              {/* Animated gradient overlay */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse"></div>
                              {/* Moving shine effect */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent w-1/3 animate-shine-move"></div>
                            </div>
                            
                            {/* Enhanced progress indicator */}
                            <div
                              className="absolute top-1/2 -translate-y-1/2 w-5 h-5 transition-all duration-1000 ease-out"
                              style={{ left: `calc(${progress * 100}% - 10px)` }}
                            >
                              <div className="w-5 h-5 bg-white border-3 border-blue-500 rounded-full shadow-lg flex items-center justify-center">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Time remaining with icon */}
                        <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">
                            {progress < 1 
                              ? `${Math.ceil((end - now) / (1000 * 60))} min remaining`
                              : 'Session completed'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
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

                    {selectedAppointment.description && selectedAppointment.description.trim() !== '' && (
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Description</h3>
                        <p className="text-gray-600">{selectedAppointment.description}</p>
                      </div>
                    )}

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
                      </div>
                    </div>

                    {/* Confirmation Request Section */}
                    {appointmentStatus === 4 && (
                      <>
                      <div className="border-t border-gray-200 pt-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <History className="h-5 w-5 text-purple-600" />
                              <h3 className="text-lg font-semibold">Confirmation Request</h3>
                            </div>
                     
                            <div className="flex items-center gap-3">
                              {selectedAppointment?.confirmationRequest && (
                          <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${
                              selectedAppointment.confirmationRequest.status === 0 
                                      ? "bg-gray-400"
                                : selectedAppointment.confirmationRequest.status === 1
                                      ? "bg-yellow-400 animate-pulse"
                                      : selectedAppointment.confirmationRequest.status === 2
                                      ? "bg-green-400"
                                      : "bg-red-400"
                                  }`}></div>
                                  <span className={`text-sm ${
                                    selectedAppointment.confirmationRequest.status === 0 
                                      ? "text-gray-500"
                                      : selectedAppointment.confirmationRequest.status === 1
                                      ? "text-yellow-600"
                                      : selectedAppointment.confirmationRequest.status === 2
                                      ? "text-green-600"
                                      : "text-red-600"
                            }`}>
                              {selectedAppointment.confirmationRequest.status === 0 
                                      ? "None"
                                : selectedAppointment.confirmationRequest.status === 1
                                      ? "Requested"
                                      : selectedAppointment.confirmationRequest.status === 2
                                      ? "Confirmed"
                                : "Rejected"}
                            </span>
                            </div>
                          )}
                              {selectedAppointment?.confirmationRequest ? (
                                <Button
                                  variant="ghost"
                                  className="bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 text-purple-600 hover:text-purple-700 px-4 py-2 rounded-lg shadow-sm transition-all duration-200 flex items-center gap-2 hover:shadow-md"
                                  onClick={() => setShowConfirmationDetails(true)}
                                >
                                  <History className="h-4 w-4" />
                                  View Details
                                </Button>
                              ) : (
                                // Show send button if user is coach and booker
                                selectedAppointment && isCoachAndBooker(selectedAppointment) && (
                                  <Button
                                    className="bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 hover:from-purple-600 hover:via-purple-700 hover:to-purple-800 text-white px-6 py-2 rounded-lg shadow-lg transition-all duration-300 text-sm font-medium flex items-center gap-2 hover:shadow-xl hover:scale-[1.02]"
                                    onClick={() => setShowConfirmationForm(true)}
                                  >
                                    <History className="h-4 w-4" />
                                    Send Request
                                  </Button>
                                )
                              )}
                            </div>
                            </div>
                        </div>

                        {/* Confirmation Request Details Modal */}
                        {showConfirmationDetails && selectedAppointment?.confirmationRequest && (
                          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
                            <div className="bg-white rounded-2xl p-8 w-[500px] max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 animate-slideUp">
                              <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                                    <History className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Confirmation Request</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                      <div className={`w-2 h-2 rounded-full ${
                                        selectedAppointment.confirmationRequest.status === 0 
                                          ? "bg-gray-400"
                                          : selectedAppointment.confirmationRequest.status === 1
                                          ? "bg-yellow-400 animate-pulse"
                                          : selectedAppointment.confirmationRequest.status === 2
                                          ? "bg-green-400"
                                          : "bg-red-400"
                                      }`}></div>
                                      <span className={`text-sm ${
                                        selectedAppointment.confirmationRequest.status === 0 
                                          ? "text-gray-500"
                                          : selectedAppointment.confirmationRequest.status === 1
                                          ? "text-yellow-600"
                                          : selectedAppointment.confirmationRequest.status === 2
                                          ? "text-green-600"
                                          : "text-red-600"
                                      }`}>
                                        {selectedAppointment.confirmationRequest.status === 0 
                                          ? "None"
                                          : selectedAppointment.confirmationRequest.status === 1
                                          ? "Requested"
                                          : selectedAppointment.confirmationRequest.status === 2
                                          ? "Confirmed"
                                          : "Rejected"}
                                      </span>
                            </div>
                          </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setShowConfirmationDetails(false)}
                                  className="h-8 w-8 hover:bg-gray-100 rounded-full transition-all duration-200"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="space-y-6">
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                  <div className="flex items-center gap-2">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Created: {formatLocalTime(selectedAppointment.confirmationRequest.createdAt)}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Expires: {formatLocalTime(selectedAppointment.confirmationRequest.expiresdAt)}</span>
                                  </div>
                                </div>

                                {selectedAppointment.confirmationRequest.content && (
                                  <div className="animate-fadeIn">
                                    <p className="text-sm font-medium text-gray-700 mb-3">Message:</p>
                                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                                      <p className="text-gray-700 whitespace-pre-wrap">{selectedAppointment.confirmationRequest.content}</p>
                        </div>
                      </div>
                    )}

                                {selectedAppointment.confirmationRequest.img && (
                                  <div className="animate-fadeIn">
                                    <p className="text-sm font-medium text-gray-700 mb-3">Image:</p>
                                    <div className="relative group">
                                      <img 
                                        src={selectedAppointment.confirmationRequest.img} 
                                        alt="Confirmation" 
                                        className="w-full h-auto rounded-xl border shadow-sm transition-all duration-300 group-hover:shadow-lg"
                                      />
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-300 rounded-xl"></div>
                            </div>
                          </div>
                                )}

                                {/* Only show confirm button if user is seeker and not booker */}
                                {(() => {
                                  const storedBasicInfo = localStorage.getItem('basicInfo')
                                  if (storedBasicInfo) {
                                    const info = JSON.parse(storedBasicInfo) as BasicInfo
                                    return info.role === 1 && selectedAppointment.booker.id !== info.id
                                  }
                                  return false
                                })() && (
                                  <div className="animate-fadeIn">
                                    {selectedAppointment.confirmationRequest?.status === 2 ? (
                                      <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span className="font-medium">Appointment Confirmed</span>
                                      </div>
                                    ) : (
                          <Button 
                                        className="w-full bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 hover:from-purple-600 hover:via-purple-700 hover:to-purple-800 text-white px-6 py-4 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-3 text-base font-medium hover:shadow-xl hover:scale-[1.02]"
                                        onClick={async () => {
                                          if (selectedAppointment.confirmationRequest) {
                                            const result = await confirmRequest(selectedAppointment.confirmationRequest.id)
                                            if (result.success) {
                                              const updatedConfirmationRequest = {
                                                ...selectedAppointment.confirmationRequest,
                                                status: 2
                                              }
                                              setSelectedAppointment({
                                                ...selectedAppointment,
                                                confirmationRequest: updatedConfirmationRequest
                                              })
                                              getBalance()
                                              fetchAppointments(searchQuery, sortBy, sortOrder, statusFilter, appointmentStatus)
                                            }
                                          }
                                        }}
                                        disabled={selectedAppointment.confirmationRequest?.status === 2}
                          >
                                        {selectedAppointment.confirmationRequest?.status === 2 ? (
                                          <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Confirmed
                                          </>
                                        ) : (
                                          <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Confirm Request
                                          </>
                                        )}
                          </Button>
                                    )}
                                  </div>
                                )}
                              </div>
                        </div>
                      </div>
                        )}
                      </>
                    )}
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
                <Label className="mb-2 block">Price ($)</Label>
                <Input 
                  id="appointment-price" 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  placeholder="Enter price (0 for no cost)" 
                  disabled={isBooking}
                  defaultValue="0"
                />
              </div>
              <div>
                <Label className="mb-2 block">Participant</Label>
                <div className="relative" ref={participantDropdownRef}>
                  <div className="w-full flex flex-wrap items-center gap-2 rounded-md border border-input bg-white px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-[#2563eb]">
                    {selectedParticipants.map(user => (
                      <div key={user.id} className="flex items-center gap-1 bg-gray-100 rounded-full px-2 py-1 text-sm border border-gray-300">
                        <img src={user.avatar} alt={user.firstName} className="w-6 h-6 rounded-full" />
                        <span className="font-medium">{user.firstName} {user.lastName}</span>
                        <span className="text-xs text-gray-500 ml-1">{getRoleLabel(user.role)}</span>
                        <button
                          className="ml-1 text-gray-400 hover:text-red-500"
                          onClick={() => setSelectedParticipants([])}
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                    {selectedParticipants.length === 0 && (
                    <input
                      className="flex-1 min-w-[120px] outline-none border-none bg-transparent h-full"
                      placeholder="Search connected friends"
                      value={participantSearch}
                      onChange={e => setParticipantSearch(e.target.value)}
                      style={{ minWidth: 120 }}
                      disabled={isBooking}
                    />
                    )}
                  </div>
                  {participantResults.length > 0 && (
                    <div className="absolute z-10 bg-white border rounded w-full mt-1 max-h-48 overflow-y-auto shadow-lg">
                      {participantResults.map(user => (
                        <div
                          key={user.id}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            setSelectedParticipants([user])
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

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            {confirmStatus === 'idle' && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-full ${
                    confirmButtonText && typeof confirmButtonText !== 'string' && 'Delete' in (confirmButtonText as any)?.props?.children 
                      ? "bg-red-100" 
                      : "bg-[#de9151]/10"
                  } flex items-center justify-center`}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 6.66667V10M10 13.3333H10.0083M18.3333 10C18.3333 14.6024 14.6024 18.3333 10 18.3333C5.39763 18.3333 1.66667 14.6024 1.66667 10C1.66667 5.39763 5.39763 1.66667 10 1.66667C14.6024 1.66667 18.3333 5.39763 18.3333 10Z" 
                        stroke={
                          confirmButtonText && typeof confirmButtonText !== 'string' && 'Delete' in (confirmButtonText as any)?.props?.children 
                            ? "#ef4444" 
                            : "#de9151"
                        } 
                        strokeWidth="1.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {confirmButtonText && typeof confirmButtonText !== 'string' && 'Delete' in (confirmButtonText as any)?.props?.children 
                      ? "Confirm Delete" 
                      : "Confirm Action"
                    }
                  </h3>
                </div>
                <p className="text-gray-600 mb-6">{confirmMessage}</p>
                <div className="flex justify-end gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowConfirmDialog(false)}
                    className="hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button 
                    className={
                      confirmButtonText && typeof confirmButtonText !== 'string' && 'Delete' in (confirmButtonText as any)?.props?.children
                        ? "bg-red-600 hover:bg-red-700 text-white" 
                        : "bg-[#de9151] hover:bg-[#de9151]/90 text-white"
                    }
                    onClick={() => confirmAction()}
                    disabled={isConfirmLoading}
                  >
                    {confirmButtonText}
                  </Button>
                </div>
              </>
            )}

            {confirmStatus === 'loading' && (
              <div className="text-center py-4">
                <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${
                  confirmButtonText && typeof confirmButtonText !== 'string' && 'Delete' in (confirmButtonText as any)?.props?.children
                    ? "border-red-600" 
                    : "border-[#de9151]"
                } mx-auto mb-4`}></div>
                <p className="text-gray-600">
                  {confirmButtonText && typeof confirmButtonText !== 'string' && 'Delete' in (confirmButtonText as any)?.props?.children
                    ? "Deleting appointment..." 
                    : "Processing your request..."
                  }
                </p>
              </div>
            )}

            {confirmStatus === 'success' && (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 6L9 17L4 12" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-gray-600">
                  {confirmButtonText && typeof confirmButtonText !== 'string' && 'Delete' in (confirmButtonText as any)?.props?.children
                    ? "Appointment deleted successfully!" 
                    : "Action completed successfully!"
                  }
                </p>
              </div>
            )}

            {confirmStatus === 'error' && (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-red-600 mb-4">{confirmError}</p>
                <div className="flex justify-center gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowConfirmDialog(false)}
                    className="hover:bg-gray-50"
                  >
                    Close
                  </Button>
                  <Button 
                    className={
                      confirmButtonText && typeof confirmButtonText !== 'string' && 'Delete' in (confirmButtonText as any)?.props?.children
                        ? "bg-red-600 hover:bg-red-700 text-white" 
                        : "bg-[#de9151] hover:bg-[#de9151]/90 text-white"
                    }
                    onClick={() => {
                      setConfirmStatus('idle')
                      setConfirmError("")
                    }}
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Request Form Modal */}
      {showConfirmationForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-[500px] max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <History className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Send Confirmation Request</h2>
                  <p className="text-sm text-gray-500">Verify the completion of this appointment</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowConfirmationForm(false)}
                className="h-8 w-8 hover:bg-gray-100"
                disabled={isSendingConfirmation}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-6">
              <div className="relative">
                <Label className="mb-2 block text-sm font-medium text-gray-700">Message (Optional)</Label>
                <Textarea 
                  placeholder="Add a message to your confirmation request..." 
                  value={confirmationMessage}
                  onChange={(e) => setConfirmationMessage(e.target.value)}
                  disabled={isSendingConfirmation}
                  className="min-h-[120px] resize-none border-gray-200 focus:border-purple-500 focus:ring-purple-500/20"
                />
                <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                  {confirmationMessage.length}/500
                </div>
              </div>

              <div className="space-y-2">
                <Label className="block text-sm font-medium text-gray-700">Image (Optional)</Label>
                <div className="relative">
                  <Input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) setConfirmationImage(file)
                    }}
                    disabled={isSendingConfirmation}
                    className="hidden"
                    id="confirmation-image"
                  />
                  <label
                    htmlFor="confirmation-image"
                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors
                      ${confirmationImage 
                        ? 'border-purple-200 bg-purple-50' 
                        : 'border-gray-200 hover:border-purple-200 hover:bg-gray-50'
                      }`}
                  >
                    {confirmationImage ? (
                      <div className="relative w-full h-full">
                        <img
                          src={URL.createObjectURL(confirmationImage)}
                          alt="Preview"
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setConfirmationImage(null)
                            if (fileInputRef.current) fileInputRef.current.value = ""
                          }}
                          className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-sm hover:bg-gray-100"
                        >
                          <X className="h-4 w-4 text-gray-500" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-8 h-8 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-medium">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG or GIF (max. 2MB)</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmationForm(false)}
                  disabled={isSendingConfirmation}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button 
                  className="bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 hover:from-purple-600 hover:via-purple-700 hover:to-purple-800 text-white px-6 py-2 rounded-lg shadow-sm transition-all duration-300 text-sm font-medium"
                  onClick={handleSendConfirmation}
                  disabled={isSendingConfirmation}
                >
                  {isSendingConfirmation ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sending...
                    </div>
                  ) : (
                    "Send Request"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add the confirmation request form modal */}
      {showConfirmationRequestForm && selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Send Confirmation Request</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowConfirmationRequestForm(false)}
                className="h-8 w-8 hover:bg-slate-100 rounded-lg"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-1 block">Message</Label>
                <Textarea
                  value={confirmationMessage}
                  onChange={(e) => setConfirmationMessage(e.target.value)}
                  placeholder="Enter your confirmation message..."
                  className="min-h-[100px] resize-none"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-700 mb-1 block">Image (Optional)</Label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-200 border-dashed rounded-lg">
                  <div className="space-y-1 text-center">
                    {confirmationImage ? (
                      <div className="relative">
                        <img
                          src={URL.createObjectURL(confirmationImage)}
                          alt="Preview"
                          className="mx-auto h-32 w-32 object-cover rounded-lg"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setConfirmationImage(null)}
                          className="absolute -top-2 -right-2 h-6 w-6 bg-white rounded-full shadow-sm"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex text-sm text-slate-600">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer rounded-md font-medium text-[#de9151] hover:text-[#de9151]/90"
                          >
                            <span>Upload a file</span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) setConfirmationImage(file)
                              }}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-slate-500">PNG, JPG, GIF up to 10MB</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmationRequestForm(false)}
                  className="border-slate-200"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendConfirmation}
                  className="bg-[#de9151] hover:bg-[#de9151]/90 text-white"
                  disabled={isSendingConfirmation || !confirmationMessage.trim()}
                >
                  {isSendingConfirmation ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Sending...
                    </div>
                  ) : (
                    "Send Request"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 