import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatePresence, motion } from "framer-motion"
import { LoginForm } from "@/components/LoginForm";
import { RegisterForm } from "@/components/RegisterForm";
import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const LiftingMan = ({ delay = 0, size = 32 }) => (
  <motion.div
    initial={{ y: 0 }}
    animate={{ y: [0, -20, 0] }}
    transition={{
      duration: 2,
      delay,
      repeat: Infinity,
      ease: "easeInOut"
    }}
    className={`w-${size} h-${size}`}
  >
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <motion.circle
        cx="100"
        cy="50"
        r="15"
        fill="white"
        stroke="black"
        strokeWidth="2"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.path
        d="M100,65 L100,120"
        stroke="black"
        strokeWidth="3"
        fill="none"
        animate={{ pathLength: [0, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.path
        d="M100,120 L70,150"
        stroke="black"
        strokeWidth="3"
        fill="none"
        animate={{ rotate: [-10, 10, -10] }}
        transition={{ duration: 2, repeat: Infinity }}
        transform-origin="100 120"
      />
      <motion.path
        d="M100,120 L130,150"
        stroke="black"
        strokeWidth="3"
        fill="none"
        animate={{ rotate: [10, -10, 10] }}
        transition={{ duration: 2, repeat: Infinity }}
        transform-origin="100 120"
      />
      <motion.rect
        x="70"
        y="40"
        width="60"
        height="20"
        rx="10"
        fill="orange"
        stroke="black"
        strokeWidth="2"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </svg>
  </motion.div>
);

const SquattingMan = ({ delay = 0, size = 28 }) => (
  <motion.div
    initial={{ y: 0 }}
    animate={{ y: [0, 20, 0] }}
    transition={{
      duration: 2,
      delay,
      repeat: Infinity,
      ease: "easeInOut"
    }}
    className={`w-${size} h-${size}`}
  >
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <motion.circle
        cx="100"
        cy="50"
        r="15"
        fill="white"
        stroke="black"
        strokeWidth="2"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.path
        d="M100,65 L100,120"
        stroke="black"
        strokeWidth="3"
        fill="none"
        animate={{ pathLength: [0, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.path
        d="M100,120 L70,170"
        stroke="black"
        strokeWidth="3"
        fill="none"
        animate={{ rotate: [0, 30, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        transform-origin="100 120"
      />
      <motion.path
        d="M100,120 L130,170"
        stroke="black"
        strokeWidth="3"
        fill="none"
        animate={{ rotate: [0, -30, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        transform-origin="100 120"
      />
      <motion.rect
        x="70"
        y="40"
        width="60"
        height="20"
        rx="10"
        fill="orange"
        stroke="black"
        strokeWidth="2"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </svg>
  </motion.div>
);

const PushupMan = ({ delay = 0, size = 24 }) => (
  <motion.div
    initial={{ y: 0 }}
    animate={{ y: [0, -10, 0] }}
    transition={{
      duration: 1.5,
      delay,
      repeat: Infinity,
      ease: "easeInOut"
    }}
    className={`w-${size} h-${size}`}
  >
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <motion.circle
        cx="100"
        cy="50"
        r="15"
        fill="white"
        stroke="black"
        strokeWidth="2"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <motion.path
        d="M100,65 L100,120"
        stroke="black"
        strokeWidth="3"
        fill="none"
        animate={{ pathLength: [0, 1, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <motion.path
        d="M100,120 L70,150"
        stroke="black"
        strokeWidth="3"
        fill="none"
        animate={{ rotate: [-20, 20, -20] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        transform-origin="100 120"
      />
      <motion.path
        d="M100,120 L130,150"
        stroke="black"
        strokeWidth="3"
        fill="none"
        animate={{ rotate: [20, -20, 20] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        transform-origin="100 120"
      />
      <motion.rect
        x="70"
        y="40"
        width="60"
        height="20"
        rx="10"
        fill="orange"
        stroke="black"
        strokeWidth="2"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
    </svg>
  </motion.div>
);

const RunningMan = ({ delay = 0, size = 32 }) => (
  <motion.div
    initial={{ x: -50 }}
    animate={{ x: 50 }}
    transition={{
      duration: 3,
      delay,
      repeat: Infinity,
      ease: "linear"
    }}
    className={`w-${size} h-${size}`}
  >
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <motion.circle
        cx="100"
        cy="50"
        r="15"
        fill="white"
        stroke="black"
        strokeWidth="2"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <motion.path
        d="M100,65 L100,120"
        stroke="black"
        strokeWidth="3"
        fill="none"
        animate={{ pathLength: [0, 1, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <motion.path
        d="M100,120 L70,150"
        stroke="black"
        strokeWidth="3"
        fill="none"
        animate={{ rotate: [-30, 30, -30] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        transform-origin="100 120"
      />
      <motion.path
        d="M100,120 L130,150"
        stroke="black"
        strokeWidth="3"
        fill="none"
        animate={{ rotate: [30, -30, 30] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        transform-origin="100 120"
      />
      <motion.rect
        x="70"
        y="40"
        width="60"
        height="20"
        rx="10"
        fill="orange"
        stroke="black"
        strokeWidth="2"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
    </svg>
  </motion.div>
);

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
      <div className="absolute inset-0 grid grid-cols-3 gap-4 p-8">
        <div className="flex flex-col gap-8 items-center">
          <LiftingMan delay={0} size={32} />
          <SquattingMan delay={0.2} size={28} />
          <PushupMan delay={0.4} size={24} />
          <RunningMan delay={0.6} size={32} />
          <LiftingMan delay={0.8} size={28} />
        </div>
        <div className="flex flex-col gap-8 items-center">
          <RunningMan delay={0.1} size={28} />
          <LiftingMan delay={0.3} size={24} />
          <SquattingMan delay={0.5} size={32} />
          <PushupMan delay={0.7} size={28} />
          <RunningMan delay={0.9} size={24} />
        </div>
        <div className="flex flex-col gap-8 items-center">
          <PushupMan delay={0.2} size={32} />
          <RunningMan delay={0.4} size={24} />
          <LiftingMan delay={0.6} size={28} />
          <SquattingMan delay={0.8} size={20} />
          <PushupMan delay={1} size={32} />
        </div>
      </div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden">
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
