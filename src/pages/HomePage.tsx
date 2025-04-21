import { useAuthStore } from "@/store/AuthStore"

export function HomePage() {
  const { basicInfo } = useAuthStore()

  if (!basicInfo) {
    return null
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-4">
            Welcome, {basicInfo.firstName} {basicInfo.lastName}
          </h1>

          <div className="mb-4">
            <p className="text-gray-600">
              Role: {basicInfo.role === 1 ? "Seeker" : basicInfo.role === 2 ? "Personal Trainer" : "Admin"}
            </p>
          </div>

          {/* Common content for both Seeker and PT */}
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-3">Dashboard</h2>
            <p className="text-gray-600">
              {basicInfo.role === 1
                ? "Welcome to your seeker dashboard! Here you can find trainers and manage your fitness journey."
                : "Welcome to your PT dashboard! Here you can manage your clients and training sessions."}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
