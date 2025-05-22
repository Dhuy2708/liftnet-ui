import { CalendarDays, Sparkles, UserCircle, Gift } from "lucide-react"
import { cn } from "@/lib/utils"

export function AppRightSidebar({ show = true }: { show?: boolean }) {
  return (
    <aside
      className={cn(
        "fixed right-0 top-0 h-full w-80 pt-12 z-30",
        "hidden xl:flex flex-col transition-all duration-500 ease-in-out",
        "bg-white border-l border-gray-100",
        show ? "translate-x-0" : "translate-x-80",
      )}
    >
      {/* Decorative elements */}
      <div className="absolute -top-16 -right-10 w-56 h-56 bg-[#DE9151] opacity-10 rounded-full blur-3xl z-0" />
      <div className="absolute top-1/3 -left-10 w-20 h-20 bg-black opacity-5 rounded-full blur-2xl z-0" />

      <div className="flex-1 px-6 py-8 overflow-y-auto relative z-10">
        <section className="mb-8">
          <h3 className="font-medium text-xs uppercase tracking-wider text-gray-400 mb-4 pl-2">Friend Suggestions</h3>

          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80 border border-gray-100 hover:bg-white hover:shadow-sm transition-all duration-300"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100">
                  <UserCircle className="w-7 h-7 text-gray-300" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-base text-gray-800">User {i}</div>
                  <div className="text-sm text-gray-500">3 mutual friends</div>
                </div>
                <button className="text-xs bg-white text-[#DE9151] px-3 py-1.5 rounded-full hover:bg-[#DE9151] hover:text-white border border-[#DE9151]/20 transition-colors duration-300 shadow-sm">
                  Add
                </button>
              </div>
            ))}
          </div>
        </section>

        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-6" />

        <section className="mb-8">
          <h3 className="font-medium text-xs uppercase tracking-wider text-gray-400 mb-4 pl-2">Who's Online</h3>

          <div className="flex flex-wrap gap-4 justify-center">
            {["Anna", "Ben", "Chris", "Dana"].map((name, i) => (
              <div key={i} className="flex flex-col items-center group">
                <div className="relative">
                  <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white shadow-sm border border-gray-100 group-hover:border-[#DE9151]/20 group-hover:shadow transition-all duration-300">
                    <UserCircle className="w-10 h-10 text-gray-300" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#DE9151] border-2 border-white rounded-full"></span>
                </div>
                <span className="text-base text-gray-600 mt-2 font-medium">{name}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-6" />

        <section className="mb-8">
          <h3 className="font-medium text-xs uppercase tracking-wider text-gray-400 mb-4 pl-2">Birthday Reminders</h3>

          <div className="space-y-3">
            {[
              { name: "Emily", date: "Today" },
              { name: "Frank", date: "Tomorrow" },
            ].map((user, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80 border border-gray-100 hover:bg-white hover:shadow-sm transition-all duration-300"
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white text-[#DE9151] shadow-sm border border-gray-50">
                  <Gift className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-base text-gray-800">{user.name}</div>
                  <div className="text-sm text-gray-500">{user.date}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-6" />

        <section className="mb-8">
          <h3 className="font-medium text-xs uppercase tracking-wider text-gray-400 mb-4 pl-2">Upcoming Events</h3>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow transition-all duration-300">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white text-[#DE9151] shadow-sm border border-[#DE9151]/10">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div className="font-medium text-base text-gray-800">Yoga Class</div>
              </div>
              <div className="text-sm text-gray-500 ml-12">Tomorrow, 7:00 AM</div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow transition-all duration-300">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white text-[#DE9151] shadow-sm border border-[#DE9151]/10">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="font-medium text-base text-gray-800">AI Q&A Live</div>
              </div>
              <div className="text-sm text-gray-500 ml-12">Friday, 8:00 PM</div>
            </div>
          </div>
        </section>

        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-6" />

        <section>
          <h3 className="font-medium text-xs uppercase tracking-wider text-gray-400 mb-4 pl-2">Motivational Quote</h3>

          <div className="p-5 rounded-xl bg-gradient-to-br from-[#DE9151]/5 to-white border border-[#DE9151]/10 shadow-sm">
            <p className="italic text-base text-gray-700 leading-relaxed">
              "The only bad workout is the one that didn't happen."
            </p>
            <div className="flex items-center mt-3">
              <div className="h-px flex-1 bg-[#DE9151]/10"></div>
              <p className="text-xs text-gray-500 mx-2">Unknown</p>
              <div className="h-px flex-1 bg-[#DE9151]/10"></div>
            </div>
          </div>
        </section>
      </div>
    </aside>
  )
}
