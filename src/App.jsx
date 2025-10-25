import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import { useAuth } from "./context/AuthContext";

// A helper component to protect routes
function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  if (!currentUser) {
    // If not logged in, redirect to the login page
    return <Navigate to="/login" replace />;
  }
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
      </Routes>
    </div>
  );
}

export default App;
