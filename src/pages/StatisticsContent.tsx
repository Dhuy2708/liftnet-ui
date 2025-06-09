import { Card, CardContent } from "@/components/ui/chatbot/card"
import { BarChart3, TrendingUp, Target, Activity } from "lucide-react"

const StatisticsContent = () => {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-blue-50/30 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 text-sm">Progress</h3>
                <p className="text-3xl font-bold text-blue-600">+15%</p>
                <p className="text-xs text-gray-500">vs last month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-green-50/30 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Target className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 text-sm">Goals Met</h3>
                <p className="text-3xl font-bold text-green-600">8/10</p>
                <p className="text-xs text-gray-500">this week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-purple-50/30 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Activity className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 text-sm">Avg Score</h3>
                <p className="text-3xl font-bold text-purple-600">92</p>
                <p className="text-xs text-gray-500">fitness level</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-orange-50/20 to-amber-50/30">
        <CardContent className="p-12">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-gradient-to-br from-[#de9151] to-[#f4a261] rounded-3xl flex items-center justify-center mx-auto shadow-xl">
              <BarChart3 className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900">Advanced Analytics Coming Soon</h3>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
              Detailed anatomical views, muscle group analysis, and personalized insights will be available
              here. Get ready for the most comprehensive fitness tracking experience.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default StatisticsContent 