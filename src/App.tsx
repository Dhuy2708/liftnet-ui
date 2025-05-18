import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "./App.css"
import { AuthPage } from "./pages/AuthPage"
import { AuthRoute } from "./routes/AuthRoute"
import { FeedPage } from "./pages/FeedPage"
import { ProfilePage } from "./pages/ProfilePage"
import { ProtectedRoute } from "./routes/ProtectedRoute"
import { CommonAppLayout } from "./components/layout/app-layout"
import { AppointmentsPage } from "./pages/AppointmentsPage"
import { SchedulePage } from "./pages/SchedulePage"
import { LargeAppLayout } from "./components/layout/large-app-layout"
import { SessionCheck } from "./components/SessionCheck"
import { TopBar } from "./components/topbar/topbar"
import { useEffect } from "react"
import { signalRService } from "./services/signalRService"
import { useAuthStore } from "./store/AuthStore"
import { ChatPage } from "./pages/ChatPage"
import { TopBarOnlyLayout } from "./components/layout/topbar-only"

function AppContent() {
  const location = useLocation();
  const isAuthPage = location.pathname === "/auth";
  const { basicInfo } = useAuthStore();

  useEffect(() => {
    if (basicInfo) {
      signalRService.startConnection();
    }
  }, [basicInfo]);

  return (
    <>
      <ToastContainer />
      {!isAuthPage && <SessionCheck />}
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <CommonAppLayout>
                <FeedPage />
              </CommonAppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <CommonAppLayout>
                <ProfilePage />
              </CommonAppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile/:userId"
          element={
            <ProtectedRoute>
              <CommonAppLayout>
                <ProfilePage />
              </CommonAppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <TopBarOnlyLayout>
                <ChatPage />
              </TopBarOnlyLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat/:conversationId"
          element={
            <ProtectedRoute>
              <TopBarOnlyLayout>
                <ChatPage />
              </TopBarOnlyLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/appointments"
          element={
            <ProtectedRoute>
              <LargeAppLayout>
                <AppointmentsPage />
              </LargeAppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/appointments/:appointmentId"
          element={
            <ProtectedRoute>
              <LargeAppLayout>
                <AppointmentsPage />
              </LargeAppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/schedule"
          element={
            <ProtectedRoute>
              <LargeAppLayout>
                <SchedulePage />
              </LargeAppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/auth"
          element={
            <AuthRoute>
              <AuthPage />
            </AuthRoute>
          }
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App
