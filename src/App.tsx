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
import { LargeAppLayout } from "./components/layout/large-app-layout"
import { SessionCheck } from "./components/SessionCheck"

function AppContent() {
  const location = useLocation();
  const isAuthPage = location.pathname === "/auth";

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
              <CommonAppLayout>
                <div className="p-8">
                  <h1 className="text-2xl font-bold">Chat Page</h1>
                  <p className="text-gray-600">Coming soon...</p>
                </div>
              </CommonAppLayout>
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
