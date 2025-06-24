"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/chatbot/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dumbbell,
  Target,
  Zap,
  Heart,
  Leaf,
  RotateCcw,
  Search,
  X,
} from "lucide-react"
import { usePlanningStore, type Exercise } from "@/store/PlanningStore"
import { motion } from "framer-motion"

// Helper function to format camelized string for display
const formatCamelCase = (str: string) => {
  return str.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())
}

// Helper function to get exercise type styling
const getExerciseTypeStyle = (type: string) => {
  switch (type.toLowerCase()) {
    case "strength":
      return {
        badge: "bg-gradient-to-r from-blue-500/90 to-indigo-500/90 text-white border-0 shadow-lg shadow-blue-500/25",
        icon: <Dumbbell className="h-3.5 w-3.5" />,
        accent: "border-l-blue-500",
        cardBg: "bg-gradient-to-br from-blue-50/80 to-indigo-50/80",
      }
    case "cardio":
      return {
        badge: "bg-gradient-to-r from-red-500/90 to-rose-500/90 text-white border-0 shadow-lg shadow-red-500/25",
        icon: <Heart className="h-3.5 w-3.5" />,
        accent: "border-l-red-500",
        cardBg: "bg-gradient-to-br from-red-50/80 to-rose-50/80",
      }
    case "flexibility":
      return {
        badge:
          "bg-gradient-to-r from-emerald-500/90 to-teal-500/90 text-white border-0 shadow-lg shadow-emerald-500/25",
        icon: <Leaf className="h-3.5 w-3.5" />,
        accent: "border-l-emerald-500",
        cardBg: "bg-gradient-to-br from-emerald-50/80 to-teal-50/80",
      }
    case "recovery":
      return {
        badge: "bg-gradient-to-r from-slate-500/90 to-gray-500/90 text-white border-0 shadow-lg shadow-slate-500/25",
        icon: <RotateCcw className="h-3.5 w-3.5" />,
        accent: "border-l-slate-500",
        cardBg: "bg-gradient-to-br from-slate-50/80 to-gray-50/80",
      }
    default:
      return {
        badge:
          "bg-gradient-to-r from-purple-500/90 to-violet-500/90 text-white border-0 shadow-lg shadow-purple-500/25",
        icon: <Zap className="h-3.5 w-3.5" />,
        accent: "border-l-purple-500",
        cardBg: "bg-gradient-to-br from-purple-50/80 to-violet-50/80",
      }
  }
}

const ExercisesContent = () => {
  const { exerciseList, exerciseLoading, exerciseError, fetchExerciseList } = usePlanningStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  // Fetch exercises on initial load
  useEffect(() => {
    fetchExerciseList(null, 1, 20)
    setCurrentPage(1)
    setHasMore(true)
  }, [fetchExerciseList])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchExerciseList(searchTerm || null, 1, 20)
    setCurrentPage(1)
    setHasMore(true)
  }

  const handleClearSearch = () => {
    setSearchTerm("")
    fetchExerciseList(null, 1, 20)
    setCurrentPage(1)
    setHasMore(true)
  }

  const handleLoadMore = async () => {
    const nextPage = currentPage + 1
    const currentExercises = exerciseList || []
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/Planning/exercise/list?search=${searchTerm || ''}&pageNumber=${nextPage}&pageSize=20`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.datas && data.datas.length > 0) {
          const newExercises = data.datas.flat()
          // Append new exercises to existing list
          usePlanningStore.setState({ 
            exerciseList: [...currentExercises, ...newExercises],
            exerciseLoading: false 
          })
          setCurrentPage(nextPage)
          // Check if we have more data
          setHasMore(newExercises.length === 20)
        } else {
          setHasMore(false)
        }
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error("Error loading more exercises:", error)
      setHasMore(false)
    }
  }

  if (exerciseError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="text-red-500 text-lg font-medium">Something went wrong</div>
          <div className="text-gray-500 text-sm">{exerciseError}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-8 p-6 pt-1 bg-gradient-to-br from-gray-50/50 to-white min-h-screen relative">
      {/* Header */}
      <div className="relative flex items-center justify-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Exercise Library
        </h2>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSearch} className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search exercises (e.g., chest, back, legs)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 rounded-xl border-gray-200 focus:border-purple-600 focus:ring-purple-600 text-lg"
              />
              {searchTerm && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleClearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25"
            >
              Search
            </Button>
          </div>
        </form>
      </div>

      {/* Loading State */}
      {exerciseLoading && (
        <div className="flex justify-center items-center py-12">
          <span className="w-8 h-8 border-4 border-purple-300 border-t-transparent rounded-full animate-spin inline-block"></span>
          <span className="ml-3 text-purple-500 font-medium text-lg">Loading exercises...</span>
        </div>
      )}

      {/* No Results */}
      {!exerciseLoading && (!exerciseList || exerciseList.length === 0) && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center">
              <Dumbbell className="h-8 w-8 text-purple-500" />
            </div>
            <div className="text-gray-600 font-medium">No exercises found</div>
            <div className="text-gray-400 text-sm">
              {searchTerm ? `Try a different search term` : "Start searching for exercises"}
            </div>
          </div>
        </div>
      )}

      {/* Exercise Grid/List */}
      {!exerciseLoading && exerciseList && exerciseList.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {exerciseList.map((exercise, index) => {
              const typeStyle = getExerciseTypeStyle(exercise.category || "")
              return (
                <motion.div
                  key={exercise.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  onClick={() => setSelectedExercise(exercise)}
                  className={`${
                    "p-3 rounded-lg border-l-4"
                  } ${typeStyle.accent} ${typeStyle.cardBg} 
                    transition-all duration-300 ease-in-out
                    hover:shadow-lg hover:shadow-black/10 hover:-translate-y-1 
                    group cursor-pointer relative border border-white/50`}
                >
                  <div className="flex flex-col w-full">
                    {/* Exercise Image */}
                    <div className="relative aspect-square rounded-md overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 shadow-sm mb-2">
                      <img
                        src={exercise.gifUrl || "/placeholder.svg"}
                        alt={exercise.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <Badge
                        className={`${typeStyle.badge} transition-all duration-200 group-hover:scale-105 absolute top-1 right-1 px-1.5 py-0.5 text-xs`}
                      >
                        <span className="flex items-center gap-1">
                          {typeStyle.icon}
                          {formatCamelCase(exercise.category || "").split(" ")[0]}
                        </span>
                      </Badge>
                    </div>

                    {/* Exercise Name */}
                    <h4 className={`font-bold text-gray-900 group-hover:text-purple-700 transition-colors duration-200 w-full mb-1.5 text-xs leading-tight`}>
                      {formatCamelCase(exercise.name || "")}
                    </h4>

                    {/* Exercise Description */}
                    {exercise.description && (
                      <p className="text-gray-600 text-xs leading-relaxed line-clamp-2 group-hover:text-gray-700 transition-colors duration-200 mb-2">
                        {exercise.description}
                      </p>
                    )}

                    {/* Quick Info */}
                    <div className="space-y-0.5">
                      {exercise.target && (
                        <p className="flex items-center gap-1.5 text-xs text-gray-500 group-hover:text-gray-600 transition-colors duration-200">
                          <Target className="h-2.5 w-2.5 text-gray-400 group-hover:text-purple-400 transition-colors duration-200 flex-shrink-0" />
                          <span className="truncate text-xs">{formatCamelCase(exercise.target)}</span>
                        </p>
                      )}
                      {exercise.bodyPart && (
                        <p className="flex items-center gap-1.5 text-xs text-gray-500 group-hover:text-gray-600 transition-colors duration-200">
                          <Heart className="h-2.5 w-2.5 text-gray-400 group-hover:text-purple-400 transition-colors duration-200 flex-shrink-0" />
                          <span className="truncate text-xs">{formatCamelCase(exercise.bodyPart)}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center mt-8">
              <Button
                onClick={handleLoadMore}
                disabled={exerciseLoading}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exerciseLoading ? (
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Loading...
                  </div>
                ) : (
                  "Load More"
                )}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40 p-4 transition-opacity duration-300"
          style={{ animation: "fadeIn 0.3s ease-out" }}
        >
          <Card
            className="w-full max-w-2xl max-h-[80vh] overflow-y-auto border-0 shadow-2xl transition-all duration-300"
            style={{ animation: "slideIn 0.3s ease-out" }}
          >
            <CardContent className="p-0">
              {/* Header with gradient background */}
              <div className="relative p-6 bg-gradient-to-r from-purple-600 to-pink-600">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative flex justify-between items-start">
                  <div className="space-y-1.5">
                    <h3 className="text-2xl font-bold text-white">{formatCamelCase(selectedExercise.name)}</h3>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          selectedExercise.category === "strength"
                            ? "bg-blue-500/20 text-blue-100"
                            : selectedExercise.category === "cardio"
                              ? "bg-red-500/20 text-red-100"
                              : selectedExercise.category === "mobility"
                                ? "bg-emerald-500/20 text-emerald-100"
                                : selectedExercise.category === "plyometrics"
                                  ? "bg-amber-500/20 text-amber-100"
                                  : selectedExercise.category === "rehabilitation"
                                    ? "bg-purple-500/20 text-purple-100"
                                    : selectedExercise.category === "stretching"
                                      ? "bg-teal-500/20 text-teal-100"
                                      : selectedExercise.category === "balance"
                                        ? "bg-indigo-500/20 text-indigo-100"
                                        : "bg-gray-500/20 text-gray-100"
                        }`}
                      >
                        {formatCamelCase(selectedExercise.category)}
                      </Badge>
                      <Badge className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-medium">
                        {formatCamelCase(selectedExercise.difficulty)}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedExercise(null)}
                    className="hover:bg-white/20 text-white rounded-full"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Exercise Image */}
                <div className="relative aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 shadow-lg">
                  <img
                    src={selectedExercise.gifUrl || "/placeholder.svg"}
                    alt={selectedExercise.name}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Exercise Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                      <h3 className="text-base font-semibold text-blue-900 mb-3">Primary Info</h3>
                      <div className="space-y-2">
                        <div>
                          <h4 className="text-xs font-medium text-blue-600">Target Muscle</h4>
                          <p className="text-blue-900 text-sm">{formatCamelCase(selectedExercise.target)}</p>
                        </div>
                        <div>
                          <h4 className="text-xs font-medium text-blue-600">Equipment</h4>
                          <p className="text-blue-900 text-sm">{formatCamelCase(selectedExercise.equipment)}</p>
                        </div>
                        <div>
                          <h4 className="text-xs font-medium text-blue-600">Body Part</h4>
                          <p className="text-blue-900 text-sm">{formatCamelCase(selectedExercise.bodyPart)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100">
                      <h3 className="text-base font-semibold text-purple-900 mb-3">Secondary Muscles</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedExercise.secondaryMuscles.map((muscle, index) => (
                          <Badge
                            key={index}
                            className="bg-white/50 text-purple-700 border-purple-200 px-2 py-0.5 text-xs"
                          >
                            {formatCamelCase(muscle)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
                    <h3 className="text-base font-semibold text-emerald-900 mb-3">Instructions</h3>
                    <ol className="space-y-2">
                      {selectedExercise.instructions.map((instruction, index) => (
                        <li key={index} className="flex gap-2">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-medium flex items-center justify-center text-xs">
                            {index + 1}
                          </div>
                          <p className="text-emerald-900 text-sm">{instruction}</p>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>

                {/* Description */}
                {selectedExercise.description && (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-100">
                    <h3 className="text-base font-semibold text-gray-900 mb-3">Description</h3>
                    <p className="text-gray-700 text-sm leading-relaxed">{selectedExercise.description}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}

export default ExercisesContent 