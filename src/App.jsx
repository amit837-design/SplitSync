import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import VerifyEmail from "./pages/VerifyEmail";
import { useAuth } from "./context/AuthContext";

function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    // If not logged in, redirect to the login page
    return <Navigate to="/login" replace />;
  }

  if (!currentUser.emailVerified) {
    // If logged in but email is NOT verified, send to VerifyEmail page
    return <Navigate to="/verify-email" replace />;
  }

  // If logged in AND email is verified, show the app
  return children;
}

function App() {
  const { currentUser } = useAuth();

  return (
    <div className="h-full">
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/login"
          element={currentUser ? <Navigate to="/" replace /> : <Login />}
        />
        <Route
          path="/signup"
          element={currentUser ? <Navigate to="/" replace /> : <Signup />}
        />
        <Route
          path="/verify-email"
          element={
            currentUser && !currentUser.emailVerified ? (
              <VerifyEmail />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>
    </div>
  );
}

export default App;
