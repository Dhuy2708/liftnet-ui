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
import { WalletPage } from "./pages/WalletPage"
import { TopUpPage } from "./pages/TopUpPage"
import { WithdrawPage } from "./pages/WithdrawPage"
import { PaymentCallbackPage } from "./pages/PaymentCallbackPage"
import { Toaster } from "sonner"
import SuggestionsPage from './pages/SuggestionsPage'
import { useNotificationHub } from "./hooks/useNotificationHub"
import { SeekerRecommendationsPage } from "./pages/SeekerRecommendationsPage"

function AppContent() {
  const location = useLocation();
  const isAuthPage = location.pathname === "/auth";
  const { basicInfo } = useAuthStore();
  useNotificationHub();

  useEffect(() => {
    if (basicInfo) {
      signalRService.startConnection("chat-hub");
      signalRService.startConnection("noti-hub");
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
          path="/plan-ai"
          element={
            <ProtectedRoute>
              <LargeAppLayout>
                <AiChatPage />
              </LargeAppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/plan-ai/statistic"
          element={
            <ProtectedRoute>
              <LargeAppLayout>
                <AiChatPage />
              </LargeAppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/plan-ai/planning"
          element={
            <ProtectedRoute>
              <LargeAppLayout>
                <AiChatPage />
              </LargeAppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/plan-ai/physical-stats"
          element={
            <ProtectedRoute>
              <LargeAppLayout>
                <AiChatPage />
              </LargeAppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/plan-ai/exercises"
          element={
            <ProtectedRoute>
              <LargeAppLayout>
                <AiChatPage />
              </LargeAppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/plan-ai/chat"
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
          path="/wallet"
          element={
            <ProtectedRoute>
              <LargeAppLayout>
                <WalletPage />
              </LargeAppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/topup"
          element={
            <ProtectedRoute>
              <LargeAppLayout>
                <TopUpPage />
              </LargeAppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/withdraw"
          element={
            <ProtectedRoute>
              <LargeAppLayout>
                <WithdrawPage />
              </LargeAppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/payment-callback"
          element={
            <ProtectedRoute>
              <LargeAppLayout>
                <PaymentCallbackPage />
              </LargeAppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/friends/suggestions"
          element={
            <ProtectedRoute>
              <LargeAppLayout>
                <SuggestionsPage />
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

        <Route
          path="/seeker-recommendations"
          element={
            <ProtectedRoute>
              <LargeAppLayout>
                <SeekerRecommendationsPage />
              </LargeAppLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
      <Toaster 
        richColors 
        closeButton
        toastOptions={{
          className: "!bg-white !border !border-gray-100 !shadow-lg !rounded-2xl !p-4",
          style: {
            background: "white",
            border: "1px solid #f3f4f6",
            borderRadius: "1rem",
            padding: "1rem",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          },
        }}
      />
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
