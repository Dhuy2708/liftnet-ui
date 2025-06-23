"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnimatePresence, motion } from "framer-motion"
import { LoginForm } from "@/components/LoginForm"
import { RegisterForm } from "@/components/RegisterForm"
import { useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import {
  Dumbbell,
  Heart,
  Target,
  Trophy,
  Zap,
  Star,
  Activity,
  Timer,
  Users,
  TrendingUp,
  Award,
  Flame,
  CircleDot,
  Sparkles,
} from "lucide-react"

const floatingIconColors = [
  "text-purple-400/70",
  "text-blue-400/70",
  "text-pink-400/70",
  "text-indigo-400/70",
  "text-teal-400/70",
  "text-fuchsia-400/70",
  "text-cyan-400/70",
]

const FloatingIcon = ({ icon: Icon, delay = 0, duration = 4, className = "", size = 36, colorIndex = 0 }: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  delay?: number;
  duration?: number;
  className?: string;
  size?: number;
  colorIndex?: number;
}) => (
  <motion.div
    initial={{ y: 0, x: 0, opacity: 0.3 }}
    animate={{
      y: [-20, 20, -20],
      x: [-10, 10, -10],
      opacity: [0.3, 0.7, 0.3],
    }}
    transition={{
      duration,
      delay,
      repeat: Number.POSITIVE_INFINITY,
      ease: "easeInOut",
    }}
    className={`absolute ${className}`}
  >
    <Icon size={size} className={floatingIconColors[colorIndex % floatingIconColors.length]} />
  </motion.div>
)

const GlowOrb = ({ size = "w-32 h-32", position = "", delay = 0 }) => (
  <motion.div
    initial={{ scale: 0.8, opacity: 0.1 }}
    animate={{
      scale: [0.8, 1.2, 0.8],
      opacity: [0.1, 0.3, 0.1],
    }}
    transition={{
      duration: 6,
      delay,
      repeat: Number.POSITIVE_INFINITY,
      ease: "easeInOut",
    }}
    className={`absolute ${size} ${position} rounded-full bg-gradient-to-r from-orange-200/20 to-orange-300/20 blur-2xl`}
  />
)

export function AuthPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get("tab") || "login"
  const [activeTab, setActiveTab] = useState<string>(initialTab)
  const navigate = useNavigate()

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setSearchParams({ tab: value })
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-to-br from-orange-50 via-white to-amber-50">
      {/* Left Side - Branding & Decorations */}
      <div className="w-1/2 relative bg-gradient-to-br from-white via-orange-50/30 to-amber-50/50 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fillRule=%22evenodd%22%3E%3Cg fill=%22%23f97316%22 fillOpacity=%220.03%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40" />
        </div>

        {/* Floating Orbs */}
        <GlowOrb size="w-64 h-64" position="top-20 left-20" delay={0} />
        <GlowOrb size="w-48 h-48" position="bottom-32 right-16" delay={2} />
        <GlowOrb size="w-56 h-56" position="top-1/2 left-1/3" delay={4} />

        {/* Floating Icons - More icons as requested */}
        <FloatingIcon icon={Dumbbell} delay={0} className="top-16 left-16" size={40} colorIndex={0} />
        <FloatingIcon icon={Heart} delay={0.5} className="top-1/4 right-20" size={36} colorIndex={1} />
        <FloatingIcon icon={Target} delay={1} className="top-1/3 left-1/4" size={38} colorIndex={2} />
        <FloatingIcon icon={Trophy} delay={1.5} className="bottom-1/3 right-1/4" size={42} colorIndex={3} />
        <FloatingIcon icon={Zap} delay={2} className="top-1/2 right-32" size={34} colorIndex={4} />
        <FloatingIcon icon={Star} delay={2.5} className="bottom-1/4 left-20" size={36} colorIndex={5} />
        <FloatingIcon icon={Activity} delay={3} className="top-3/4 left-1/3" size={38} colorIndex={6} />
        <FloatingIcon icon={Timer} delay={3.5} className="top-20 right-1/3" size={36} colorIndex={0} />
        <FloatingIcon icon={Users} delay={4} className="bottom-20 right-20" size={40} colorIndex={1} />
        <FloatingIcon icon={TrendingUp} delay={4.5} className="top-2/3 left-16" size={36} colorIndex={2} />
        <FloatingIcon icon={Award} delay={5} className="bottom-1/2 left-1/2" size={38} colorIndex={3} />
        <FloatingIcon icon={Flame} delay={5.5} className="top-1/4 left-1/2" size={34} colorIndex={4} />
        <FloatingIcon icon={CircleDot} delay={6} className="bottom-1/4 right-1/3" size={32} colorIndex={5} />
        <FloatingIcon icon={Sparkles} delay={6.5} className="top-3/4 right-16" size={36} colorIndex={6} />

        {/* Main Content */}
        <div className="relative z-10 flex flex-col justify-center items-center h-full p-12">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-center space-y-8"
          >
            {/* Logo */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-200 to-orange-300 rounded-3xl blur-lg opacity-60" />
                <div className="relative p-6 bg-white/80 backdrop-blur-sm rounded-3xl border border-orange-100 shadow-xl">
                  <img src="https://res.cloudinary.com/dvwgt4tm1/image/upload/v1750584547/new_rd8xyq.png" alt="LiftNet Logo" className="h-20 object-contain" />
                </div>
              </div>
            </div>

            {/* Brand Text */}
            <div className="space-y-4">
              <h1 className="text-6xl font-bold text-gray-800 leading-tight">
                Lift The
                <br />
                <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                  Internet
                </span>
              </h1>
              <p className="text-xl text-gray-600 max-w-md leading-relaxed">
                Where fitness meets community. Connect, grow, and achieve your goals together.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100 rounded-2xl p-4 border border-blue-200 shadow-lg"
              >
                <Users className="w-8 h-8 mb-3 text-blue-500" />
                <p className="text-sm font-semibold text-blue-900">Connect</p>
                <p className="text-xs text-blue-700">Find workout partners</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-gradient-to-br from-pink-100 via-pink-50 to-fuchsia-100 rounded-2xl p-4 border border-pink-200 shadow-lg"
              >
                <Trophy className="w-8 h-8 mb-3 text-pink-500" />
                <p className="text-sm font-semibold text-pink-900">Achieve</p>
                <p className="text-xs text-pink-700">Track progress</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.6 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-gradient-to-br from-purple-100 via-purple-50 to-violet-100 rounded-2xl p-4 border border-purple-200 shadow-lg"
              >
                <Target className="w-8 h-8 mb-3 text-purple-500" />
                <p className="text-sm font-semibold text-purple-900">Focus</p>
                <p className="text-xs text-purple-700">Set clear goals</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.6 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-gradient-to-br from-teal-100 via-teal-50 to-cyan-100 rounded-2xl p-4 border border-teal-200 shadow-lg"
              >
                <TrendingUp className="w-8 h-8 mb-3 text-teal-500" />
                <p className="text-sm font-semibold text-teal-900">Grow</p>
                <p className="text-xs text-teal-700">Level up daily</p>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1200 120" className="w-full h-16 text-orange-100/50">
            <path
              d="M0,60 C300,120 900,0 1200,60 L1200,120 L0,120 Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </div>

      {/* Right Side - Authentication Form */}
      <div className="w-1/2 flex items-center justify-center p-8 bg-white relative">
        {/* Subtle background decoration */}
        <div className="absolute inset-0 bg-gradient-to-bl from-orange-50/30 via-transparent to-transparent" />
        
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-lg relative z-10"
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              {activeTab === "login" ? "Welcome Back" : "Join LiftNet"}
            </h2>
       
          </motion.div>

          {/* Auth Card */}
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-8">
              {/* Tabs */}
              <Tabs defaultValue="login" value={activeTab} onValueChange={handleTabChange} className="w-full">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                >
                  <TabsList className="grid grid-cols-2 w-full mb-8 bg-gray-50 p-1 rounded-2xl h-12">
                    <TabsTrigger
                      value="login"
                      className="rounded-xl font-semibold text-sm transition-all duration-300 data-[state=active]:bg-white data-[state=active]:text-orange-500 data-[state=active]:shadow-sm"
                    >
                      Sign In
                    </TabsTrigger>
                    <TabsTrigger
                      value="register"
                      className="rounded-xl font-semibold text-sm transition-all duration-300 data-[state=active]:bg-white data-[state=active]:text-orange-500 data-[state=active]:shadow-sm"
                    >
                      Sign Up
                    </TabsTrigger>
                  </TabsList>
                </motion.div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: activeTab === "login" ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: activeTab === "login" ? 20 : -20 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    {activeTab === "login" ? (
                      <div>
                        <LoginForm onSuccess={() => navigate("/")} />
                        <div className="mt-6 text-center">
                          <p className="text-sm text-gray-600">
                            {"Don't have an account? "}
                            <button
                              onClick={() => setActiveTab("register")}
                              className="text-orange-500 hover:text-orange-600 font-semibold transition-colors duration-200 hover:underline"
                            >
                              Join the community
                            </button>
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <RegisterForm onSuccess={() => setActiveTab("login")} />
                        <div className="mt-6 text-center">
                          <p className="text-sm text-gray-600">
                            Already part of the family?{" "}
                            <button
                              onClick={() => setActiveTab("login")}
                              className="text-orange-500 hover:text-orange-600 font-semibold transition-colors duration-200 hover:underline"
                            >
                              Welcome back
                            </button>
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </Tabs>
            </div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="text-center text-xs text-gray-500 mt-6"
          >
            &copy; {new Date().getFullYear()} LiftNet. Made with ❤️ for fitness enthusiasts
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}
