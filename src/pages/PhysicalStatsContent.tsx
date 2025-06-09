"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/chatbot/card"
import { Activity, User, MessageSquare, X } from "lucide-react"
import { usePlanningStore } from "@/store/PlanningStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import AICoachContent from "./AICoachContent"

interface ValidationErrors {
  age?: string
  height?: string
  mass?: string
  bdf?: string
}

enum ActivityLevel {
  None = 0,
  Light = 1,
  Moderate = 2,
  Heavy = 3,
  Athlete = 4
}

enum TrainingGoal {
  None = 0,
  LoseFat = 1,
  MaintainWeight = 2,
  GainMuscle = 3
}

export const PhysicalStatsContent = () => {
  const { physicalStats, isLoading, error, isSaving, setPhysicalStats, fetchPhysicalStats } = usePlanningStore()
  const [showChat, setShowChat] = useState(false)
  const [chatWidth, setChatWidth] = useState(50)
  const isDragging = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const [formData, setFormData] = useState({
    age: "",
    gender: "",
    height: "",
    mass: "",
    bdf: "",
    activityLevel: "",
    goal: "",
  })
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})

  useEffect(() => {
    fetchPhysicalStats()
  }, [fetchPhysicalStats])

  useEffect(() => {
    if (physicalStats) {
      setFormData({
        age: physicalStats.age?.toString() || "",
        gender: physicalStats.gender?.toString() || "",
        height: physicalStats.height?.toString() || "",
        mass: physicalStats.mass?.toString() || "",
        bdf: physicalStats.bdf?.toString() || "",
        activityLevel: physicalStats.activityLevel?.toString() || "",
        goal: physicalStats.goal?.toString() || "",
      })
    }
  }, [physicalStats])

  const handleMouseDown = () => {
    isDragging.current = true
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return

    const containerRect = containerRef.current.getBoundingClientRect()
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100
    setChatWidth(Math.min(Math.max(newWidth, 30), 70))
  }

  const handleMouseUp = () => {
    isDragging.current = false
    document.removeEventListener("mousemove", handleMouseMove)
    document.removeEventListener("mouseup", handleMouseUp)
  }

  const validateField = (field: string, value: string): string | undefined => {
    const numValue = Number(value)
    
    switch (field) {
      case "age":
        if (value && (numValue < 1 || numValue > 120)) {
          return "Age must be between 1 and 120"
        }
        break
      case "height":
        if (value && (numValue < 50 || numValue > 300)) {
          return "Height must be between 50 and 300 cm"
        }
        break
      case "mass":
        if (value && (numValue < 20 || numValue > 500)) {
          return "Weight must be between 20 and 500 kg"
        }
        break
      case "bdf":
        if (value && (numValue < 1 || numValue > 60)) {
          return "Body fat percentage must be between 1 and 60"
        }
        break
    }
    return undefined
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    const error = validateField(field, value)
    setValidationErrors((prev) => ({
      ...prev,
      [field]: error,
    }))
  }

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {}
    let isValid = true

    Object.entries(formData).forEach(([field, value]) => {
      const error = validateField(field, value)
      if (error) {
        errors[field as keyof ValidationErrors] = error
        isValid = false
      }
    })

    setValidationErrors(errors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error("Please fix the validation errors before saving")
      return
    }

    const stats = {
      age: formData.age ? Number(formData.age) : null,
      gender: formData.gender ? Number(formData.gender) : null,
      height: formData.height ? Number(formData.height) : null,
      mass: formData.mass ? Number(formData.mass) : null,
      bdf: formData.bdf ? Number(formData.bdf) : null,
      activityLevel: formData.activityLevel ? Number(formData.activityLevel) as ActivityLevel : null,
      goal: formData.goal ? Number(formData.goal) as TrainingGoal : null,
    }

    try {
      await setPhysicalStats(stats)
      toast.success("Physical stats saved successfully")
    } catch {
      toast.error("Failed to save physical stats")
    }
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-start pt-4">
      <div className="w-full px-4">
        <div className="flex justify-end mb-4">
          <Button
            onClick={() => setShowChat(!showChat)}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-4 py-2 flex items-center gap-2"
          >
            {showChat ? (
              <>
                <X className="w-4 h-4" />
                Hide Chat
              </>
            ) : (
              <>
                <MessageSquare className="w-4 h-4" />
                Show Chat
              </>
            )}
          </Button>
        </div>

        <div ref={containerRef} className="flex gap-4">
          <div className={`transition-all duration-300 ${showChat ? `w-[${100 - chatWidth}%]` : "w-full"}`}>
            <Card className="w-full border-0 shadow-2xl bg-gradient-to-br from-white to-green-50/30 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 via-amber-500 to-orange-300"></div>
              <CardContent className="p-4">
                <div className="text-center space-y-3 max-w-2xl mx-auto">
                  <div className="relative">
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center mx-auto shadow-xl transform rotate-12 absolute -top-2 left-1/2 -translate-x-1/2 opacity-20"></div>
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center mx-auto shadow-xl relative z-10">
                      <User className="w-7 h-7 text-white" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Physical Statistics</h3>
                    <p className="text-gray-600 max-w-2xl mx-auto text-sm">
                      Track your body metrics, set goals, and monitor your progress.
                    </p>
                  </div>

                  <div className="mt-3">
                    {isLoading ? (
                      <div className="flex justify-center py-6">
                        <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : error ? (
                      <div className="bg-red-50 text-red-600 p-2 rounded-xl border border-red-100 my-2">{error}</div>
                    ) : (
                      <form className="space-y-3" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="group bg-white p-3 rounded-xl shadow-sm border border-gray-100 hover:border-orange-300 transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">
                                <span className="text-xs font-bold">01</span>
                              </div>
                              <Label className="text-sm font-medium text-gray-700">Age</Label>
                            </div>
                            <Input
                              type="number"
                              value={formData.age}
                              onChange={(e) => handleChange("age", e.target.value)}
                              className={`w-full px-3 py-1.5 rounded-lg border ${
                                validationErrors.age ? "border-red-300" : "border-gray-200"
                              } focus:border-orange-400 focus:ring-orange-400 text-base font-medium text-gray-900 transition-all duration-200`}
                              placeholder="Enter your age"
                            />
                            {validationErrors.age && (
                              <p className="text-red-500 text-xs mt-1">{validationErrors.age}</p>
                            )}
                          </div>

                          <div className="group bg-white p-3 rounded-xl shadow-sm border border-gray-100 hover:border-orange-300 transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">
                                <span className="text-xs font-bold">02</span>
                              </div>
                              <Label className="text-sm font-medium text-gray-700">Gender</Label>
                            </div>
                            <Select value={formData.gender} onValueChange={(value) => handleChange("gender", value)}>
                              <SelectTrigger className="w-full px-3 py-1.5 rounded-lg border border-gray-200 focus:border-orange-400 focus:ring-orange-400 text-base font-medium text-gray-900 transition-all duration-200">
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">Male</SelectItem>
                                <SelectItem value="2">Female</SelectItem>
                                <SelectItem value="3">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="group bg-white p-3 rounded-xl shadow-sm border border-gray-100 hover:border-orange-300 transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">
                                <span className="text-xs font-bold">03</span>
                              </div>
                              <Label className="text-sm font-medium text-gray-700">Height (cm)</Label>
                            </div>
                            <Input
                              type="number"
                              value={formData.height}
                              onChange={(e) => handleChange("height", e.target.value)}
                              className={`w-full px-3 py-1.5 rounded-lg border ${
                                validationErrors.height ? "border-red-300" : "border-gray-200"
                              } focus:border-orange-400 focus:ring-orange-400 text-base font-medium text-gray-900 transition-all duration-200`}
                              placeholder="Enter your height"
                            />
                            {validationErrors.height && (
                              <p className="text-red-500 text-xs mt-1">{validationErrors.height}</p>
                            )}
                          </div>

                          <div className="group bg-white p-3 rounded-xl shadow-sm border border-gray-100 hover:border-orange-300 transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">
                                <span className="text-xs font-bold">04</span>
                              </div>
                              <Label className="text-sm font-medium text-gray-700">Weight (kg)</Label>
                            </div>
                            <Input
                              type="number"
                              value={formData.mass}
                              onChange={(e) => handleChange("mass", e.target.value)}
                              className={`w-full px-3 py-1.5 rounded-lg border ${
                                validationErrors.mass ? "border-red-300" : "border-gray-200"
                              } focus:border-orange-400 focus:ring-orange-400 text-base font-medium text-gray-900 transition-all duration-200`}
                              placeholder="Enter your weight"
                            />
                            {validationErrors.mass && (
                              <p className="text-red-500 text-xs mt-1">{validationErrors.mass}</p>
                            )}
                          </div>

                          <div className="group bg-white p-3 rounded-xl shadow-sm border border-gray-100 hover:border-orange-300 transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">
                                <span className="text-xs font-bold">05</span>
                              </div>
                              <Label className="text-sm font-medium text-gray-700">Body Fat %</Label>
                            </div>
                            <Input
                              type="number"
                              value={formData.bdf}
                              onChange={(e) => handleChange("bdf", e.target.value)}
                              className={`w-full px-3 py-1.5 rounded-lg border ${
                                validationErrors.bdf ? "border-red-300" : "border-gray-200"
                              } focus:border-orange-400 focus:ring-orange-400 text-base font-medium text-gray-900 transition-all duration-200`}
                              placeholder="Enter body fat %"
                            />
                            {validationErrors.bdf && (
                              <p className="text-red-500 text-xs mt-1">{validationErrors.bdf}</p>
                            )}
                          </div>

                          <div className="group bg-white p-3 rounded-xl shadow-sm border border-gray-100 hover:border-orange-300 transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">
                                <span className="text-xs font-bold">06</span>
                              </div>
                              <Label className="text-sm font-medium text-gray-700">Activity Level</Label>
                            </div>
                            <Select
                              value={formData.activityLevel}
                              onValueChange={(value) => handleChange("activityLevel", value)}
                            >
                              <SelectTrigger className="w-full px-3 py-1.5 rounded-lg border border-gray-200 focus:border-orange-400 focus:ring-orange-400 text-base font-medium text-gray-900 transition-all duration-200">
                                <SelectValue placeholder="Select activity level" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={ActivityLevel.None.toString()}>None</SelectItem>
                                <SelectItem value={ActivityLevel.Light.toString()}>Light (1-2 days/week)</SelectItem>
                                <SelectItem value={ActivityLevel.Moderate.toString()}>Moderate (3-5 days/week)</SelectItem>
                                <SelectItem value={ActivityLevel.Heavy.toString()}>Heavy (6-7 days/week)</SelectItem>
                                <SelectItem value={ActivityLevel.Athlete.toString()}>Athlete (2+ times/day)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="group bg-white p-3 rounded-xl shadow-sm border border-gray-100 hover:border-orange-300 transition-all duration-300 hover:shadow-md hover:-translate-y-1 md:col-span-2">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">
                                <Activity className="w-3 h-3" />
                              </div>
                              <Label className="text-sm font-medium text-gray-700">Fitness Goal</Label>
                            </div>
                            <Select value={formData.goal} onValueChange={(value) => handleChange("goal", value)}>
                              <SelectTrigger className="w-full px-3 py-1.5 rounded-lg border border-gray-200 focus:border-orange-400 focus:ring-orange-400 text-base font-medium text-gray-900 transition-all duration-200">
                                <SelectValue placeholder="Select your goal" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={TrainingGoal.None.toString()}>None</SelectItem>
                                <SelectItem value={TrainingGoal.LoseFat.toString()}>Lose Fat</SelectItem>
                                <SelectItem value={TrainingGoal.MaintainWeight.toString()}>Maintain Weight</SelectItem>
                                <SelectItem value={TrainingGoal.GainMuscle.toString()}>Gain Muscle</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="flex justify-center mt-4">
                          <Button
                            type="submit"
                            disabled={isSaving}
                            className="px-5 py-3 bg-gradient-to-r from-orange-400 to-amber-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSaving ? (
                              <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Saving...</span>
                              </div>
                            ) : (
                              "Save Changes"
                            )}
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {showChat && (
            <>
              <div
                className="w-1 bg-gray-200 cursor-col-resize hover:bg-purple-600 transition-colors"
                onMouseDown={handleMouseDown}
              />
              <div className={`w-[${chatWidth}%] transition-all duration-300`}>
                <Card className="w-full h-[calc(100vh-8rem)] border-0 shadow-2xl overflow-hidden">
                  <CardContent className="p-0 h-full">
                    <AICoachContent />
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default PhysicalStatsContent
