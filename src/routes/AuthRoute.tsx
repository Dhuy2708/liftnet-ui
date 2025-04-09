import { useAuthStore } from "@/store/AuthStore";
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";

interface AuthRouteProps {
  children: ReactNode;
}

export const AuthRoute = ({ children }: AuthRouteProps) => {
  const { user } = useAuthStore();

  // Kiểm tra xem user có tồn tại và có dữ liệu hợp lệ
  if (user) { // Thêm điều kiện kiểm tra token
    return <Navigate to="/" replace />;
  }

  return <>{children}</>; // Giữ nguyên trang hiện tại nếu không có user hợp lệ
};