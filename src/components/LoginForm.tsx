"use client"

import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AtSign, Lock, Loader2, Eye, EyeOff, ArrowRight } from "lucide-react"
import { FcGoogle } from "react-icons/fc"
import { FaFacebook, FaApple } from "react-icons/fa"
import { useAuthStore } from "@/store/AuthStore"
import { toast } from "react-hot-toast"
import { motion } from "framer-motion"

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
})

type LoginFormValues = z.infer<typeof loginSchema>

interface LoginFormProps {
  onSuccess: () => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const login = useAuthStore((state) => state.login)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true)

    try {
      console.log("Login data:", data)
      await login(data.email, data.password)

      const user = useAuthStore.getState().user
      if (user) {
        const basicInfoSuccess = await useAuthStore.getState().getBasicInfo()
        if (basicInfoSuccess) {
          onSuccess()
        } else {
          toast.error("Failed to fetch user information")
        }
      } else {
        const error = useAuthStore.getState().error
        toast.error(error || "Login failed. Please try again.")
      }
    } catch (error) {
      console.error("Login failed:", error)
      toast.error("Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-5"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <AtSign size={16} className="text-orange-500" />
            Email Address
          </Label>
          <div className="relative group">
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              className="h-12 border-2 border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 rounded-xl transition-all duration-300 bg-gray-50/50 focus:bg-white"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <motion.p
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-sm text-red-500 font-medium"
            >
              {errors.email.message}
            </motion.p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Lock size={16} className="text-orange-500" />
              Password
            </Label>
            <Button
              variant="link"
              className="p-0 h-auto text-xs text-orange-500 hover:text-orange-600 font-semibold"
              type="button"
            >
              Forgot password?
            </Button>
          </div>
          <div className="relative group">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className="h-12 border-2 border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 rounded-xl transition-all duration-300 bg-gray-50/50 focus:bg-white pr-12"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors duration-200"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <motion.p
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-sm text-red-500 font-medium"
            >
              {errors.password.message}
            </motion.p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-12 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] group mt-6"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign In
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
            </>
          )}
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-4 text-gray-500 font-semibold">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Button
          variant="outline"
          type="button"
          className="h-12 border-2 border-gray-200 hover:border-orange-300 hover:bg-orange-50 rounded-xl transition-all duration-300 group"
        >
          <FcGoogle size={20} className="group-hover:scale-110 transition-transform duration-200" />
        </Button>
        <Button
          variant="outline"
          type="button"
          className="h-12 border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 rounded-xl transition-all duration-300 group"
        >
          <FaFacebook size={20} className="text-blue-600 group-hover:scale-110 transition-transform duration-200" />
        </Button>
        <Button
          variant="outline"
          type="button"
          className="h-12 border-2 border-gray-200 hover:border-gray-400 hover:bg-gray-50 rounded-xl transition-all duration-300 group"
        >
          <FaApple size={20} className="text-gray-800 group-hover:scale-110 transition-transform duration-200" />
        </Button>
      </div>
    </motion.div>
  )
}
