import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/AuthStore";
import { toast } from "react-toastify";

export function SessionCheck() {
  const navigate = useNavigate();
  const checkSession = useAuthStore((state) => state.checkSession);

  useEffect(() => {
    const check = async () => {
      const isValid = await checkSession();
      if (!isValid) {
        toast.error("Session expired. Please login again.", {
          onClick: () => navigate("/auth"),
          closeOnClick: true,
          autoClose: false
        });
      }
    };

    // Only set up the interval, don't run initial check
    const interval = setInterval(check, 60000);

    return () => clearInterval(interval);
  }, [checkSession, navigate]);

  return null;
} 