import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/AuthStore";

export function SessionCheck() {
  const navigate = useNavigate();
  const checkSession = useAuthStore((state) => state.checkSession);
  const logout = useAuthStore((state) => state.logout);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const check = async () => {
      const isValid = await checkSession();
      if (!isValid) {
        setOpen(true);
      }
    };

    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [checkSession]);

  const handleOk = async () => {
    setOpen(false);
    await logout();
    navigate("/auth");
  };

  return (
    open ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
        <div className="bg-white rounded-lg shadow-xl p-6 min-w-[320px] max-w-[90vw]">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-red-500 text-2xl">&#9888;</span>
            <span className="text-lg font-medium">Session expired. Please login again.</span>
          </div>
          <div className="flex justify-end">
            <button
              className="px-4 py-2 bg-[#de9151] text-white rounded hover:bg-[#c27339] focus:outline-none"
              onClick={handleOk}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    ) : null
  );
} 