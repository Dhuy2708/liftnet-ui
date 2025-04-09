import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatePresence, motion } from "framer-motion"
import { LoginForm } from "@/components/LoginForm";
import { RegisterForm } from "@/components/RegisterForm";
import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export function AuthPage() {
   const [searchParams, setSearchParams] = useSearchParams(); 
   const initialTab = searchParams.get("tab") || "login"; 
   const [activeTab, setActiveTab] = useState<string>(initialTab);
   const navigate = useNavigate();

  const handleTabChange = (value: string) => {
     setActiveTab(value);
     setSearchParams({ tab: value }); 
   };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-[#FEF9F3]-500/20 to-[#FEF9F3]-700/30">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-5">
            <h1 className="text-2xl font-bold text-center text-gray-800">
              Welcome to LiftNet
            </h1>
            <p className="text-center text-gray-600 mt-1">
              Connect with friends and the world around you
            </p>
          </div>

            <Tabs
              defaultValue="login"
              value={activeTab}
              onValueChange={handleTabChange}
              className="w-full"
            >
            <div className="px-5">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
            </div>

            <motion.div
              key={activeTab}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.6 }}
              className="p-5"
            >
              <AnimatePresence mode="wait">
                {activeTab === "login" ? (
                  <motion.div
                    key="login"
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <LoginForm onSuccess={() => navigate("/")} />
                    <div className="mt-4 text-center text-sm text-gray-600">
                      Don&apos;t have an account?{" "}
                      <button
                        onClick={() => setActiveTab("register")}
                        className="text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Register now
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="register"
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <RegisterForm onSuccess={() => setActiveTab("login")} />
                    <div className="mt-4 text-center text-sm text-gray-600">
                      Already have an account?{" "}
                      <button
                        onClick={() => setActiveTab("login")}
                        className="text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Login
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </Tabs>
        </div>

        <p className="text-center text-xs text-gray-600 mt-4">
          &copy; {new Date().getFullYear()} LiftNet. All rights reserved.
        </p>
      </div>
    </div>
  );
}
