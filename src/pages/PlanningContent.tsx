import { Card, CardContent } from "@/components/ui/chatbot/card"
import { Calendar } from "lucide-react"

const PlanningContent = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-purple-50/20 to-pink-50/30">
        <CardContent className="p-12">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto shadow-xl">
              <Calendar className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900">Smart Workout Planning</h3>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
              AI-powered workout plans tailored to your goals, schedule, and fitness level will be generated
              here. Experience personalized training like never before.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PlanningContent 