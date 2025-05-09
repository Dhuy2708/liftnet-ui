import { useState, useRef, useEffect } from "react"
import { ChevronLeft, ChevronRight, Calendar, Clock, Grid, Plus, Filter, Search, ZoomIn, ZoomOut, ChevronDown, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addDays, startOfWeek, endOfWeek, setHours, setMinutes, subMonths, addMonths } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"

type ViewType = 'day' | 'week' | 'month'

export function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewType, setViewType] = useState<ViewType>('month')
  const [searchQuery, setSearchQuery] = useState("")
  const [zoomLevel, setZoomLevel] = useState(1)
  const [sidebarMonth, setSidebarMonth] = useState(new Date())
  const [sidebarSelected, setSidebarSelected] = useState(new Date())
  const [peopleSearch, setPeopleSearch] = useState("")

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  // Generate time slots from 00:00 to 23:00
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const date = new Date()
    return setMinutes(setHours(date, i), 0)
  })

  // Sidebar calendar logic
  const sidebarMonthStart = startOfMonth(sidebarMonth)
  const sidebarMonthEnd = endOfMonth(sidebarMonth)
  const sidebarDays = eachDayOfInterval({ start: sidebarMonthStart, end: sidebarMonthEnd })
  const sidebarWeekDayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  const sidebarFirstDayOffset = sidebarMonthStart.getDay()

  const monthFirstDayOffset = (monthStart.getDay() + 6) % 7 // 0=Mon, 6=Sun

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 2))
  }

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5))
  }

  const previousPeriod = () => {
    if (viewType === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
    } else if (viewType === 'week') {
      setCurrentDate(addDays(currentDate, -7))
    } else {
      setCurrentDate(addDays(currentDate, -1))
    }
  }

  const nextPeriod = () => {
    if (viewType === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
    } else if (viewType === 'week') {
      setCurrentDate(addDays(currentDate, 7))
    } else {
      setCurrentDate(addDays(currentDate, 1))
    }
  }

  const getViewTitle = () => {
    switch (viewType) {
      case 'month':
        return format(currentDate, 'MMMM yyyy')
      case 'week':
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
      case 'day':
        return format(currentDate, 'MMMM d, yyyy')
      default:
        return format(currentDate, 'MMMM yyyy')
    }
  }

  const weekDayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const calendarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey && calendarRef.current && calendarRef.current.contains(e.target as Node)) {
        e.preventDefault()
        if (e.deltaY < 0) handleZoomIn()
        else if (e.deltaY > 0) handleZoomOut()
      }
    }
    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [])

  return (
    <div className="p-8 h-[calc(100vh-4rem)]">
      <div className="flex h-full">
        {/* Sidebar */}
        <aside className="w-[16%] min-w-[200px] max-w-[250px] bg-white rounded-xl p-4 flex flex-col items-center mr-4 shadow-md border border-gray-200">
          <div className="w-full mb-4">
            <div className="flex items-center bg-gray-50 rounded-lg px-3 py-2">
              <User className="h-4 w-4 text-gray-400 mr-2" />
              <Input
                className="bg-transparent border-none text-gray-800 placeholder:text-gray-400 focus:ring-0 focus:border-none"
                placeholder="Search for people"
                value={peopleSearch}
                onChange={e => setPeopleSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="w-full mb-4">
            <div className="flex items-center justify-between text-gray-800 mb-2 px-2">
              <Button variant="ghost" size="icon" onClick={() => setSidebarMonth(subMonths(sidebarMonth, 1))} className="hover:bg-gray-100">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-semibold text-sm">{format(sidebarMonth, 'MMMM yyyy')}</span>
              <Button variant="ghost" size="icon" onClick={() => setSidebarMonth(addMonths(sidebarMonth, 1))} className="hover:bg-gray-100">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-7 text-[10px] text-gray-400 mb-1 px-2">
              {sidebarWeekDayHeaders.map((d) => (
                <div key={d} className="text-center">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 px-2">
              {Array.from({ length: sidebarFirstDayOffset }).map((_, i) => (
                <div key={i} />
              ))}
              {sidebarDays.map((day, idx) => {
                const isCurrent = isToday(day)
                const isSelected = isSameDay(day, sidebarSelected)
                return (
                  <button
                    key={idx}
                    className={`rounded-full w-7 h-7 flex items-center justify-center transition-colors text-xs
                      ${isSelected ? 'bg-[#de9151] text-white' : isCurrent ? 'border border-gray-300 text-gray-800 bg-gray-50' : 'text-gray-700 hover:bg-gray-100'}
                    `}
                    onClick={() => {
                      setSidebarSelected(day)
                      setCurrentDate(day)
                      setSelectedDate(day)
                    }}
                  >
                    {format(day, 'd')}
                  </button>
                )
              })}
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
                          {/* Events will be rendered here */}
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
                    // Calculate position for current time line if this is today
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
                          {timeSlots.map((_, timeIndex) => (
                            <div key={timeIndex} className="h-12 border-b border-dashed border-gray-200"></div>
                          ))}
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
                    {timeSlots.map((_, index) => (
                      <div key={index} className="h-12 border-b border-dashed border-gray-200"></div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 