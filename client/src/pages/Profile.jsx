import { useSelector } from "react-redux";
import { useRef, useCallback, useState, useEffect } from "react";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { app } from "../firebase";
import { useDispatch } from "react-redux";
import {
  updateUserStart,
  updateUserSuccess,
  updateUserFailure,
  deleteUserStart,
  deleteUserSuccess,
  deleteUserFailure,
  signOut
} from "../redux/user/userSlice";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;
const MAX_IMAGE_SIZE = import.meta.env.VITE_MAX_IMAGE_SIZE;

const Alert = ({ message, type }) => (
  <div
    className={`p-3 rounded-md mt-5 ${
      type === "success"
        ? "bg-green-100 text-green-700"
        : "bg-red-100 text-red-700"
    }`}
  >
    {message}
  </div>
);

function Profile() {
  const dispatch = useDispatch();
  const fileRef = useRef(null);
  const [imagePercent, setImagePercent] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [formData, setFormData] = useState({});
  const [alert, setAlert] = useState(null);

  const { currentUser, loading, error } = useSelector((state) => state.user);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setIsLoading(false);
    }
  }, [currentUser]);

  const handleFileUpload = useCallback(
    async (file) => {
      if (!file) return;
      if (file.size > MAX_IMAGE_SIZE) {
        setAlert({
          message: `Image size should be less than ${
            MAX_IMAGE_SIZE / (1024 * 1024)
          } MB`,
          type: "error",
        });
        return;
      }
      const storage = getStorage(app);
      const fileName = new Date().getTime() + file.name;
      const storageRef = ref(storage, fileName);
      const uploadTask = uploadBytesResumable(storageRef, file);
      setIsLoading(true);
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setImagePercent(Math.round(progress));
        },
        (error) => {
          setImageError(true);
          setIsLoading(false);
          setAlert({
            message: "Error uploading image. Please try again.",
            type: "error",
          });
          // alert("Error uploading image. Please try again.");
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) =>
            setFormData({ ...formData, profilePicture: downloadURL })
          );
          setIsLoading(false);
        }
      );
    },
    [formData]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      dispatch(updateUserStart()); 
      const response = await axios.post(
        API_URL + `/api/user/update/${currentUser._id}`,
        formData
      );
      if (response.status !== 200) {
        // setAlert({ message: "Failed to update user.", type: "error" });
        throw new Error(response.data.message || "Failed to update user.");
      }
      dispatch(updateUserSuccess(response.data));
      setIsLoading(false);
      setAlert({ message: "User is updated successfully!", type: "success" });
    } catch (error) {
      // alert(error?.response?.data?.message || "An error occurred");
      setAlert({
        message: error?.response?.data?.message || "An error occurred",
        type: "error",
      });
      dispatch(updateUserFailure(error.message));
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    try {
      dispatch(deleteUserStart());
      const res = await axios.delete(`/api/user/delete/${currentUser._id}`); 
      console.log(res)
      if (res.status !== 200) {
        // alert("An error occurred");
        setAlert({ message: "An error occurred", type: "error" });
        dispatch(deleteUserFailure(res.data));
        return;
      }
      dispatch(deleteUserSuccess(res.data)); 
      navigate("/sign-in");
    } catch (error) {
      // alert("An error occurred");
      setAlert({ message: "An error occurred", type: "error" });
      dispatch(deleteUserFailure(error));
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      handleFileUpload(selectedFile);
    }
  };

  const handleChange = useCallback(
    async (e) => {
      setFormData({ ...formData, [e.target.id]: e.target.value });
    },
    [formData]
  );

  return (
    <div className="p-3 max-w-lg mx-auto">
      <h1 className="text-3xl font-semibold text-center my-7">Profile</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="file"
          ref={fileRef}
          hidden
          accept="image/*"
          onChange={handleFileChange}
        />
        <img
          src={formData.profilePicture || currentUser.profilePicture}
          alt="profile"
          className="h-24 w-24 self-center cursor-pointer rounded-full object-cover mt-2"
          onClick={() => fileRef.current.click()}
        />
        <p className="text-sm self-center">
          {imageError ? (
            <span className="text-red-700">
              Error uploading image (file size must be less than 2 MB)
            </span>
          ) : imagePercent > 0 && imagePercent < 100 ? (
            <span className="text-slate-700">{`Uploading: ${imagePercent} %`}</span>
          ) : imagePercent === 100 ? (
            <span className="text-green-700">Image uploaded successfully</span>
          ) : (
            ""
          )}
        </p>
        <input
          defaultValue={currentUser.username}
          type="text"
          id="username"
          placeholder="Username"
          className="bg-slate-100 rounded-lg p-3"
          onChange={handleChange}
        />
        <input
          defaultValue={currentUser.email}
          type="email"
          id="email"
          placeholder="Email"
          className="bg-slate-100 rounded-lg p-3"
          onChange={handleChange}
        />
        <input
          type="password"
          id="password"
          placeholder="Password"
          className="bg-slate-100 rounded-lg p-3"
          onChange={handleChange}
        />
        <button className="bg-slate-700 text-white p-3 rounded-lg uppercase hover:opacity-95 disabled:opacity-80">
          {loading ? "Loading..." : "Update"}
        </button>
      </form>
      <div className="flex justify-between mt-5">
        <span
          onClick={handleDeleteAccount}
          className="text-red-700 cursor-pointer"
        >
          Delete Account
        </span>
      </div>
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-5 rounded-md">
            <div className="text-lg font-semibold">Loading...</div>
          </div>
        </div>
      )}
      {alert && <Alert message={alert.message} type={alert.type} />}
    </div>
  );
}

export default Profile;
