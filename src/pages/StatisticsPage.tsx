"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Calendar, Clock, Users, TrendingUp, Award, DollarSign, Target, BarChart2, Activity, Target as TargetIcon, Wallet } from "lucide-react"
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import React from "react"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface Statistics {
  totalAppointments: number
  completedAppointments: number
  upcomingAppointments: number
  totalHours: number
  averageRating: number
  totalClients: number
  totalSpent: number
  totalEarned: number
  goalsAchieved: number
  totalWorkouts: number
  monthlyProgress: {
    month: string
    appointments: number
    spent: number
  }[]
  recentAchievements: {
    title: string
    date: string
    icon: string
  }[]
}

type TabType = 'overview' | 'financial' | 'achievements' | 'progress'

export function StatisticsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [statistics, setStatistics] = useState<Statistics>({
    totalAppointments: 0,
    completedAppointments: 0,
    upcomingAppointments: 0,
    totalHours: 0,
    averageRating: 0,
    totalClients: 0,
    totalSpent: 0,
    totalEarned: 0,
    goalsAchieved: 0,
    totalWorkouts: 0,
    monthlyProgress: [],
    recentAchievements: []
  })

  useEffect(() => {
    // TODO: Replace with actual API call
    setStatistics({
      totalAppointments: 156,
      completedAppointments: 142,
      upcomingAppointments: 14,
      totalHours: 312,
      averageRating: 4.8,
      totalClients: 23,
      totalSpent: 2340,
      totalEarned: 4680,
      goalsAchieved: 8,
      totalWorkouts: 89,
      monthlyProgress: [
        { month: "Jan", appointments: 12, spent: 180 },
        { month: "Feb", appointments: 15, spent: 225 },
        { month: "Mar", appointments: 18, spent: 270 },
        { month: "Apr", appointments: 14, spent: 210 },
        { month: "May", appointments: 16, spent: 240 },
        { month: "Jun", appointments: 20, spent: 300 }
      ],
      recentAchievements: [
        { title: "Completed 50 Workouts", date: "2 days ago", icon: "🏆" },
        { title: "Reached 100 Hours", date: "1 week ago", icon: "⏱️" },
        { title: "5-Star Rating", date: "2 weeks ago", icon: "⭐" }
      ]
    })
  }, [])

  const statCards = [
    {
      title: "Total Appointments",
      value: statistics.totalAppointments,
      icon: Calendar,
      color: "text-blue-500",
      trend: "+12%"
    },
    {
      title: "Completed",
      value: statistics.completedAppointments,
      icon: Award,
      color: "text-green-500",
      trend: "+8%"
    },
    {
      title: "Upcoming",
      value: statistics.upcomingAppointments,
      icon: Clock,
      color: "text-orange-500",
      trend: "+5%"
    },
    {
      title: "Total Hours",
      value: statistics.totalHours,
      icon: Clock,
      color: "text-purple-500",
      trend: "+15%"
    },
    {
      title: "Average Rating",
      value: statistics.averageRating.toFixed(1),
      icon: TrendingUp,
      color: "text-yellow-500",
      trend: "+0.2"
    },
    {
      title: "Total Clients",
      value: statistics.totalClients,
      icon: Users,
      color: "text-pink-500",
      trend: "+3"
    }
  ]

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'financial', label: 'Financial', icon: Wallet },
    { id: 'achievements', label: 'Achievements', icon: TargetIcon },
    { id: 'progress', label: 'Progress', icon: Activity }
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            {/* Key Metrics Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-700">Key Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {statCards.slice(0, 3).map((stat, index) => (
                  <Card key={index} className="p-6 hover:shadow-lg transition-shadow duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                        <p className="text-2xl font-bold mt-1">{stat.value}</p>
                        <p className="text-sm text-green-500 mt-1">{stat.trend}</p>
                      </div>
                      <div className={`p-3 rounded-full ${stat.color} bg-opacity-10`}>
                        {React.createElement(stat.icon, { className: `w-6 h-6 ${stat.color}` })}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Performance Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Appointment Trends</h3>
                <div className="h-80">
                  <Line
                    data={{
                      labels: statistics.monthlyProgress.map(data => data.month),
                      datasets: [
                        {
                          label: 'Appointments',
                          data: statistics.monthlyProgress.map(data => data.appointments),
                          borderColor: '#3b82f6',
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          fill: true,
                          tension: 0.4
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.05)'
                          }
                        },
                        x: {
                          grid: {
                            display: false
                          }
                        }
                      }
                    }}
                  />
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Client Distribution</h3>
                <div className="h-80">
                  <Doughnut
                    data={{
                      labels: ['Active', 'New', 'Inactive'],
                      datasets: [
                        {
                          data: [15, 5, 3],
                          backgroundColor: [
                            'rgba(59, 130, 246, 0.8)',
                            'rgba(16, 185, 129, 0.8)',
                            'rgba(156, 163, 175, 0.8)'
                          ],
                          borderWidth: 0
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom'
                        }
                      },
                      cutout: '70%'
                    }}
                  />
                </div>
              </Card>
            </div>

            {/* Performance Metrics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Rating Distribution</h3>
                <div className="h-80">
                  <Bar
                    data={{
                      labels: ['1★', '2★', '3★', '4★', '5★'],
                      datasets: [
                        {
                          label: 'Ratings',
                          data: [2, 3, 8, 15, 45],
                          backgroundColor: [
                            'rgba(239, 68, 68, 0.8)',
                            'rgba(249, 115, 22, 0.8)',
                            'rgba(234, 179, 8, 0.8)',
                            'rgba(34, 197, 94, 0.8)',
                            'rgba(16, 185, 129, 0.8)'
                          ],
                          borderRadius: 6
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.05)'
                          }
                        },
                        x: {
                          grid: {
                            display: false
                          }
                        }
                      }
                    }}
                  />
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Monthly Hours</h3>
                <div className="h-80">
                  <Line
                    data={{
                      labels: statistics.monthlyProgress.map(data => data.month),
                      datasets: [
                        {
                          label: 'Hours',
                          data: statistics.monthlyProgress.map(data => data.appointments * 2), // Assuming 2 hours per appointment
                          borderColor: '#8b5cf6',
                          backgroundColor: 'rgba(139, 92, 246, 0.1)',
                          fill: true,
                          tension: 0.4
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.05)'
                          }
                        },
                        x: {
                          grid: {
                            display: false
                          }
                        }
                      }
                    }}
                  />
                </div>
              </Card>
            </div>
          </div>
        )

      case 'financial':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Financial Overview</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-emerald-800">Total Earnings</h4>
                      <DollarSign className="w-5 h-5 text-emerald-600" />
                    </div>
                    <p className="text-2xl font-bold text-emerald-900">${statistics.totalEarned}</p>
                    <p className="text-sm text-emerald-600 mt-1">+$240 this month</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-red-800">Total Spent</h4>
                      <DollarSign className="w-5 h-5 text-red-600" />
                    </div>
                    <p className="text-2xl font-bold text-red-900">${statistics.totalSpent}</p>
                    <p className="text-sm text-red-600 mt-1">+$120 this month</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Monthly Revenue</h3>
                <div className="h-80">
                  <Bar
                    data={{
                      labels: statistics.monthlyProgress.map(data => data.month),
                      datasets: [
                        {
                          label: 'Revenue',
                          data: statistics.monthlyProgress.map(data => data.spent * 2), // Assuming revenue is 2x spent
                          backgroundColor: 'rgba(16, 185, 129, 0.8)',
                          borderRadius: 6
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.05)'
                          }
                        },
                        x: {
                          grid: {
                            display: false
                          }
                        }
                      }
                    }}
                  />
                </div>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Revenue vs Expenses</h3>
              <div className="h-80">
                <Line
                  data={{
                    labels: statistics.monthlyProgress.map(data => data.month),
                    datasets: [
                      {
                        label: 'Revenue',
                        data: statistics.monthlyProgress.map(data => data.spent * 2),
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                        tension: 0.4
                      },
                      {
                        label: 'Expenses',
                        data: statistics.monthlyProgress.map(data => data.spent),
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        fill: true,
                        tension: 0.4
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top'
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          display: true,
                          color: 'rgba(0, 0, 0, 0.05)'
                        }
                      },
                      x: {
                        grid: {
                          display: false
                        }
                      }
                    }
                  }}
                />
              </div>
            </Card>
          </div>
        )

      case 'achievements':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Achievements</h3>
                <div className="space-y-4">
                  {statistics.recentAchievements.map((achievement, index) => (
                    <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <span className="text-2xl mr-3">{achievement.icon}</span>
                      <div>
                        <p className="font-medium text-gray-900">{achievement.title}</p>
                        <p className="text-sm text-gray-500">{achievement.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Goals Progress</h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Goals Achieved</span>
                      <span className="font-bold text-indigo-600">{statistics.goalsAchieved}/10</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${(statistics.goalsAchieved / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Workout Streak</span>
                      <span className="font-bold text-green-600">{statistics.totalWorkouts} sessions</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${(statistics.totalWorkouts / 100) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Achievement Timeline</h3>
              <div className="space-y-4">
                {statistics.recentAchievements.map((achievement, index) => (
                  <div key={index} className="flex items-start">
                    <div className="flex flex-col items-center mr-4">
                      <div className="w-2 h-2 bg-[#de9151] rounded-full" />
                      {index !== statistics.recentAchievements.length - 1 && (
                        <div className="w-0.5 h-12 bg-gray-200" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{achievement.title}</p>
                      <p className="text-sm text-gray-500">{achievement.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )

      case 'progress':
        return (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Monthly Progress</h3>
              <div className="h-64">
                <div className="flex items-end h-48 gap-2">
                  {statistics.monthlyProgress.map((data, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-gradient-to-t from-[#de9151] to-[#f5b17b] rounded-t"
                        style={{
                          height: `${(data.appointments / 20) * 100}%`
                        }}
                      />
                      <span className="text-sm text-gray-600 mt-2">{data.month}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Progress Metrics</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-blue-800">Completion Rate</span>
                      <span className="text-sm font-medium text-blue-600">
                        {Math.round((statistics.completedAppointments / statistics.totalAppointments) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-blue-200 rounded-full">
                      <div 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${(statistics.completedAppointments / statistics.totalAppointments) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-purple-800">Client Retention</span>
                      <span className="text-sm font-medium text-purple-600">85%</span>
                    </div>
                    <div className="h-2 bg-purple-200 rounded-full">
                      <div 
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: '85%' }}
                      />
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Trend Analysis</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <TrendingUp className="w-5 h-5 text-green-500 mr-2" />
                      <span>Growth Rate</span>
                    </div>
                    <span className="font-bold text-green-600">+12%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Users className="w-5 h-5 text-blue-500 mr-2" />
                      <span>New Clients</span>
                    </div>
                    <span className="font-bold text-blue-600">+5</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Award className="w-5 h-5 text-yellow-500 mr-2" />
                      <span>Rating Trend</span>
                    </div>
                    <span className="font-bold text-yellow-600">+0.2</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-[#f9fafb]">
      <div className="w-64 bg-white border-r">
        <div className="p-4">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Statistics</h2>
          <nav className="space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as TabType)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === item.id
                      ? 'bg-[#de9151] text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </button>
              )
            })}
          </nav>
        </div>
      </div>
      <div className="flex-1 p-6 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  )
} 