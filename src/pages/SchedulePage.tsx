import { useState, useRef, useEffect, useCallback } from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek, addDays, isSameDay, setHours, setMinutes } from "date-fns"
import { formatInTimeZone } from "date-fns-tz"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useScheduleStore, Event } from "@/store/ScheduleStore"
import { AppLeftSidebar } from "@/components/layout/AppLeftSidebar"
import { cn } from "@/lib/utils"
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Grid,
  Search,
  Filter,
  Plus,
  X,
  MapPin,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  Users
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type ViewType = 'day' | 'week' | 'month'

export function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewType, setViewType] = useState<ViewType>('week')
  const [searchQuery, setSearchQuery] = useState("")
  const [zoomLevel, setZoomLevel] = useState(1)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const { events, fetchEvents, fetchAppointmentById, selectedAppointment } = useScheduleStore()
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 })
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [showSidebars, setShowSidebars] = useState(() => {
    const sidebarState = localStorage.getItem("sidebarShow")
    return sidebarState === null ? true : sidebarState === "true"
  })

  const calendarRef = useRef<HTMLDivElement>(null)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const monthFirstDayOffset = monthStart.getDay()
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const weekStart = startOfWeek(currentDate)
  const weekEnd = endOfWeek(currentDate)
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })
  const weekDayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Generate time slots from 00:00 to 23:00
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const date = new Date()
    return setHours(setMinutes(date, 0), i)
  })

  const formatLocalTime = (time: string) => {
    return formatInTimeZone(new Date(time), 'UTC', 'HH:mm')
  }

  const getViewTitle = () => {
    switch (viewType) {
      case 'day':
        return format(currentDate, 'EEEE, MMMM d, yyyy')
      case 'week':
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
      case 'month':
        return format(currentDate, 'MMMM yyyy')
    }
  }

  const previousPeriod = () => {
    switch (viewType) {
      case 'day':
        setCurrentDate(addDays(currentDate, -1))
        break
      case 'week':
        setCurrentDate(addDays(currentDate, -7))
        break
      case 'month':
        setCurrentDate(addDays(currentDate, -30))
        break
    }
  }

  const nextPeriod = () => {
    switch (viewType) {
      case 'day':
        setCurrentDate(addDays(currentDate, 1))
        break
      case 'week':
        setCurrentDate(addDays(currentDate, 7))
        break
      case 'month':
        setCurrentDate(addDays(currentDate, 30))
        break
    }
  }

  const handleZoomIn = () => {
    if (zoomLevel < 2) {
      setZoomLevel(prev => prev + 0.1)
    }
  }

  const handleZoomOut = () => {
    if (zoomLevel > 0.5) {
      setZoomLevel(prev => prev - 0.1)
    }
  }

  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey && calendarRef.current && calendarRef.current.contains(e.target as Node)) {
      e.preventDefault()
      if (e.deltaY < 0) handleZoomIn()
      else if (e.deltaY > 0) handleZoomOut()
    }
  }, [handleZoomIn, handleZoomOut])

  useEffect(() => {
    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  const getOverlappingEvents = useCallback((events: Event[], timeSlot: Date) => {
    const slotStart = timeSlot
    const slotEnd = new Date(timeSlot.getTime() + 60 * 60 * 1000)

    const overlappingEvents = events.filter(event => {
      const eventStart = new Date(event.startTime)
      const eventEnd = new Date(event.endTime)
      return (
        (eventStart >= slotStart && eventStart < slotEnd) ||
        (eventEnd > slotStart && eventEnd <= slotEnd) ||
        (eventStart <= slotStart && eventEnd >= slotEnd)
      )
    })

    // Group overlapping events
    const groups: Event[][] = []
    overlappingEvents.forEach(event => {
      const eventStart = new Date(event.startTime)
      let addedToGroup = false

      for (const group of groups) {
        const lastEvent = group[group.length - 1]
        const lastEventEnd = new Date(lastEvent.endTime)
        if (eventStart <= lastEventEnd) {
          group.push(event)
          addedToGroup = true
          break
        }
      }

      if (!addedToGroup) {
        groups.push([event])
      }
    })

    return groups
  }, [])

  const handleEventClick = async (event: Event, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setModalPosition({ x: rect.left, y: rect.top })
    setIsModalVisible(true)
    setIsLoadingDetails(true)
    await fetchAppointmentById(event.id)
    setIsLoadingDetails(false)
  }

  useEffect(() => {
    const startDate = format(viewType === 'month' ? monthStart : viewType === 'week' ? weekStart : currentDate, 'yyyy-MM-dd')
    const endDate = format(viewType === 'month' ? monthEnd : viewType === 'week' ? weekEnd : currentDate, 'yyyy-MM-dd')
    
    // Debounce the search query to prevent too many API calls
    const timeoutId = setTimeout(() => {
      fetchEvents({
        startDate,
        endDate,
        eventSearch: searchQuery || undefined
      })
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [currentDate, viewType, searchQuery, fetchEvents])

  const renderEvent = useCallback((event: Event) => {
    return (
      <div
        key={event.id}
        className="text-xs p-1 rounded truncate cursor-pointer hover:bg-gray-50"
        style={{ backgroundColor: event.color }}
        onClick={(e) => {
          e.stopPropagation()
          handleEventClick(event, e)
        }}
      >
        <div className="font-medium text-white">{event.title}</div>
        <div className="text-white/80 text-[10px]">
          {formatLocalTime(event.startTime)} - {formatLocalTime(event.endTime)}
        </div>
      </div>
    )
  }, [handleEventClick])

  return (
    <div className="relative bg-[#f9fafb] h-[calc(100vh-3.8rem)]">
      <AppLeftSidebar onToggle={() => {
        const newShow = !showSidebars
        setShowSidebars(newShow)
        localStorage.setItem("sidebarShow", String(newShow))
      }} />
      
      <div className={cn(
        "p-8 h-[calc(100vh-4rem)] transition-all duration-500",
        showSidebars ? "lg:pl-72" : "lg:pl-24"
      )}>
        <div className="flex h-full">
          {/* Mini Schedule Sidebar */}
          <aside className="w-72 min-w-[220px] max-w-[300px] h-fit bg-white rounded-2xl shadow-xl p-6 flex flex-col gap-8 items-center mr-8 relative overflow-visible mt-6">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#de9151] opacity-20 rounded-full blur-2xl z-0" />
            <div className="relative z-10 flex flex-col gap-8 w-full">
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#de9151]" />
                  Schedule
                </h2>
                <div className="flex items-center bg-gray-50 rounded-lg px-3 py-2 mb-4">
                  <Search className="h-4 w-4 text-gray-400 mr-2" />
                  <Input
                    className="bg-transparent border-none text-gray-800 placeholder:text-gray-400 focus:ring-0 focus:border-none"
                    placeholder="Search for people"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <nav className="space-y-1">
                  <button className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors bg-[#de9151]/10 text-[#de9151]">
                    <Calendar className="w-5 h-5 mr-3" />
                    Calendar
                  </button>
                  <button className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors text-gray-600 hover:bg-gray-50">
                    <Users className="w-5 h-5 mr-3" />
                    People
                  </button>
                </nav>
              </div>
              <div>
                <div className="flex items-center justify-between text-gray-800 mb-2 px-2">
                  <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addDays(currentDate, -30))} className="hover:bg-gray-100">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="font-semibold text-sm">{format(currentDate, 'MMMM yyyy')}</span>
                  <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addDays(currentDate, 30))} className="hover:bg-gray-100">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-7 text-[10px] text-gray-400 mb-1 px-2">
                  {weekDayHeaders.map((d) => (
                    <div key={d} className="text-center">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 px-2">
                  {Array.from({ length: monthFirstDayOffset }).map((_, i) => (
                    <div key={i} />
                  ))}
                  {days.map((day, idx) => {
                    const isCurrent = isToday(day)
                    const isSelected = isSameDay(day, selectedDate)
                    const dayEvents = events[format(day, 'yyyy-MM-dd')] || []
                    const hasEvents = dayEvents.length > 0
                    
                    return (
                      <button
                        key={idx}
                        className={`rounded-full w-7 h-7 flex items-center justify-center transition-colors text-xs relative
                          ${isSelected ? 'bg-[#de9151] text-white' : isCurrent ? 'border border-gray-300 text-gray-800 bg-gray-50' : 'text-gray-700 hover:bg-gray-100'}
                        `}
                        onClick={() => {
                          setSelectedDate(day)
                          setCurrentDate(day)
                        }}
                      >
                        {format(day, 'd')}
                        {hasEvents && (
                          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-[#de9151]" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </aside>

          {/* Main calendar area */}
          <div className="flex-1 flex flex-col h-full" ref={calendarRef}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={previousPeriod}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-2xl font-semibold">{getViewTitle()}</h2>
                <Button variant="outline" size="icon" onClick={nextPeriod}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
                  Today
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search events..."
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
                    <DropdownMenuItem>All Events</DropdownMenuItem>
                    <DropdownMenuItem>Appointments</DropdownMenuItem>
                    <DropdownMenuItem>Workouts</DropdownMenuItem>
                    <DropdownMenuItem>Personal</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="flex items-center border rounded-lg overflow-hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2 bg-white">
                        {viewType === 'day' && <Calendar className="h-4 w-4" />}
                        {viewType === 'week' && <Clock className="h-4 w-4" />}
                        {viewType === 'month' && <Grid className="h-4 w-4" />}
                        {viewType === 'day' ? 'Day' : viewType === 'week' ? 'Week' : 'Month'}
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setViewType('day')} className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Day
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setViewType('week')} className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Week
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setViewType('month')} className="flex items-center gap-2">
                        <Grid className="h-4 w-4" />
                        Month
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center border rounded-lg overflow-hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleZoomOut}
                    disabled={zoomLevel <= 0.5}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleZoomIn}
                    disabled={zoomLevel >= 2}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>

                <Button 
                  variant="default" 
                  className="bg-[#de9151] hover:bg-[#de9151]/90 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Event
                </Button>
              </div>
            </div>

            <div className="flex-1 bg-white rounded-lg shadow-xl overflow-hidden">
              {viewType === 'month' && (
                <div className="h-full overflow-auto">
                  <div className="grid grid-cols-7 border-b sticky top-0 bg-white z-10">
                    {weekDayHeaders.map(day => (
                      <div key={day} className="p-4 text-center font-semibold text-gray-600">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div
                    className="grid grid-cols-7 grid-rows-6 min-h-[calc(100%-3.5rem)]"
                    style={{ fontSize: `${zoomLevel * 1}rem` }}
                  >
                    {Array.from({ length: monthFirstDayOffset }).map((_, i) => (
                      <div key={"empty-" + i} />
                    ))}
                    {days.map((day, index) => {
                      const isCurrentMonth = isSameMonth(day, currentDate)
                      const isCurrentDay = isToday(day)
                      const dayEvents = events[format(day, 'yyyy-MM-dd')] || []
                      
                      return (
                        <div
                          key={index}
                          className={`border p-2`}
                          style={{ minHeight: `${zoomLevel * 120}px` }}
                          onClick={() => setSelectedDate(day)}
                        >
                          <div className={`text-sm ${isCurrentDay ? 'bg-[#de9151] text-white rounded-full w-6 h-6 flex items-center justify-center' : ''} ${!isCurrentMonth ? 'text-gray-400' : ''}`}>
                            {format(day, 'd')}
                          </div>
                          <div className="mt-2 space-y-1">
                            {dayEvents.map(renderEvent)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {viewType === 'week' && (
                <div className="h-full flex overflow-auto">
                  <div className="min-w-fit w-auto border-r sticky left-0 bg-white z-20">
                    <div className="h-12 border-b sticky top-0 bg-white z-30"></div>
                    <div className="relative">
                      {timeSlots.map((time, index) => (
                        <div key={index} className="h-12 border-b text-sm text-gray-500 p-2 text-right pr-4">
                          {format(time, 'HH:mm')}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 grid grid-cols-7" style={{ minWidth: `${zoomLevel * 100}%` }}>
                    {weekDays.map((day, index) => {
                      const isCurrentDay = isToday(day)
                      const isSelected = isSameDay(day, selectedDate)
                      const dayEvents = events[format(day, 'yyyy-MM-dd')] || []
                      
                      let nowLine = null
                      if (isCurrentDay) {
                        const now = new Date()
                        const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes()
                        const totalDayMinutes = 24 * 60
                        const percent = (minutesSinceMidnight / totalDayMinutes) * 100
                        nowLine = (
                          <div
                            style={{
                              position: 'absolute',
                              top: `calc(${percent}% + 3rem)`,
                              left: 0,
                              right: 0,
                              height: '2px',
                              background: '#de9151',
                              zIndex: 30,
                            }}
                          />
                        )
                      }

                      return (
                        <div
                          key={index}
                          className={`border-r ${isSelected ? 'bg-[#de9151]/5' : ''} relative`}
                          onClick={() => setSelectedDate(day)}
                        >
                          <div className={`h-12 border-b p-2 text-center sticky top-0 bg-white z-10`}>
                            <div className="text-sm font-medium">
                              {format(day, 'EEE')}
                            </div>
                            <div className="text-sm">
                              {format(day, 'd')}
                            </div>
                          </div>
                          <div className="relative" style={{height: 'calc(24 * 3rem)'}}>
                            {nowLine}
                            {timeSlots.map((timeSlot, timeIndex) => {
                              const eventGroups = getOverlappingEvents(dayEvents, timeSlot)
                              
                              return (
                                <div key={timeIndex} className="h-12 border-b border-dashed border-gray-200 relative">
                                  {eventGroups.map((group) => {
                                    return group.map((event, eventIndex) => {
                                      const eventStart = new Date(event.startTime)
                                      const eventEnd = new Date(event.endTime)
                                      const startMinutes = eventStart.getHours() * 60 + eventStart.getMinutes()
                                      const endMinutes = eventEnd.getHours() * 60 + eventEnd.getMinutes()
                                      const top = ((startMinutes % 60) / 60) * 100
                                      const height = ((endMinutes - startMinutes) / 60) * 100
                                      const groupWidth = 100 / group.length
                                      const left = groupWidth * eventIndex
                                      
                                      return (
                                        <div
                                          key={event.id}
                                          className="absolute rounded-md px-2 py-1.5 text-xs truncate shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                                          style={{
                                            top: `${top}%`,
                                            height: `${height}%`,
                                            left: `${left}%`,
                                            width: `${groupWidth - 2}%`,
                                            backgroundColor: event.color,
                                            color: '#fff',
                                            zIndex: 20,
                                            opacity: 0.95,
                                            borderLeft: '3px solid rgba(255, 255, 255, 0.5)',
                                            backdropFilter: 'blur(2px)'
                                          }}
                                          onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            handleEventClick(event, e)
                                          }}
                                        >
                                          <div className="font-semibold text-[11px] leading-tight">{event.title}</div>
                                          <div className="text-[10px] opacity-90 mt-0.5">
                                            {formatLocalTime(event.startTime)} - {formatLocalTime(event.endTime)}
                                          </div>
                                        </div>
                                      )
                                    })
                                  })}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {viewType === 'day' && (
                <div className="h-full flex overflow-auto">
                  <div className="w-24 border-r sticky left-0 bg-white z-20">
                    <div className="h-12 border-b sticky top-0 bg-white z-30"></div>
                    <div className="relative">
                      {timeSlots.map((time, index) => (
                        <div key={index} className="h-12 border-b text-sm text-gray-500 p-2">
                          {format(time, 'HH:mm')}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1" style={{ minWidth: `${zoomLevel * 100}%` }}>
                    <div className="h-12 border-b p-2 text-center sticky top-0 bg-white z-10">
                      <div className="text-lg font-medium">
                        {format(currentDate, 'EEEE, MMMM d, yyyy')}
                      </div>
                    </div>
                    <div className="relative">
                      {timeSlots.map((timeSlot, index) => {
                        const dayEvents = events[format(currentDate, 'yyyy-MM-dd')] || []
                        const eventGroups = getOverlappingEvents(dayEvents, timeSlot)
                        
                        return (
                          <div key={index} className="h-12 border-b border-dashed border-gray-200 relative">
                            {eventGroups.map((group) => {
                              return group.map((event, eventIndex) => {
                                const eventStart = new Date(event.startTime)
                                const eventEnd = new Date(event.endTime)
                                const startMinutes = eventStart.getHours() * 60 + eventStart.getMinutes()
                                const endMinutes = eventEnd.getHours() * 60 + eventEnd.getMinutes()
                                const top = ((startMinutes % 60) / 60) * 100
                                const height = ((endMinutes - startMinutes) / 60) * 100
                                const groupWidth = 100 / group.length
                                const left = groupWidth * eventIndex
                                
                                return (
                                  <div
                                    key={event.id}
                                    className="absolute rounded-md px-2 py-1.5 text-xs truncate shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                                    style={{
                                      top: `${top}%`,
                                      height: `${height}%`,
                                      left: `${left}%`,
                                      width: `${groupWidth - 2}%`,
                                      backgroundColor: event.color,
                                      color: '#fff',
                                      zIndex: 20,
                                      opacity: 0.95,
                                      borderLeft: '3px solid rgba(255, 255, 255, 0.5)',
                                      backdropFilter: 'blur(2px)'
                                    }}
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      handleEventClick(event, e)
                                    }}
                                  >
                                    <div className="font-semibold text-[11px] leading-tight">{event.title}</div>
                                    <div className="text-[10px] opacity-90 mt-0.5">
                                      {formatLocalTime(event.startTime)} - {formatLocalTime(event.endTime)}
                                    </div>
                                  </div>
                                )
                              })
                            })}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Appointment Details Modal */}
        {selectedAppointment && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-start justify-start z-50 transition-opacity duration-200"
            style={{ opacity: isModalVisible ? 1 : 0 }}
            onClick={() => {
              setIsModalVisible(false)
              setTimeout(() => useScheduleStore.setState({ selectedAppointment: null }), 300)
            }}
          >
            <div 
              className={`bg-white rounded-lg p-6 w-[400px] max-h-[calc(100vh-40px)] overflow-y-auto shadow-xl transform transition-all duration-300 ease-out ${
                isModalVisible 
                  ? 'opacity-100 scale-100 translate-y-0' 
                  : 'opacity-0 scale-95 -translate-y-4'
              }`}
              style={{
                position: 'absolute',
                left: `${modalPosition.x}px`,
                top: `${modalPosition.y}px`,
                transformOrigin: 'top left',
                willChange: 'transform, opacity',
                maxHeight: 'calc(100vh - 40px)', // Ensure 20px margin from top and bottom
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-2">
                <h2 className="text-xl font-semibold">{selectedAppointment.name}</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setIsModalVisible(false)
                    setTimeout(() => useScheduleStore.setState({ selectedAppointment: null }), 300)
                  }}
                  className="h-8 w-8 hover:bg-gray-100 transition-colors duration-200"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {isLoadingDetails ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#de9151]"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="animate-slideIn" style={{ animationDelay: '100ms' }}>
                    <h3 className="text-lg font-semibold mb-2">Description</h3>
                    <p className="text-gray-600">{selectedAppointment.description || 'No description'}</p>
                  </div>

                  <div className="animate-slideIn" style={{ animationDelay: '200ms' }}>
                    <h3 className="text-lg font-semibold mb-2">Booker</h3>
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedAppointment.booker.avatar}
                        alt={`${selectedAppointment.booker.firstName} ${selectedAppointment.booker.lastName}`}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {selectedAppointment.booker.firstName} {selectedAppointment.booker.lastName}
                        </span>
                        <span className="text-sm text-gray-500">{selectedAppointment.booker.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="animate-slideIn" style={{ animationDelay: '300ms' }}>
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

                  <div className="animate-slideIn" style={{ animationDelay: '400ms' }}>
                    <h3 className="text-lg font-semibold mb-2">Schedule</h3>
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
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 