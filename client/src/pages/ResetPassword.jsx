import axios from "axios";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { z } from "zod";

const API_URL = import.meta.env.VITE_API_URL;

// const rateLimiter = new RateLimiter.RateLimiter({
//   points: 10,
//   duration: 60,
// });

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { resetToken } = useParams();
  const navigate = useNavigate();
  const [resetTokenValid, setResetTokenValid] = useState(false);

  const resetPasswordSchema = z.object({
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
        "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character"
      ),
    confirmPassword: z.string().refine((confirmPassword) => {
      return confirmPassword === password;
    }, "Passwords do not match"),
  });

  useEffect(() => {
    const checkResetToken = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/api/reset/validate-reset-token/${resetToken}`
        );
        if (!res || res.status !== 200) {
          navigate("/404");
        } else {
          setResetTokenValid(true);
        }
      } catch (error) {
        navigate("/404");
      }
    };

    checkResetToken();
  }, [resetToken, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // const isRateLimited = await rateLimiter.consume(1);
      // if (isRateLimited) {
      //   alert("Too many requests. Please try again later.");
      // }

      resetPasswordSchema.parse({ password, confirmPassword });
      console.log(password,confirmPassword)
      const res = await axios.post(`${API_URL}/api/reset/reset-password`, {
        resetToken,
        newPassword:password,
      }); 
      console.log(res);
      alert(res.data?.message);
    } catch (error) {
      console.log(error);
      let errorMessage = "An error occurred";
      if (error instanceof z.ZodError) {
        errorMessage = error.errors[0].message;
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data.error;
      }
      alert(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-4">Reset Password</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New Password"
              className="block w-full rounded border-gray-300 p-2 focus:outline-none focus:border-blue-400"
            />
          </div>
          <div className="mb-4">
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm New Password"
              className="block w-full rounded border-gray-300 p-2 focus:outline-none focus:border-blue-400"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 text-white rounded w-full py-2"
          >
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;
