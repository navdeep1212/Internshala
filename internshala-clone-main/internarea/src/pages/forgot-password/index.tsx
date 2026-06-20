import React, { useState } from "react";
import axios from "axios";
import { getApiUrl } from "@/utils/api";
import { toast } from "react-toastify";
import {
  Mail,
  Phone,
  KeyRound,
  ShieldCheck,
  Copy,
  Check,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Eye,
  EyeOff,
  Lock,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import Head from "next/head";

const ForgotPassword = () => {
  // Steps: 1 = Request OTP, 2 = Verify OTP, 3 = Reset Password, 4 = Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [identifier, setIdentifier] = useState("");
  const [inputType, setInputType] = useState<"email" | "phone">("email");
  const [otpCode, setOtpCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDevMode, setIsDevMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [copied, setCopied] = useState(false);

  // Send verification code
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsDevMode(false);
    setIsRateLimited(false);

    if (!identifier.trim()) {
      toast.error(inputType === "email" ? "Please enter your email address." : "Please enter your phone number.");
      return;
    }

    if (inputType === "email" && !identifier.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (inputType === "phone" && !/^\d{7,15}$/.test(identifier.trim())) {
      toast.error("Please enter a valid phone number (digits only).");
      return;
    }

    try {
      setIsLoading(true);
      const res = await axios.post(
        getApiUrl("/user/forgot-password"),
        { identifier: identifier.trim() },
        { validateStatus: () => true }
      );

      if (res.status === 200 && res.data.success) {
        setStep(2);
        if (res.data.devMode) {
          setIsDevMode(true);
        }
        toast.success(res.data.message || "Verification code sent!");
      } else {
        const msg = res.data.message || "Something went wrong. Please try again.";
        if (res.status === 429) {
          setIsRateLimited(true);
        }
        setErrorMessage(msg);
        toast.error(msg);
      }
    } catch (error: any) {
      console.error("Forgot password code request failed:", error);
      const msg = error.response?.data?.message || "Something went wrong. Please try again.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Verify code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (otpCode.length !== 6 || !/^\d+$/.test(otpCode)) {
      toast.error("Please enter a 6-digit verification code.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await axios.post(
        getApiUrl("/user/verify-reset-otp"),
        { identifier: identifier.trim(), code: otpCode.trim() },
        { validateStatus: () => true }
      );

      if (res.status === 200 && res.data.success) {
        setStep(3);
        toast.success("Verification successful!");
      } else {
        const msg = res.data.message || "Invalid or expired code.";
        setErrorMessage(msg);
        toast.error(msg);
      }
    } catch (error: any) {
      console.error("Code verification failed:", error);
      const msg = error.response?.data?.message || "Something went wrong. Please try again.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Set new password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await axios.post(
        getApiUrl("/user/reset-password"),
        {
          identifier: identifier.trim(),
          code: otpCode.trim(),
          password
        },
        { validateStatus: () => true }
      );

      if (res.status === 200 && res.data.success) {
        setStep(4);
        toast.success("Password updated successfully!");
      } else {
        const msg = res.data.message || "Password update failed.";
        setErrorMessage(msg);
        toast.error(msg);
      }
    } catch (error: any) {
      console.error("Password reset update failed:", error);
      const msg = error.response?.data?.message || "Something went wrong. Please try again.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePassword = () => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const allChars = uppercase + lowercase;

    let generated = "";
    // Guarantee at least one uppercase and one lowercase character
    generated += uppercase[Math.floor(Math.random() * uppercase.length)];
    generated += lowercase[Math.floor(Math.random() * lowercase.length)];

    for (let i = 2; i < 12; i++) {
      generated += allChars[Math.floor(Math.random() * allChars.length)];
    }

    generated = generated
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");

    setPassword(generated);
    setConfirmPassword(generated);
    setShowPassword(true);
    toast.info("Secure random password generated and autofilled!");
  };


  const handleRestartFlow = () => {
    setStep(1);
    setIdentifier("");
    setOtpCode("");
    setPassword("");
    setConfirmPassword("");
    setIsDevMode(false);
    setErrorMessage(null);
    setIsRateLimited(false);
  };

  return (
    <>
      <Head>
        <title>Reset Password | InternArea</title>
        <meta name="description" content="Reset your InternArea account password using email verification." />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col items-center justify-center px-4 py-16">
        {/* Background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-100 rounded-full opacity-30 blur-3xl"></div>
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-100 rounded-full opacity-30 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-50 rounded-full opacity-20 blur-3xl"></div>
        </div>

        <div className="relative w-full max-w-md z-10 animate-[fadeIn_0.4s_ease-out]">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors mb-8 group"
          >
            <ArrowLeft size={16} className="mr-1.5 transition-transform group-hover:-translate-x-0.5" />
            Back to Home
          </Link>

          {/* Main Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-blue-900/5 border border-white/60 p-8 sm:p-10 text-black">
            {/* Header Icon & Title */}
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-blue-500/25">
                {step === 4 ? (
                  <ShieldCheck size={28} className="text-white animate-bounce" />
                ) : step === 3 ? (
                  <Lock size={28} className="text-white" />
                ) : (
                  <KeyRound size={28} className="text-white" />
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                {step === 1 && "Forgot Password?"}
                {step === 2 && "Enter Verification Code"}
                {step === 3 && "Set New Password"}
                {step === 4 && "Reset Successful!"}
              </h1>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                {step === 1 && "Enter your registered email or phone and we'll send you a 6-digit verification code."}
                {step === 2 && `Enter the 6-digit verification code sent to: ${identifier}`}
                {step === 3 && "Choose a strong, secure password for your account."}
                {step === 4 && "Your password has been updated. You can now log in."}
              </p>
            </div>

            {/* Error banners */}
            {errorMessage && (
              <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3.5 animate-[fadeIn_0.3s_ease-out]">
                <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-800">
                    {isRateLimited ? "Limit Reached" : "Error"}
                  </p>
                  <p className="text-xs text-red-700 mt-0.5">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* STEP 1: Enter Email / Phone */}
            {step === 1 && (
              <form onSubmit={handleSendCode}>
                {/* Mode toggle tabs */}
                <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      setInputType("email");
                      setIdentifier("");
                      setErrorMessage(null);
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                      inputType === "email"
                        ? "bg-white text-blue-600 shadow-sm font-semibold"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Mail size={16} />
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInputType("phone");
                      setIdentifier("");
                      setErrorMessage(null);
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                      inputType === "phone"
                        ? "bg-white text-blue-600 shadow-sm font-semibold"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Phone size={16} />
                    Phone
                  </button>
                </div>

                <div className="mb-6">
                  <label htmlFor="identifier-input" className="block text-sm font-medium text-gray-700 mb-2">
                    {inputType === "email" ? "Email Address" : "Phone Number"}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                      {inputType === "email" ? <Mail size={18} /> : <Phone size={18} />}
                    </div>
                    <input
                      id="identifier-input"
                      type={inputType === "email" ? "email" : "tel"}
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={inputType === "email" ? "you@example.com" : "1234567890"}
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all bg-gray-50/50 hover:bg-white text-black"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Send Verification Code
                    </>
                  )}
                </button>

                <p className="mt-5 text-center text-xs text-gray-400 leading-relaxed">
                  You can request a verification code <span className="font-medium text-gray-500">once per day</span>.
                </p>
              </form>
            )}

            {/* STEP 2: Enter Verification Code */}
            {step === 2 && (
              <form onSubmit={handleVerifyCode} className="space-y-6">
                {isDevMode && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left animate-[fadeIn_0.3s_ease-out]">
                    <p className="text-xs font-semibold text-amber-800 flex items-center gap-1.5 mb-1.5">
                      <AlertTriangle size={14} className="text-amber-500" />
                      Verification Code Note
                    </p>
                    <p className="text-xs text-amber-600 leading-relaxed">
                      For testing purposes, the verification code is printed in the server terminal console logs. Please retrieve it from there.
                    </p>
                  </div>
                )}

                <div>
                  <label htmlFor="otp-input" className="block text-sm font-medium text-gray-700 mb-2">
                    6-Digit Verification Code
                  </label>
                  <input
                    id="otp-input"
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full py-3.5 border border-gray-200 rounded-xl text-center text-xl font-semibold tracking-[0.5em] text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all bg-gray-50/50 hover:bg-white text-black"
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 px-4 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all cursor-pointer text-center"
                  >
                    Change Info
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || otpCode.length !== 6}
                    className="flex-[2] py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      "Verify Code"
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Enter New Password */}
            {step === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                      New Password
                    </label>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      Generate Password
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                      <Lock size={18} />
                    </div>
                    <input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-12 pr-10 py-3 border border-gray-200 rounded-xl text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all bg-gray-50/50 hover:bg-white text-black"
                      required
                      minLength={6}
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

                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                      <Lock size={18} />
                    </div>
                    <input
                      id="confirm-password"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all bg-gray-50/50 hover:bg-white text-black"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Updating Password...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </form>
            )}

            {/* STEP 4: Success confirmation */}
            {step === 4 && (
              <div className="space-y-6 animate-[fadeIn_0.4s_ease-out]">
                <p className="text-sm text-gray-600 text-center leading-relaxed">
                  Your password has been successfully updated. You can now navigate back to the home page and log in using your new credentials.
                </p>
                <div className="flex flex-col gap-3">
                  <Link
                    href="/"
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-center font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all flex items-center justify-center gap-2"
                  >
                    Go to Home & Log In
                  </Link>
                  <button
                    onClick={handleRestartFlow}
                    className="w-full py-3 px-4 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all cursor-pointer text-center"
                  >
                    Reset Another Account
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer sign in hint */}
          {step !== 4 && (
            <p className="text-center text-xs text-gray-400 mt-6">
              Remember your password?{" "}
              <Link href="/" className="text-blue-500 hover:text-blue-600 font-medium transition-colors">
                Sign in here
              </Link>
            </p>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default ForgotPassword;
