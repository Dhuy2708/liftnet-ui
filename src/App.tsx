import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "./App.css"
import { AuthPage } from "./pages/AuthPage"
import { AuthRoute } from "./routes/AuthRoute"
import { FeedContainer } from "./pages/FeedContainer"
import { ProfilePage } from "./pages/ProfilePage"
import { ProtectedRoute } from "./routes/ProtectedRoute"
import { CommonAppLayout } from "./components/layout/app-layout"
import { AppointmentsPage } from "./pages/AppointmentsPage"
import { SchedulePage } from "./pages/SchedulePage"
import { LargeAppLayout } from "./components/layout/large-app-layout"
import { SessionCheck } from "./components/SessionCheck"
import { useEffect } from "react"
import { signalRService } from "./services/signalRService"
import { useAuthStore } from "./store/AuthStore"
import { ChatPage } from "./pages/ChatPage"
import { TopBarOnlyLayout } from "./components/layout/topbar-only"
import { StatisticsPage } from "./pages/StatisticsPage"
import AiChatPage from "./pages/AiChatPage"
import TrainerFinderPage  from "./pages/TrainerFinderPage"
import ExploreFindersPage  from "./pages/ExploreFindersPage"

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
                <FeedContainer />
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
          path="/ai-assistant"
          element={
            <ProtectedRoute>
              <LargeAppLayout>
                <AiChatPage />
              </LargeAppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/ai-assistant/statistic"
          element={
            <ProtectedRoute>
              <LargeAppLayout>
                <AiChatPage />
              </LargeAppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/ai-assistant/planning"
          element={
            <ProtectedRoute>
              <LargeAppLayout>
                <AiChatPage />
              </LargeAppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/ai-assistant/physical-stats"
          element={
            <ProtectedRoute>
              <LargeAppLayout>
                <AiChatPage />
              </LargeAppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/ai-assistant/ai-coach"
          element={
            <ProtectedRoute>
              <LargeAppLayout>
                <AiChatPage />
              </LargeAppLayout>
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
          path="/statistics"
          element={
            <ProtectedRoute>
              <LargeAppLayout>
                <StatisticsPage />
              </LargeAppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/trainer-finder"
          element={
            <ProtectedRoute>
              <LargeAppLayout>
                <TrainerFinderPage />
              </LargeAppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/trainer-finder/:postId"
          element={
            <ProtectedRoute>
              <LargeAppLayout>
                <TrainerFinderPage />
              </LargeAppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/explore-finders"
          element={
            <ProtectedRoute>
              <LargeAppLayout>
                <ExploreFindersPage />
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
