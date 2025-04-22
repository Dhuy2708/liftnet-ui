import { Navigate } from "react-router-dom"
import { useAuthStore } from "@/store/AuthStore"
import { useEffect } from "react"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, basicInfo, setBasicInfo } = useAuthStore()

  useEffect(() => {
    // If we don't have basicInfo in the store, try to get it from localStorage
    if (!basicInfo) {
      const storedBasicInfo = localStorage.getItem('basicInfo')
      if (storedBasicInfo) {
        setBasicInfo(JSON.parse(storedBasicInfo))
      }
    }
  }, [basicInfo, setBasicInfo])

  if (!user) {
    return <Navigate to="/auth" />
  }

  return <>{children}</>
}
