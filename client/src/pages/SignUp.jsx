import axios from "axios";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";

const API_URL = import.meta.env.VITE_API_URL;

function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const registrationSchema = z.object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username must be at most 30 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z
      .string()
      .min(6, "Confirm password must be at least 6 characters"),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      registrationSchema.parse({
        username,
        email,
        password,
        confirmPassword,
      });

      const res = await axios.post(API_URL + "/api/auth/signup", {
        username,
        email,
        password,
        confirmPassword,
      }); 
      if (res.status !== 201) {
        alert(res.data.message || "An error occurred");
        return;
      }
      setEmail("");
      setUsername("");
      setPassword("");
      setConfirmPassword("");
      navigate("/sign-in");
    } catch (error) {
      if (error instanceof z.ZodError) {
        alert(error.errors.map((err) => err.message).join("\n"));
      } else {
        alert(error.response?.data?.message || "An error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-4">Sign Up</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="block w-full rounded border-gray-300 p-2 focus:outline-none focus:border-blue-400"
            />
          </div>
          <div className="mb-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="block w-full rounded border-gray-300 p-2 focus:outline-none focus:border-blue-400"
            />
          </div>
          <div className="mb-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="block w-full rounded border-gray-300 p-2 focus:outline-none focus:border-blue-400"
            />
          </div>
          <div className="mb-4">
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              className="block w-full rounded border-gray-300 p-2 focus:outline-none focus:border-blue-400"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 text-white rounded w-full py-2"
          >
            {loading ? "Signing Up..." : "Sign Up"}
          </button>
        </form>
        <div className="text-center mt-4">
          <button className="bg-red-500 text-white rounded w-full py-2 mt-2">
            Continue with Google
          </button>
        </div>
        <div className="mt-4 text-center">
          <p>
            Already have an account?{" "}
            <Link to="/sign-in" className="text-blue-500">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;
