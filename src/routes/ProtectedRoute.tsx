import { useAuthStore } from "@/store/AuthStore";
import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, basicInfo, getBasicInfo } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Only fetch basic info if we have a user but no basic info
    if (user && !basicInfo) {
      getBasicInfo();
    }
  }, [user, basicInfo, getBasicInfo, navigate]);

  if (!user || !basicInfo) {
    return null;
  }

  return <>{children}</>;
};
