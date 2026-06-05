import React, { useEffect, useState } from "react";
import logo from "../Assets/logo.png";
import Link from "next/link";
import { auth, provider } from "../firebase/firebase";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { signInWithPopup, signOut } from "firebase/auth";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { selectuser } from "@/Feature/Userslice";
import { useLanguage, LANGUAGES, LanguageCode } from "@/context/LanguageContext";

interface User {
  name: string;
  email: string;
  photo: string;
}

const Navbar = () => {
  const user = useSelector(selectuser);
  const { lang, changeLanguage, t } = useLanguage();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handlelogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      await signInWithPopup(auth, provider);
      toast.success("logged in successfully");
    } catch (error) {
      console.error(error);
      toast.error("login failed");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handlelogout = () => {
    signOut(auth);
  };

  return (
    <div className="relative">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="text-xl font-bold text-blue-600">
                <img src={"/logo.png"} alt="Logo" className="h-16 cursor-pointer" />
              </Link>
            </div>
            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <button className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 cursor-pointer">
                <Link href={"/internship"}>
                  <span>{t("internships_nav")}</span>
                </Link>
              </button>
              <button className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 cursor-pointer">
                <Link href={"/job"}>
                  <span>{t("jobs_nav")}</span>
                </Link>
              </button>
              <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
                <Search size={16} className="text-gray-400" />
                <input
                  type="text"
                  placeholder={t("search_placeholder")}
                  className="ml-2 bg-transparent focus:outline-none text-sm w-48 text-black"
                />
              </div>
            </div>

            {/* Auth and Language Dropdown */}
            <div className="flex items-center space-x-4">
              {/* Language Selector */}
              <div className="relative inline-block text-left">
                <select
                  value={lang}
                  onChange={(e) => changeLanguage(e.target.value as LanguageCode)}
                  className="bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent block w-full px-2.5 py-1.5 cursor-pointer font-medium hover:bg-gray-100 transition-all focus:outline-none"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code} className="text-gray-800 bg-white">
                      {l.flag} {l.name}
                    </option>
                  ))}
                </select>
              </div>

              {user ? (
                <div className="relative flex items-center space-x-2">
                  <Link href={"/profile"} className="flex items-center">
                    <img
                      src={user.photo}
                      alt="User Profile"
                      className="w-8 h-8 rounded-full border border-gray-200 hover:border-blue-500 transition-colors cursor-pointer"
                    />
                  </Link>
                  <button
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-xl transition-all cursor-pointer font-medium"
                    onClick={handlelogout}
                  >
                    {t("logout")}
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={handlelogin}
                    disabled={isLoggingIn}
                    className={`bg-white border border-gray-300 rounded-xl px-4 py-2 flex items-center justify-center space-x-2 hover:bg-gray-50 cursor-pointer shadow-sm transition-all ${isLoggingIn ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span className="text-gray-700 text-sm font-medium">{t("continue_google")}</span>
                  </button>
                  <Link
                    href="/adminlogin"
                    className="text-gray-600 hover:text-blue-600 text-sm font-medium transition-all"
                  >
                    {t("admin")}
                  </Link>
                </>
              )}
            </div>
          </div>{" "}
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
