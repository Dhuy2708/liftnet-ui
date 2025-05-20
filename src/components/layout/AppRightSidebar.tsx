import { CalendarDays, Sparkles, UserCircle } from "lucide-react"
import React from "react"

export function AppRightSidebar({ show }: { show?: boolean }) {
  return (
    <aside
      className={`hidden xl:flex flex-col fixed right-0 top-0 h-full w-80 pt-12 z-30
      transition-all duration-500 ease-out
      ${show ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
      style={{ background: 'linear-gradient(to left, #fff 0%, #f9fafb 40%, #f9fafb 100%)' }}
    >
      {/* Blurred accent background */}
      <div className="absolute -top-16 -right-10 w-56 h-56 bg-[#de9151] opacity-20 rounded-full blur-2xl z-0" />
      <div className="flex-1 px-6 py-8 overflow-y-auto relative z-10">
        <section className="mb-8">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><span className="w-2 h-2 bg-[#de9151] rounded-full inline-block"></span>Friend Suggestions</h3>
          <ul className="space-y-3">
            {[1,2,3].map(i => (
              <li key={i} className="flex items-center gap-3">
                <UserCircle className="w-8 h-8 text-gray-300" />
                <div className="flex-1">
                  <div className="font-medium text-gray-700">User {i}</div>
                  <button className="text-xs text-blue-600 hover:underline">Add Friend</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
        <hr className="border-gray-200 my-6" />
        <section className="mb-8">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><span className="w-2 h-2 bg-[#de9151] rounded-full inline-block"></span>Who's Online</h3>
          <ul className="flex flex-wrap gap-3">
            {["Anna", "Ben", "Chris", "Dana"].map((name, i) => (
              <li key={i} className="flex flex-col items-center">
                <span className="relative">
                  <UserCircle className="w-8 h-8 text-gray-300" />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></span>
                </span>
                <span className="text-xs text-gray-600 mt-1">{name}</span>
              </li>
            ))}
          </ul>
        </section>
        <hr className="border-gray-200 my-6" />
        <section className="mb-8">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><span className="w-2 h-2 bg-[#de9151] rounded-full inline-block"></span>Birthday Reminders</h3>
          <ul className="space-y-2">
            {[
              { name: "Emily", date: "Today" },
              { name: "Frank", date: "Tomorrow" }
            ].map((user, i) => (
              <li key={i} className="flex items-center gap-2">
                <UserCircle className="w-6 h-6 text-gray-300" />
                <span className="truncate flex-1">{user.name}</span>
                <span className="text-xs text-gray-500">{user.date}</span>
              </li>
            ))}
          </ul>
        </section>
        <hr className="border-gray-200 my-6" />
        <section className="mb-8">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><span className="w-2 h-2 bg-[#de9151] rounded-full inline-block"></span>Upcoming Events</h3>
          <ul className="space-y-2">
            <li className="flex items-center gap-3">
              <CalendarDays className="w-5 h-5 text-orange-500" />
              <div>
                <div className="font-medium text-gray-700">Yoga Class</div>
                <div className="text-xs text-gray-500">Tomorrow, 7:00 AM</div>
              </div>
            </li>
            <li className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-pink-500" />
              <div>
                <div className="font-medium text-gray-700">AI Q&A Live</div>
                <div className="text-xs text-gray-500">Friday, 8:00 PM</div>
              </div>
            </li>
          </ul>
        </section>
        <hr className="border-gray-200 my-6" />
        <section>
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><span className="w-2 h-2 bg-[#de9151] rounded-full inline-block"></span>Motivational Quote</h3>
          <div className="italic text-gray-500 text-sm">“The only bad workout is the one that didn't happen.”</div>
        </section>
      </div>
    </aside>
  )
} 