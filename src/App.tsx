import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import { AuthPage } from "./pages/AuthPage";
import { AuthRoute } from "./routes/AuthRoute";
import { HomePage } from "./pages/HomePage";



function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route
          path="/"
          element={
              <HomePage />
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
