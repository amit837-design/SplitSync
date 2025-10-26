import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff } from "lucide-react"; // <-- Import icons

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState(""); // <-- For success messages
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // <-- State for icon
  const { login, resetPassword } = useAuth(); // <-- Get resetPassword
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError("");
      setMessage(""); // Clear other messages
      setLoading(true);
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError("Failed to log in. Check your email and password.");
    }
    setLoading(false);
  };

  // --- NEW FUNCTION for password reset ---
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!email) {
      return setError("Please enter your email to reset password.");
    }
    try {
      setError("");
      setMessage("");
      setLoading(true);
      await resetPassword(email);
      setMessage("Password reset email sent! Check your inbox.");
    } catch (err) {
      setError("Failed to send reset email. User may not exist.");
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-full p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <h2 className="text-2xl font-bold text-center">Log In</h2>
        {error && (
          <div
            className="p-3 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800"
            role="alert"
          >
            {error}
          </div>
        )}
        {message && ( // <-- Render success message
          <div
            className="p-3 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-200 dark:text-green-800"
            role="alert"
          >
            {message}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block mb-2 text-sm font-medium">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
              required
            />
          </div>
          {/* --- MODIFIED PASSWORD INPUT --- */}
          <div>
            <div className="flex justify-between">
              <label
                htmlFor="password"
                className="block mb-2 text-sm font-medium"
              >
                Password
              </label>
              <a // <-- FORGOT PASSWORD LINK
                href="#"
                onClick={handlePasswordReset}
                className="text-sm text-blue-600 hover:underline dark:text-blue-500"
              >
                Forgot Password?
              </a>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"} // <-- Dynamic type
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
                required
              />
              <button // <-- SHOW/HIDE BUTTON
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          {/* --- END OF MODIFICATION --- */}
          <button
            disabled={loading}
            type="submit"
            className="w-full px-5 py-2.5 text-sm font-medium text-center text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>
        <div className="text-sm font-medium text-center text-gray-500 dark:text-gray-400">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-blue-600 hover:underline dark:text-blue-500"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
