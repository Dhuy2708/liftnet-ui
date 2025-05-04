import { MapPin, Users, Calendar, Clock, Search, Filter, ArrowUpDown, Edit, Trash2 } from "lucide-react"
import { format } from "date-fns"
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
}

const mockAppointments: Appointment[] = [
  {
    id: "602ebf77-a4be-47a9-806f-1c46a597f01c",
    editable: true,
    booker: {
      id: "3d2452f0-66b6-4731-938c-a01dd4e52584",
      email: "vodinhhuy2708@gmail.com",
      username: "vodinhhuy2708@gmail.com",
      firstName: "Vo",
      lastName: "Huy",
      role: 0,
      avatar: "https://res.cloudinary.com/dvwgt4tm1/image/upload/v1730031850/360_F_549983970_bRCkYfk0P6PP5fKbMhZMIb07mCJ6esXL_t9czwt.jpg",
      isDeleted: false,
      isSuspended: false
    },
    otherParticipants: [
      {
        id: "04d660c2-9193-4f80-aeb8-a9abaec58d6d",
        email: "minhtridn03@gmail.com",
        username: "minhtri03",
        firstName: "Minh Tri",
        lastName: "Tran",
        role: 0,
        avatar: "https://res.cloudinary.com/dvwgt4tm1/image/upload/v1730031850/360_F_549983970_bRCkYfk0P6PP5fKbMhZMIb07mCJ6esXL_t9czwt.jpg",
        isDeleted: false,
        isSuspended: false
      }
    ],
    name: "Leg Workout Session",
    description: "Intensive leg workout focusing on form and technique",
    location: {
      placeName: "300 Hải Phòng",
      placeId: "e3dt9qzerSVJgEMHmAvl2nnYRzGgfYLYf5BHlp9srBiyfzTXtG6B1a-_UyKoQ7DkeIYwJ5FXqSd_v0v-sFKSGnSEZlu1fZ3Ve75IXJ5unvId6hFsIqAiOf3msUyOenuUJ",
      latitude: 16.069239098000025,
      longitude: 108.20510677800007,
      formattedAddress: "300 Hải Phòng, Tân Chính, Thanh Khê, Đà Nẵng"
    },
    startTime: "2024-04-15T09:00:00.000",
    endTime: "2024-04-15T10:30:00.000",
    status: 1,
    repeatingType: 0,
    created: "2024-04-08T22:20:45.3169238",
    modified: "2024-04-08T22:20:45.6674901"
  },
  {
    id: "796d0ee0-a657-4fd0-b172-b076b1eb008e",
    editable: false,
    booker: {
      id: "3d2452f0-66b6-4731-938c-a01dd4e52585",
      email: "trainer@example.com",
      username: "trainer@example.com",
      firstName: "John",
      lastName: "Smith",
      role: 2,
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      isDeleted: false,
      isSuspended: false
    },
    otherParticipants: [],
    name: "Personal Training Session",
    description: "One-on-one training focusing on strength and conditioning",
    location: {
      placeName: "Fitness Center",
      placeId: "fitness_center_123",
      latitude: 16.069239098000025,
      longitude: 108.20510677800007,
      formattedAddress: "123 Fitness Street, Đà Nẵng"
    },
    startTime: "2024-04-16T14:00:00.000",
    endTime: "2024-04-16T15:00:00.000",
    status: 0,
    repeatingType: 0,
    created: "2024-04-09T10:20:45.3169238",
    modified: "2024-04-09T10:20:45.6674901"
  }
]

export function AppointmentsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<"date" | "name">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [hoveredBookerId, setHoveredBookerId] = useState<string | null>(null)
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null)
  const navigate = useNavigate()
  const { appointmentId } = useParams<{ appointmentId?: string }>()

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0:
        return "bg-yellow-100 text-yellow-800"
      case 1:
        return "bg-green-100 text-green-800"
      case 2:
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: number) => {
    switch (status) {
      case 0:
        return "Pending"
      case 1:
        return "Confirmed"
      case 2:
        return "Cancelled"
      default:
        return "Unknown"
    }
  }

  const getRoleText = (role: number) => {
    if (role === 1) return "Seeker"
    if (role === 2) return "Personal Trainer"
    return "User"
  }

  const filteredAppointments = mockAppointments
    .filter((appointment) => {
      const matchesSearch = appointment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        appointment.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        appointment.location.formattedAddress.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === null || appointment.status === statusFilter
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return sortOrder === "asc"
          ? new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          : new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      } else {
        return sortOrder === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name)
      }
    })

  // Select appointment by URL param
  useEffect(() => {
    if (appointmentId && filteredAppointments.length > 0) {
      const found = filteredAppointments.find(a => a.id === appointmentId)
      if (found) setSelectedAppointment(found)
    }
  }, [appointmentId, filteredAppointments])

  return (
    <div className="p-8 h-[calc(100vh-4rem)]">
      <div className="flex flex-col h-full">
        {/* Filters at the top, full width */}
        <div className="flex items-center gap-2 mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search appointments..."
              className="pl-10 w-56"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setStatusFilter(null)}>
                All Statuses
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter(0)}>
                Pending
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter(1)}>
                Confirmed
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter(2)}>
                Cancelled
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => {
                setSortBy("date")
                setSortOrder("asc")
              }}>
                Date (Oldest First)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setSortBy("date")
                setSortOrder("desc")
              }}>
                Date (Newest First)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setSortBy("name")
                setSortOrder("asc")
              }}>
                Name (A-Z)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setSortBy("name")
                setSortOrder("desc")
              }}>
                Name (Z-A)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {/* Content Section - Split View */}
        <div className="flex flex-1 gap-3 min-h-0">
          {/* Left Side - List */}
          <div className="w-[30%] flex flex-col h-full">
            <div className="flex-1 overflow-y-auto pr-2">
              {filteredAppointments.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                  <p className="text-gray-500">No appointments found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className={`bg-white rounded-lg shadow-md p-4 cursor-pointer transition-all ${
                        selectedAppointment?.id === appointment.id
                          ? "border-2 border-[#de9151]"
                          : "hover:shadow-lg"
                      }`}
                      onClick={() => {
                        setSelectedAppointment(appointment)
                        navigate(`/appointments/${appointment.id}`)
                      }}
                    >
                      <div className="flex justify-between items-center mb-1 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <h2 className="text-lg font-semibold truncate">{appointment.name}</h2>
                          <div
                            className="relative flex items-center group"
                            onMouseEnter={() => {
                              hoverTimeout.current = setTimeout(() => {
                                setHoveredBookerId(appointment.booker.id)
                              }, 300)
                            }}
                            onMouseLeave={() => {
                              if (hoverTimeout.current) clearTimeout(hoverTimeout.current)
                              setHoveredBookerId(null)
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
                            {hoveredBookerId === appointment.booker.id && (
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
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                          {getStatusText(appointment.status)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div className="flex items-center text-gray-600 text-sm">
                          <MapPin className="h-4 w-4 mr-1.5" />
                          <span className="truncate">{appointment.location.formattedAddress}</span>
                        </div>
                        <div className="flex items-center text-gray-600 text-sm">
                          <Users className="h-4 w-4 mr-1.5" />
                          <span>{appointment.otherParticipants.length + 1} participants</span>
                        </div>
                        <div className="flex items-center text-gray-600 text-sm">
                          <Calendar className="h-4 w-4 mr-1.5" />
                          <span>{format(new Date(appointment.startTime), "MMM d, yyyy")}</span>
                        </div>
                        <div className="flex items-center text-gray-600 text-sm">
                          <Clock className="h-4 w-4 mr-1.5" />
                          <span>
                            {format(new Date(appointment.startTime), "h:mm a")} -{" "}
                            {format(new Date(appointment.endTime), "h:mm a")}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Details */}
          <div className="flex-1 bg-white rounded-lg shadow-lg p-6 overflow-y-auto h-full">
            {selectedAppointment ? (
              <>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center w-full justify-between gap-2">
                    <div className="flex items-center gap-4">
                      <h2 className="text-2xl font-bold">{selectedAppointment.name}</h2>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedAppointment.status)}`}>
                        {getStatusText(selectedAppointment.status)}
                      </span>
                    </div>
                    <div className="flex gap-2">
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
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Description</h3>
                    <p className="text-gray-600">{selectedAppointment.description}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Location</h3>
                    <div className="flex items-center text-gray-600 mb-2">
                      <MapPin className="h-5 w-5 mr-2" />
                      <span>{selectedAppointment.location.formattedAddress}</span>
                    </div>
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
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Schedule</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Start Time</p>
                        <p className="text-gray-600">
                          {format(new Date(selectedAppointment.startTime), "MMM d, yyyy h:mm a")}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">End Time</p>
                        <p className="text-gray-600">
                          {format(new Date(selectedAppointment.endTime), "MMM d, yyyy h:mm a")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Participants</h3>
                    <div className="space-y-4">
                      {[{...selectedAppointment.booker, roleLabel: 'Booker'}, ...selectedAppointment.otherParticipants.map(p => ({...p, roleLabel: 'Participant'}))].map((user) => (
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
                              <span className="text-xs text-gray-400">{user.role === 1 ? 'Seeker' : user.role === 2 ? 'Personal Trainer' : user.roleLabel || 'User'}</span>
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
  )
} 