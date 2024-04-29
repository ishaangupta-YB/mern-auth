import axios from "axios";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import {
  signInStart,
  signInSuccess,
  signInFailure,
} from "../redux/user/userSlice";
import { useDispatch, useSelector } from "react-redux";
import OAuth from "../redux/OAuth";

const API_URL = import.meta.env.VITE_API_URL;

function Signin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.user);

  const loginSchema = z.object({
    email: z
      .string()
      .email("Invalid email address")
      .min(1, "Email is required"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
        "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character"
      ),
  });

  const handleForgotPassword = async () => {
    try {
      loginSchema.pick({ email: true }).parse({ email });
      const res = await axios.post(API_URL + "/api/reset/forgot-password", {
        email,
      });
      alert(res.data?.message);
    } catch (error) {
      alert(
        error instanceof z.ZodError
          ? error.errors[0].message
          : "An error occurred"
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      dispatch(signInStart());
      loginSchema.parse({
        email,
        password,
      });
      const res = await axios.post(API_URL + "/api/auth/signin", {
        email,
        password,
      });
      if (res.status !== 200) {
        alert(res.data.message || "An error occurred");
        dispatch(signInFailure(res.data.message));
        return;
      }
      dispatch(signInSuccess(res.data));
      setEmail("");
      setPassword("");
      navigate("/");
    } catch (error) {
      if (error instanceof z.ZodError) {
        dispatch(signInFailure(error));
        alert(error.errors.map((err) => err.message).join("\n"));
      } else {
        dispatch(signInFailure(error.response?.data?.message));
        alert(error.response?.data?.message || "An error occurred");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-4">Sign In</h2>
        <form onSubmit={handleSubmit}>
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
          <button
            type="submit"
            className="bg-blue-500 text-white rounded w-full py-2"
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>
        <div className="text-center mt-4">
          <OAuth />
        </div>
        <div className="text-center mt-4">
          <button
            onClick={handleForgotPassword}
            className="text-blue-500 hover:underline focus:outline-none"
          >
            Forgot Password?
          </button>
        </div>
        <div className="mt-4 text-center">
          <p>
            Don't have an account?{" "}
            <Link to="/sign-up" className="text-blue-500">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signin;
