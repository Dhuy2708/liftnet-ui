import { BrowserRouter, Route, Routes } from "react-router-dom"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "./App.css"
import { AuthPage } from "./pages/AuthPage"
import { AuthRoute } from "./routes/AuthRoute"
import { HomePage } from "./pages/HomePage"
import { ProtectedRoute } from "./routes/ProtectedRoute"
import { AppLayout } from "./components/layout/app-layout"

function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout>
                <HomePage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Add more protected routes with the AppLayout */}
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <AppLayout>
                <div className="p-8">
                  <h1 className="text-2xl font-bold">Chat Page</h1>
                  <p className="text-gray-600">Coming soon...</p>
                </div>
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/appointments"
          element={
            <ProtectedRoute>
              <AppLayout>
                <div className="p-8">
                  <h1 className="text-2xl font-bold">Appointments Page</h1>
                  <p className="text-gray-600">Coming soon...</p>
                </div>
              </AppLayout>
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
    </BrowserRouter>
  )
}

export default App
