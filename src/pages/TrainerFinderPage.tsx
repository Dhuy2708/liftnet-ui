import { useState } from "react"

export function TrainerFinderPage() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Find Your Perfect Trainer</h1>
      
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search trainers by name, specialty, or location..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DE9151]"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Trainer cards will be mapped here */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gray-200"></div>
            <div>
              <h3 className="font-semibold text-lg">John Doe</h3>
              <p className="text-gray-600">Personal Trainer</p>
            </div>
          </div>
          <p className="text-gray-700 mb-4">Specialized in strength training and weight loss programs.</p>
          <button className="w-full bg-[#DE9151] text-white py-2 rounded-md hover:bg-[#DE9151]/90 transition-colors">
            View Profile
          </button>
        </div>
      </div>
    </div>
  )
} 