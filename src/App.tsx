import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import { AuthPage } from "./pages/AuthPage";
import { AuthRoute } from "./routes/AuthRoute";
import { HomePage } from "./pages/HomePage";
import { ProtectedRoute } from "./routes/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
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
  );
}

export default App;
