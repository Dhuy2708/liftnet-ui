"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/chatbot/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dumbbell, Clock, Target, Zap, Heart, Leaf, RotateCcw, Calendar, LayoutGrid } from "lucide-react"

// Exercise data structure
interface Exercise {
  name: string
  sets?: string
  reps?: string
  duration?: string
  type: "Strength" | "Cardio" | "Flexibility" | "Recovery"
  targetMuscle: string
}

// Weekly schedule data with multiple exercises per day
const weeklySchedule: Record<string, Exercise[]> = {
  monday: [
    {
      name: "Barbell Bench Press",
      sets: "4",
      reps: "8-10",
      type: "Strength",
      targetMuscle: "Chest",
    },
    {
      name: "Dumbbell Bench Press",
      sets: "3",
      reps: "10-12",
      type: "Strength",
      targetMuscle: "Chest",
    },
    {
      name: "Chest Fly",
      sets: "3",
      reps: "12-15",
      type: "Strength",
      targetMuscle: "Chest",
    },
    {
      name: "Tricep Dips",
      sets: "3",
      reps: "10-12",
      type: "Strength",
      targetMuscle: "Triceps",
    },
    {
      name: "Overhead Tricep Extension",
      sets: "3",
      reps: "12-15",
      type: "Strength",
      targetMuscle: "Triceps",
    },
  ],
  tuesday: [
    {
      name: "Treadmill Running",
      duration: "20 min",
      type: "Cardio",
      targetMuscle: "Full Body",
    },
    {
      name: "Burpees",
      sets: "4",
      reps: "10",
      type: "Cardio",
      targetMuscle: "Full Body",
    },
    {
      name: "Mountain Climbers",
      sets: "3",
      reps: "30 sec",
      type: "Cardio",
      targetMuscle: "Core",
    },
    {
      name: "Jump Squats",
      sets: "3",
      reps: "15",
      type: "Cardio",
      targetMuscle: "Legs",
    },
  ],
  wednesday: [
    {
      name: "Pull-ups",
      sets: "4",
      reps: "6-8",
      type: "Strength",
      targetMuscle: "Back",
    },
    {
      name: "Barbell Rows",
      sets: "4",
      reps: "8-10",
      type: "Strength",
      targetMuscle: "Back",
    },
    {
      name: "Lat Pulldowns",
      sets: "3",
      reps: "10-12",
      type: "Strength",
      targetMuscle: "Back",
    },
    {
      name: "Barbell Curls",
      sets: "3",
      reps: "10-12",
      type: "Strength",
      targetMuscle: "Biceps",
    },
    {
      name: "Hammer Curls",
      sets: "3",
      reps: "12-15",
      type: "Strength",
      targetMuscle: "Biceps",
    },
  ],
  thursday: [
    {
      name: "Stationary Bike",
      duration: "25 min",
      type: "Cardio",
      targetMuscle: "Legs",
    },
    {
      name: "Rowing Machine",
      duration: "15 min",
      type: "Cardio",
      targetMuscle: "Full Body",
    },
    {
      name: "Plank",
      sets: "3",
      reps: "60 sec",
      type: "Strength",
      targetMuscle: "Core",
    },
  ],
  friday: [
    {
      name: "Squats",
      sets: "4",
      reps: "8-10",
      type: "Strength",
      targetMuscle: "Legs",
    },
    {
      name: "Romanian Deadlifts",
      sets: "4",
      reps: "8-10",
      type: "Strength",
      targetMuscle: "Legs",
    },
    {
      name: "Leg Press",
      sets: "3",
      reps: "12-15",
      type: "Strength",
      targetMuscle: "Legs",
    },
    {
      name: "Lateral Raises",
      sets: "3",
      reps: "12-15",
      type: "Strength",
      targetMuscle: "Shoulders",
    },
    {
      name: "Shoulder Press",
      sets: "3",
      reps: "10-12",
      type: "Strength",
      targetMuscle: "Shoulders",
    },
    {
      name: "Calf Raises",
      sets: "4",
      reps: "15-20",
      type: "Strength",
      targetMuscle: "Calves",
    },
  ],
  saturday: [
    {
      name: "Swimming Freestyle",
      duration: "30 min",
      type: "Cardio",
      targetMuscle: "Full Body",
    },
    {
      name: "Water Jogging",
      duration: "15 min",
      type: "Cardio",
      targetMuscle: "Legs",
    },
  ],
  sunday: [
    {
      name: "Yoga Flow",
      duration: "30 min",
      type: "Flexibility",
      targetMuscle: "Full Body",
    },
    {
      name: "Light Walking",
      duration: "20 min",
      type: "Recovery",
      targetMuscle: "Legs",
    },
    {
      name: "Stretching",
      duration: "15 min",
      type: "Flexibility",
      targetMuscle: "Full Body",
    },
  ],
}

// Helper function to get exercise type styling
const getExerciseTypeStyle = (type: "Strength" | "Cardio" | "Flexibility" | "Recovery") => {
  switch (type) {
    case "Strength":
      return {
        badge: "bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0",
        icon: <Dumbbell className="h-3 w-3" />,
        accent: "border-l-blue-500",
      }
    case "Cardio":
      return {
        badge: "bg-gradient-to-r from-red-500 to-pink-600 text-white border-0",
        icon: <Heart className="h-3 w-3" />,
        accent: "border-l-red-500",
      }
    case "Flexibility":
      return {
        badge: "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0",
        icon: <Leaf className="h-3 w-3" />,
        accent: "border-l-green-500",
      }
    case "Recovery":
      return {
        badge: "bg-gradient-to-r from-gray-500 to-slate-600 text-white border-0",
        icon: <RotateCcw className="h-3 w-3" />,
        accent: "border-l-gray-500",
      }
    default:
      return {
        badge: "bg-gradient-to-r from-gray-500 to-slate-600 text-white border-0",
        icon: <Zap className="h-3 w-3" />,
        accent: "border-l-gray-500",
      }
  }
}

// Helper function to get day styling
const getDayStyle = (day: string, index: number) => {
  const colors = [
    "from-violet-600 to-purple-600", // Monday
    "from-blue-600 to-cyan-600", // Tuesday
    "from-emerald-600 to-teal-600", // Wednesday
    "from-amber-600 to-orange-600", // Thursday
    "from-red-600 to-pink-600", // Friday
    "from-indigo-600 to-blue-600", // Saturday
    "from-gray-600 to-slate-600", // Sunday
  ]

  return {
    gradient: colors[index] || colors[0],
    isWeekend: day === "saturday" || day === "sunday",
  }
}

const WeeklySchedule = () => {
  const [viewMode, setViewMode] = useState<"vertical" | "horizontal">("vertical")
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

  const VerticalView = () => (
    <div className="flex flex-col gap-6">
      {days.map((day, dayIndex) => {
        const dayStyle = getDayStyle(day, dayIndex)
        const exercises = weeklySchedule[day]

        return (
          <Card
            key={day}
            className={`overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 ${
              dayStyle.isWeekend ? "ring-2 ring-gray-200" : ""
            }`}
          >
            {/* Day Header */}
            <div className={`bg-gradient-to-r ${dayStyle.gradient} p-4 text-white relative overflow-hidden`}>
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative z-10">
                <h3 className="font-bold text-lg capitalize text-center">{day}</h3>
                <div className="text-center text-sm opacity-90 mt-1">
                  {exercises.length} exercise{exercises.length !== 1 ? "s" : ""}
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/10 rounded-full"></div>
              <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-white/10 rounded-full"></div>
            </div>

            {/* Exercises */}
            <CardContent className="p-0">
              <div className="space-y-0">
                {exercises.map((exercise, idx) => {
                  const typeStyle = getExerciseTypeStyle(exercise.type)

                  return (
                    <div
                      key={idx}
                      className={`p-4 border-l-4 ${typeStyle.accent} hover:bg-gray-50/80 transition-colors duration-200 group ${
                        idx !== exercises.length - 1 ? "border-b border-gray-100" : ""
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Exercise Header */}
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-gray-900 text-sm leading-tight group-hover:text-gray-700 transition-colors">
                            {exercise.name}
                          </h4>
                          <Badge className={`${typeStyle.badge} text-xs font-medium flex items-center gap-1 px-2 py-1`}>
                            {typeStyle.icon}
                            {exercise.type}
                          </Badge>
                        </div>

                        {/* Exercise Details */}
                        <div className="grid grid-cols-1 gap-2 text-xs">
                          {/* Target Muscle */}
                          <div className="flex items-center gap-2 text-gray-600">
                            <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                              <Target className="h-3 w-3 text-gray-500" />
                            </div>
                            <span className="font-medium">{exercise.targetMuscle}</span>
                          </div>

                          {/* Sets & Reps or Duration */}
                          {exercise.sets && exercise.reps && (
                            <div className="flex items-center gap-2 text-gray-700">
                              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                                <Dumbbell className="h-3 w-3 text-blue-600" />
                              </div>
                              <span className="font-bold">
                                {exercise.sets} sets × {exercise.reps} reps
                              </span>
                            </div>
                          )}

                          {exercise.duration && (
                            <div className="flex items-center gap-2 text-gray-700">
                              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                                <Clock className="h-3 w-3 text-green-600" />
                              </div>
                              <span className="font-bold">{exercise.duration}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )

  const HorizontalView = () => (
    <Card className="border-0 shadow-xl overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div className="min-w-full">
            {/* Day Headers */}
            <div className="grid grid-cols-7 bg-gradient-to-r from-purple-600 to-pink-600">
              {days.map((day, dayIndex) => {
                const dayStyle = getDayStyle(day, dayIndex)
                const exercises = weeklySchedule[day]

                return (
                  <div
                    key={day}
                    className={`p-4 text-white text-center border-r border-white/20 last:border-r-0 relative overflow-hidden ${
                      dayStyle.isWeekend ? "bg-black/10" : ""
                    }`}
                  >
                    <div className="relative z-10">
                      <h3 className="font-bold text-lg capitalize">{day}</h3>
                      <div className="text-sm opacity-90 mt-1">
                        {exercises.length} exercise{exercises.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                    {/* Decorative elements */}
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-white/10 rounded-full"></div>
                  </div>
                )
              })}
            </div>

            {/* Exercise Content */}
            <div className="grid grid-cols-7 min-h-[500px]">
              {days.map((day, dayIndex) => {
                const dayStyle = getDayStyle(day, dayIndex)
                const exercises = weeklySchedule[day]

                return (
                  <div
                    key={day}
                    className={`border-r border-gray-200 last:border-r-0 ${
                      dayStyle.isWeekend ? "bg-gray-50/30" : "bg-white"
                    }`}
                  >
                    <div className="p-3 space-y-3">
                      {exercises.map((exercise, idx) => {
                        const typeStyle = getExerciseTypeStyle(exercise.type)

                        return (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg border-l-4 ${typeStyle.accent} bg-white shadow-sm hover:shadow-md transition-all duration-200 group`}
                          >
                            <div className="space-y-2">
                              {/* Exercise Header */}
                              <div className="space-y-2">
                                <h4 className="font-semibold text-gray-900 text-sm leading-tight group-hover:text-gray-700 transition-colors">
                                  {exercise.name}
                                </h4>
                                <Badge
                                  className={`${typeStyle.badge} text-xs font-medium flex items-center gap-1 px-2 py-1 w-fit`}
                                >
                                  {typeStyle.icon}
                                  {exercise.type}
                                </Badge>
                              </div>

                              {/* Exercise Details */}
                              <div className="space-y-2 text-xs">
                                {/* Target Muscle */}
                                <div className="flex items-center gap-2 text-gray-600">
                                  <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center">
                                    <Target className="h-2.5 w-2.5 text-gray-500" />
                                  </div>
                                  <span className="font-medium text-xs">{exercise.targetMuscle}</span>
                                </div>

                                {/* Sets & Reps or Duration */}
                                {exercise.sets && exercise.reps && (
                                  <div className="flex items-center gap-2 text-gray-700">
                                    <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                                      <Dumbbell className="h-2.5 w-2.5 text-blue-600" />
                                    </div>
                                    <span className="font-bold text-xs">
                                      {exercise.sets} × {exercise.reps}
                                    </span>
                                  </div>
                                )}

                                {exercise.duration && (
                                  <div className="flex items-center gap-2 text-gray-700">
                                    <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                                      <Clock className="h-2.5 w-2.5 text-green-600" />
                                    </div>
                                    <span className="font-bold text-xs">{exercise.duration}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="text-center space-y-6">
        {/* <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white shadow-lg">
          <Zap className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Weekly Training Plan</h1>
          <Zap className="h-6 w-6" />
        </div>
  */}

        {/* View Toggle Buttons */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant={viewMode === "vertical" ? "default" : "outline"}
            onClick={() => setViewMode("vertical")}
            className={`flex items-center gap-2 ${
              viewMode === "vertical" ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" : "hover:bg-purple-50"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            Card View
          </Button>
          <Button
            variant={viewMode === "horizontal" ? "default" : "outline"}
            onClick={() => setViewMode("horizontal")}
            className={`flex items-center gap-2 ${
              viewMode === "horizontal"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                : "hover:bg-purple-50"
            }`}
          >
            <Calendar className="h-4 w-4" />
            Calendar View
          </Button>
        </div>
      </div>

      {/* Schedule Content */}
      {viewMode === "vertical" ? <VerticalView /> : <HorizontalView />}

      {/* Footer Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
          <div className="text-2xl font-bold text-blue-600">
            {Object.values(weeklySchedule).reduce(
              (acc, exercises) => acc + exercises.filter((e) => e.type === "Strength").length,
              0,
            )}
          </div>
          <div className="text-sm text-blue-700 font-medium">Strength</div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl border border-red-100">
          <div className="text-2xl font-bold text-red-600">
            {Object.values(weeklySchedule).reduce(
              (acc, exercises) => acc + exercises.filter((e) => e.type === "Cardio").length,
              0,
            )}
          </div>
          <div className="text-sm text-red-700 font-medium">Cardio</div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
          <div className="text-2xl font-bold text-green-600">
            {Object.values(weeklySchedule).reduce(
              (acc, exercises) => acc + exercises.filter((e) => e.type === "Flexibility").length,
              0,
            )}
          </div>
          <div className="text-sm text-green-700 font-medium">Flexibility</div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-100">
          <div className="text-2xl font-bold text-gray-600">
            {Object.values(weeklySchedule).reduce(
              (acc, exercises) => acc + exercises.filter((e) => e.type === "Recovery").length,
              0,
            )}
          </div>
          <div className="text-sm text-gray-700 font-medium">Recovery</div>
        </div>
      </div>
    </div>
  )
}

export default WeeklySchedule
