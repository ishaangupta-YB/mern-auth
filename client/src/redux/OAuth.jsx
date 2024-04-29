import React from "react";
import { GoogleAuthProvider, signInWithPopup, getAuth } from "firebase/auth";
import { app } from "../firebase";
import { useDispatch } from "react-redux";
import axios from "axios";
import { z } from "zod";
import { signInSuccess,signInFailure } from "../redux/user/userSlice";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

function OAuth() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const handleGoogleClick = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const auth = getAuth(app);
      const result = await signInWithPopup(auth, provider);
      const { displayName, email, photoURL } = result.user;
      const loginSchema = z.object({
        name: z.string(),
        email: z
          .string()
          .email("Invalid email address")
          .min(1, "Email is required"),
        photo: z.string().optional(),
      });

      const res = await axios.post(API_URL+"/api/auth/google", {
        name: displayName,
        email: email,
        profilePicture: photoURL,
      });
      if(res.status!==200) {
        alert(res.data.message || "An error occurred");
        dispatch(signInFailure(res.data?.message || "An error occurred"));
        return;
      } 
      dispatch(signInSuccess(res.data));
      navigate("/");
    } catch (error) {
      if (error instanceof z.ZodError) {
        dispatch(signInFailure(error));
        alert(error.errors.map((err) => err.message).join("\n"));
      } else {
        dispatch(
          signInFailure(
            error.response?.data?.message || "could not login with google"
          )
        );
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleClick}
      className="bg-red-500 text-white rounded w-full py-2 mt-2"
    >
      Sign In with Google
    </button>
  );
}

export default OAuth;
