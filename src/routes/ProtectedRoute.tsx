import { useAuthStore } from "@/store/AuthStore";
import { ReactNode } from "react";


interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user} = useAuthStore();

  if (!user) {
    return (
      <div>
        User don't have access to this page
      </div>
    );
  }

  return <>{children}</>;
};
