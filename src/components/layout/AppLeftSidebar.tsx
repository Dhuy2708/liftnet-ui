import { Users, Bookmark, Bot, UserCircle } from "lucide-react"
import React from "react"

export function AppLeftSidebar({ show }: { show?: boolean }) {
  return (
    <aside
      className={`hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 pt-12 z-30
      transition-all duration-500 ease-out
      ${show ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}
      style={{ background: 'linear-gradient(to right, #fff 0%, #f9fafb 40%, #f9fafb 100%)' }}
    >
      {/* Blurred accent background */}
      <div className="absolute -top-16 -left-10 w-56 h-56 bg-[#de9151] opacity-20 rounded-full blur-2xl z-0" />
      <nav className="flex-1 px-6 py-8 overflow-y-auto relative z-10">
        <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><span className="w-2 h-2 bg-[#de9151] rounded-full inline-block"></span>Quick Access</h3>
        <ul className="space-y-2 text-[15px] mb-6">
          <li className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 rounded-lg px-2 py-2 transition">
            <Users className="w-5 h-5 text-blue-500" />
            <span>Groups</span>
          </li>
          <li className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 rounded-lg px-2 py-2 transition">
            <Bookmark className="w-5 h-5 text-purple-500" />
            <span>Saved Posts</span>
          </li>
          <li className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 rounded-lg px-2 py-2 transition">
            <Bot className="w-5 h-5 text-green-500" />
            <span>AI Assistant</span>
          </li>
        </ul>
        <hr className="border-gray-200 my-4" />
        <section className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><span className="w-2 h-2 bg-[#de9151] rounded-full inline-block"></span>My Groups</h3>
          <ul className="space-y-2">
            {["Yoga Lovers", "HIIT Squad", "Runners Club"].map((group, i) => (
              <li key={i} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 rounded-lg px-2 py-1.5 transition">
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                <span className="truncate">{group}</span>
              </li>
            ))}
          </ul>
        </section>
        <hr className="border-gray-200 my-4" />
        <section>
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><span className="w-2 h-2 bg-[#de9151] rounded-full inline-block"></span>Leaderboard</h3>
          <ul className="space-y-2">
            {[
              { name: "Alice", score: 120 },
              { name: "Bob", score: 110 },
              { name: "Charlie", score: 95 }
            ].map((user, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className={`font-bold text-lg ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-500' : 'text-orange-700'}`}>{i + 1}</span>
                <UserCircle className="w-6 h-6 text-gray-300" />
                <span className="truncate flex-1">{user.name}</span>
                <span className="text-xs text-gray-500 font-semibold">{user.score}</span>
              </li>
            ))}
          </ul>
        </section>
      </nav>
    </aside>
  )
} 