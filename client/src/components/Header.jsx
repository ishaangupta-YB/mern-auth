import { Link } from "react-router-dom";
import { useSelector,useDispatch } from "react-redux";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import {  signOut } from '../redux/user/userSlice';
const API_URL = import.meta.env.VITE_API_URL;

function Header() {
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.user);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToggleDropdown = () => {
    setShowDropdown((prev) => !prev);
  };

  const handleSignOut = async () => {
    try {
      await axios.get(API_URL + "/api/auth/signout");
      dispatch(signOut());
      setShowDropdown(false);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="bg-slate-200">
      <div className="flex justify-between items-center max-w-6xl mx-auto p-3">
        <Link to="/">
          <h1 className="font-bold">Auth App</h1>
        </Link>
        <ul className="flex gap-4">
          <Link to="/">
            <li>Home</li>
          </Link>
          <Link to="/about">
            <li>About</li>
          </Link>
          {/* <Link to="/profile">
            {currentUser ? (
              <img
                src={currentUser.profilePicture}
                alt="profile"
                className="h-7 w-7 rounded-full object-cover"
              />
            ) : (
              <li>Sign In</li>
            )}
          </Link> */}
          {currentUser ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={handleToggleDropdown}
                className="focus:outline-none flex items-center"
              >
                <img
                  src={currentUser.profilePicture}
                  alt="profile"
                  className="h-7 w-7 rounded-full object-cover"
                />
              </button>
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1">
                  <Link
                    to="/profile"
                    onClick={() => setShowDropdown(false)}
                    className="block px-4 py-2 text-gray-800"
                  >
                    Your Profile
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/sign-in">
              <li>Sign In</li>
            </Link>
          )}
        </ul>
      </div>
    </div>
  );
}

export default Header;
