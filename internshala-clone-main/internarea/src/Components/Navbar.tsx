import React, { useEffect, useState } from "react";
import logo from "../Assets/logo.png";
import Link from "next/link";
import { auth, provider } from "../firebase/firebase";
import { ChevronDown, ChevronUp, Search, X, Eye, EyeOff, Mail, Lock, User as UserIcon, Phone as PhoneIcon, Crown } from "lucide-react";
import { signInWithPopup, signOut } from "firebase/auth";
import { toast } from "react-toastify";
import { useSelector, useDispatch } from "react-redux";
import { selectuser, login, logout } from "@/Feature/Userslice";
import { useLanguage, LANGUAGES, LanguageCode } from "@/context/LanguageContext";
import axios from "axios";
import { getApiUrl } from "@/utils/api";
import { useRouter } from "next/router";

interface User {
  name: string;
  email: string;
  photo: string;
}

const Navbar = () => {
  const user = useSelector(selectuser);
  const dispatch = useDispatch();
  const router = useRouter();
  const { lang, changeLanguage, t } = useLanguage();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [navSubPlan, setNavSubPlan] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Unified login modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"login" | "register" | "otp">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // OTP Login states
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpPurpose, setOtpPurpose] = useState<"login" | "google-sync">("login");
  const [pendingGoogleData, setPendingGoogleData] = useState<any>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [isOtpDevMode, setIsOtpDevMode] = useState(false);

  // Register inputs
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  // Close modal when logged in
  useEffect(() => {
    if (user) {
      setIsModalOpen(false);
      // Fetch subscription plan for badge
      const token = localStorage.getItem("authToken");
      if (token) {
        axios.get(getApiUrl("/resume/subscription/status"), {
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => {
          if (res.data?.plan && res.data.plan !== "free") {
            setNavSubPlan(res.data.plan);
          } else {
            setNavSubPlan(null);
          }
        }).catch(() => setNavSubPlan(null));
      }
    } else {
      setNavSubPlan(null);
    }
  }, [user]);

  // Listen to Google Login Chrome OTP trigger
  useEffect(() => {
    const handleOtpRequired = (e: any) => {
      const { email, googleData, devMode } = e.detail;
      setOtpEmail(email);
      setPendingGoogleData(googleData);
      setOtpPurpose("google-sync");
      setModalTab("otp");
      setIsModalOpen(true);
      setErrorMessage(null);
      setIsOtpDevMode(!!devMode);
      setOtpCode("");
    };
    window.addEventListener("login-otp-required", handleOtpRequired);
    return () => window.removeEventListener("login-otp-required", handleOtpRequired);
  }, []);

  // Sync search input with URL search parameter
  useEffect(() => {
    if (router.query.search) {
      setSearchQuery(router.query.search as string);
    } else {
      setSearchQuery("");
    }
  }, [router.query.search]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    const isInternshipPage = router.pathname.includes("internship") || router.pathname.includes("detailiternship");
    const targetPath = isInternshipPage ? "/internship" : "/job";
    
    router.push({
      pathname: targetPath,
      query: { search: searchQuery.trim() }
    });
  };

  const detectEnvironment = async () => {
    const ua = navigator.userAgent;
    
    // Browser detection
    let browser = "Unknown Browser";
    if (/edg/i.test(ua)) {
      browser = "Edge";
    } else if (/opr|opera/i.test(ua)) {
      browser = "Opera";
    } else if (/chrome|crios/i.test(ua)) {
      browser = "Chrome";
    } else if (/firefox|fxios/i.test(ua)) {
      browser = "Firefox";
    } else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) {
      browser = "Safari";
    } else if (/msie|trident/i.test(ua)) {
      browser = "Internet Explorer";
    }

    // OS detection
    let os = "Unknown OS";
    if (/windows/i.test(ua)) {
      os = "Windows";
    } else if (/macintosh|mac os x/i.test(ua)) {
      os = "macOS";
    } else if (/android/i.test(ua)) {
      os = "Android";
    } else if (/iphone|ipad|ipod/i.test(ua)) {
      os = "iOS";
    } else if (/linux/i.test(ua)) {
      os = "Linux";
    }

    // Device detection
    let deviceType = "desktop";
    if (/Mobi|Android|iPhone|iPad|iPod/i.test(ua)) {
      deviceType = "mobile";
    } else {
      try {
        if ("getBattery" in navigator) {
          const battery = await (navigator as any).getBattery();
          if (battery && (battery.level < 1 || !battery.charging || battery.dischargingTime !== Infinity)) {
            deviceType = "laptop";
          }
        }
      } catch (e) {}
      
      if (deviceType === "desktop" && window.screen.width <= 1600) {
        deviceType = "laptop";
      }
    }

    return { browser, os, deviceType };
  };

  const handleGoogleLoginInsideModal = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setErrorMessage(null);
    try {
      sessionStorage.setItem("isNewLoginAttempt", "true");
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.code ? `${error.code}: ${error.message}` : error.message || error;
      toast.error(`Login failed: ${errorMsg}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);
    setShowForgotPassword(false);

    try {
      const env = await detectEnvironment();
      const response = await axios.post(
        getApiUrl("/user/login"),
        { email, password, deviceType: env.deviceType },
        { validateStatus: () => true }
      );

      if (response.status === 200 && response.data.success) {
        if (response.data.otpRequired) {
          setOtpEmail(response.data.email);
          setOtpPurpose("login");
          setModalTab("otp");
          setIsOtpDevMode(!!response.data.devMode);
          setOtpCode("");
          toast.info(response.data.message || "Security verification required.");
        } else {
          const userData = response.data.user;
          localStorage.setItem("customUser", JSON.stringify(userData));
          dispatch(login(userData));
          toast.success("Logged in successfully");
          setIsModalOpen(false);
          setEmail("");
          setPassword("");
        }
      } else {
        setErrorMessage(response.data.message || "Invalid email or password.");
        if (response.status === 401) {
          setShowForgotPassword(true);
        }
      }
    } catch (error: any) {
      console.error("Login request failed:", error);
      const msg = error.response?.data?.message || "Network error. Please try again.";
      setErrorMessage(msg);
      setShowForgotPassword(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpLoading) return;
    setOtpLoading(true);
    setErrorMessage(null);

    try {
      const env = await detectEnvironment();
      const body: any = {
        email: otpEmail,
        code: otpCode,
        deviceType: env.deviceType
      };

      if (otpPurpose === "google-sync" && pendingGoogleData) {
        body.isGoogleSync = true;
        body.googleData = pendingGoogleData;
      }

      const response = await axios.post(
        getApiUrl("/user/verify-login-otp"),
        body,
        { validateStatus: () => true }
      );

      if (response.status === 200 && response.data.success) {
        const userData = response.data.user;
        localStorage.setItem("customUser", JSON.stringify(userData));
        dispatch(login(userData));
        toast.success("Logged in successfully");
        setIsModalOpen(false);
        setOtpCode("");
        setOtpEmail("");
        setPendingGoogleData(null);
      } else {
        setErrorMessage(response.data.message || "Invalid or expired verification code.");
      }
    } catch (error: any) {
      console.error("OTP verification failed:", error);
      setErrorMessage("Verification failed. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleCustomRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await axios.post(
        getApiUrl("/user/register"),
        {
          name: registerName,
          email: registerEmail,
          phone: registerPhone,
          password: registerPassword,
        },
        { validateStatus: () => true }
      );

      if (response.status === 201 && response.data.success) {
        const userData = response.data.user;
        localStorage.setItem("customUser", JSON.stringify(userData));
        dispatch(login(userData));
        toast.success("Registered and logged in successfully!");
        setIsModalOpen(false);
        setRegisterName("");
        setRegisterEmail("");
        setRegisterPhone("");
        setRegisterPassword("");
      } else {
        setErrorMessage(response.data.message || "Registration failed. Please check details.");
      }
    } catch (error: any) {
      console.error("Registration failed:", error);
      const msg = error.response?.data?.message || "Network error during registration. Please try again.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handlelogout = () => {
    signOut(auth);
    localStorage.removeItem("customUser");
    dispatch(logout());
    toast.info("Logged out successfully");
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
              <button className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 cursor-pointer">
                <Link href={"/resume-builder"}>
                  <span>Resume Builder</span>
                </Link>
              </button>
              <button className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 cursor-pointer">
                <Link href={"/public-space"}>
                  <span>Public Space</span>
                </Link>
              </button>
              <form onSubmit={handleSearchSubmit} className="flex items-center bg-gray-100 rounded-full px-4 py-2">
                <button type="submit" className="focus:outline-none cursor-pointer">
                  <Search size={16} className="text-gray-400 hover:text-blue-600 transition-colors" />
                </button>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("search_placeholder")}
                  className="ml-2 bg-transparent focus:outline-none text-sm w-48 text-black"
                />
              </form>
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
                  {/* Subscription Plan Badge */}
                  {navSubPlan ? (
                    <Link
                      href="/subscription"
                      className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-all ${
                        navSubPlan === 'gold'
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : navSubPlan === 'silver'
                          ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                      }`}
                    >
                      <Crown size={10} />
                      {navSubPlan}
                    </Link>
                  ) : (
                    <Link
                      href="/subscription"
                      className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all border border-blue-100"
                    >
                      <Crown size={10} />
                      Upgrade
                    </Link>
                  )}
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
                    onClick={() => {
                      setIsModalOpen(true);
                      setModalTab("login");
                      setErrorMessage(null);
                      setShowForgotPassword(false);
                    }}
                    className="bg-white hover:bg-gray-50 text-blue-600 border border-blue-600 rounded-xl px-5 py-2 font-semibold text-sm cursor-pointer transition-all active:scale-[0.98]"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      setIsModalOpen(true);
                      setModalTab("register");
                      setErrorMessage(null);
                      setShowForgotPassword(false);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2 font-semibold text-sm cursor-pointer shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                  >
                    Register
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

      {/* Login Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all duration-300">
          <div className="relative w-full max-w-md bg-white border border-gray-100 rounded-3xl shadow-2xl p-8 transform transition-all duration-300 scale-100 flex flex-col">
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            {/* Tabs Header */}
            <div className="flex border-b border-gray-150 mb-6">
              <button
                type="button"
                onClick={() => {
                  setModalTab("login");
                  setErrorMessage(null);
                  setShowForgotPassword(false);
                }}
                className={`flex-1 pb-3 text-sm font-semibold border-b-2 text-center transition-all cursor-pointer ${
                  modalTab === "login"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalTab("register");
                  setErrorMessage(null);
                  setShowForgotPassword(false);
                }}
                className={`flex-1 pb-3 text-sm font-semibold border-b-2 text-center transition-all cursor-pointer ${
                  modalTab === "register"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                Register
              </button>
            </div>

            {/* Form *            {/* Form */}
            {modalTab === "otp" ? (
              <form onSubmit={handleVerifyLoginOtp} className="space-y-4">
                {errorMessage && (
                  <div className="bg-red-50 text-red-600 border border-red-100 p-3 rounded-xl text-sm font-medium flex items-start space-x-2 animate-[shake_0.4s_ease-in-out]">
                    <span className="mt-0.5">⚠️</span>
                    <span className="flex-1">{errorMessage}</span>
                  </div>
                )}

                {isOtpDevMode && (
                  <div className="bg-amber-50 border border-amber-100 text-amber-800 p-3.5 rounded-xl text-xs flex flex-col space-y-1">
                    <span className="font-semibold">Verification Code Note</span>
                    <span className="text-amber-700">For testing purposes, please retrieve the code from the server console logs.</span>
                  </div>
                )}

                <div className="text-center py-2 text-black">
                  <p className="text-sm text-gray-600">
                    A 6-digit verification code has been sent to:
                  </p>
                  <p className="text-sm font-bold text-gray-800 mt-0.5">{otpEmail}</p>
                </div>

                <div>
                  <label className="block text-gray-700 text-xs font-semibold uppercase tracking-wider mb-1.5" htmlFor="login-otp-code">
                    Verification Code
                  </label>
                  <input
                    id="login-otp-code"
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    className="w-full py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-bold tracking-[0.5em] focus:outline-none transition-all text-black"
                    placeholder="123456"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setModalTab("login");
                      setErrorMessage(null);
                    }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-3 rounded-xl transition-all text-sm cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={otpLoading || otpCode.length !== 6}
                    className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all shadow-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 cursor-pointer flex justify-center items-center"
                  >
                    {otpLoading ? (
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      "Verify & Log In"
                    )}
                  </button>
                </div>
              </form>
            ) : modalTab === "login" ? (
              <form onSubmit={handleCustomLogin} className="space-y-4">
                {errorMessage && (
                  <div className="bg-red-50 text-red-600 border border-red-100 p-3 rounded-xl text-sm font-medium flex flex-col space-y-1">
                    <div className="flex items-start space-x-2">
                      <span className="mt-0.5">⚠️</span>
                      <span className="flex-1">{errorMessage}</span>
                    </div>
                    {showForgotPassword && (
                      <div className="mt-1 pt-1 border-t border-red-100/50">
                        <button
                          type="button"
                          onClick={() => {
                            setIsModalOpen(false);
                            router.push("/forgot-password");
                          }}
                          className="text-blue-600 hover:underline font-semibold text-xs text-left cursor-pointer"
                        >
                          Forgot Password? Click here to reset.
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-gray-700 text-xs font-semibold uppercase tracking-wider mb-1.5" htmlFor="login-email">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Mail size={18} />
                    </div>
                    <input
                      id="login-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm focus:outline-none transition-all text-black"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 text-xs font-semibold uppercase tracking-wider mb-1.5" htmlFor="login-password">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Lock size={18} />
                    </div>
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm focus:outline-none transition-all text-black"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all shadow-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 cursor-pointer flex justify-center items-center"
                >
                  {isLoading ? (
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    "Log In"
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleCustomRegister} className="space-y-4">
                {errorMessage && (
                  <div className="bg-red-50 text-red-600 border border-red-100 p-3 rounded-xl text-sm font-medium flex items-start space-x-2 animate-[shake_0.4s_ease-in-out]">
                    <span className="mt-0.5">⚠️</span>
                    <span className="flex-1">{errorMessage}</span>
                  </div>
                )}

                <div>
                  <label className="block text-gray-700 text-xs font-semibold uppercase tracking-wider mb-1.5" htmlFor="register-name">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <UserIcon size={18} />
                    </div>
                    <input
                      id="register-name"
                      type="text"
                      required
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm focus:outline-none transition-all text-black"
                      placeholder="Enter your name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 text-xs font-semibold uppercase tracking-wider mb-1.5" htmlFor="register-email">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Mail size={18} />
                    </div>
                    <input
                      id="register-email"
                      type="email"
                      required
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm focus:outline-none transition-all text-black"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 text-xs font-semibold uppercase tracking-wider mb-1.5" htmlFor="register-phone">
                    Phone Number (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <PhoneIcon size={18} />
                    </div>
                    <input
                      id="register-phone"
                      type="tel"
                      value={registerPhone}
                      onChange={(e) => setRegisterPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm focus:outline-none transition-all text-black"
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 text-xs font-semibold uppercase tracking-wider mb-1.5" htmlFor="register-password">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Lock size={18} />
                    </div>
                    <input
                      id="register-password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm focus:outline-none transition-all text-black"
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all shadow-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 cursor-pointer flex justify-center items-center"
                >
                  {isLoading ? (
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    "Register"
                  )}
                </button>
              </form>
            )}

            {modalTab !== "otp" && (
              <>
                <div className="relative flex py-4 items-center">
                  <div className="flex-grow border-t border-gray-200"></div>
                  <span className="flex-shrink mx-4 text-gray-400 text-xs font-semibold uppercase">Or continue with</span>
                  <div className="flex-grow border-t border-gray-200"></div>
                </div>

                {/* Google Login button */}
                <button
                  onClick={handleGoogleLoginInsideModal}
                  disabled={isLoggingIn}
                  className="w-full bg-white border border-gray-200 rounded-xl py-3 flex items-center justify-center space-x-3 hover:bg-gray-50 cursor-pointer shadow-sm transition-all focus:ring-2 focus:ring-gray-200 focus:ring-offset-1 disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                  <span className="text-gray-700 text-sm font-semibold">Google</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
