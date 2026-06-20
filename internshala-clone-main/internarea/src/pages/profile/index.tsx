import { selectuser } from "@/Feature/Userslice";
import { ExternalLink, Mail, User as UserIcon, ShieldCheck, Lock, Eye, EyeOff, X, Clock, Laptop, Smartphone, Monitor, Chrome, HelpCircle, Activity, Loader2 } from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { getApiUrl } from "@/utils/api";
import { toast } from "react-toastify";

const Index = () => {
  const user = useSelector(selectuser);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ active: 0, accepted: 0 });

  // Change Password states
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Login History states
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const fetchUserData = async () => {
      try {
        // Exchange Firebase Auth details for local JWT token
        const tokenRes = await axios.post(getApiUrl("/resume/auth-token"), {
          uid: user.uid,
          email: user.email,
          name: user.name,
          photoURL: user.photo
        });
        
        setIsPremium(tokenRes.data.isPremium);
        localStorage.setItem("resume_token", tokenRes.data.token);
        localStorage.setItem("authToken", tokenRes.data.token);

        // Fetch applications stats
        const appRes = await axios.get(getApiUrl("/application"));
        const userApps = appRes.data.filter((app: any) => app.user?.uid === user.uid || app.user?.name === user.name);
        const active = userApps.length;
        const accepted = userApps.filter((app: any) => app.status === "accepted" || app.status === "approved").length;
        setStats({ active, accepted });
      } catch (err) {
        console.error("Profile initialization error:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchLoginHistory = async () => {
      setLoadingHistory(true);
      try {
        const historyRes = await axios.get(getApiUrl("/user/login-history/" + user.email));
        if (historyRes.data.success) {
          setLoginHistory(historyRes.data.history || []);
        }
      } catch (err) {
        console.error("Fetch login history error:", err);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchUserData();
    fetchLoginHistory();
  }, [user]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) {
      toast.error("User email not found.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setIsUpdatingPassword(true);
      const res = await axios.post(
        getApiUrl("/user/change-password"),
        { email: user.email, newPassword },
        { validateStatus: () => true }
      );

      if (res.status === 200 && res.data.success) {
        toast.success(res.data.message || "Password updated successfully!");
        setIsChangePasswordOpen(false);
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(res.data.message || "Failed to update password.");
      }
    } catch (err: any) {
      console.error("Change password request error:", err);
      toast.error(err.response?.data?.message || "Failed to update password. Please try again.");
    } finally {
      setIsUpdatingPassword(false);
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

    setNewPassword(generated);
    setConfirmPassword(generated);
    setShowPassword(true);
    toast.info("Secure random password generated and autofilled!");
  };


  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          {/* Profile Header */}
          <div className="relative h-36 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700">
            <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
              {user?.photo ? (
                <img
                  src={user?.photo}
                  alt={user?.name}
                  className="w-24 h-24 rounded-full border-4 border-white shadow-xl object-cover bg-white"
                />
              ) : (
                <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl bg-gray-100 flex items-center justify-center">
                  <UserIcon className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Profile Content */}
          <div className="pt-16 pb-8 px-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-1.5">
                {user?.name || "Student"}
                {isPremium && (
                  <span title="Premium verified">
                    <ShieldCheck className="h-5 w-5 text-amber-500 fill-amber-50" />
                  </span>
                )}
              </h1>
              <div className="mt-1 flex items-center justify-center text-gray-500 text-sm">
                <Mail className="h-4 w-4 mr-2" />
                <span>{user?.email}</span>
              </div>
              
              <div className="mt-3">
                {loading ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-400">
                    Loading profile...
                  </span>
                ) : isPremium ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 shadow-sm animate-pulse">
                    Premium Student
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    Standard Student Account
                  </span>
                )}
              </div>
            </div>

            {/* Profile Details */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-center hover:shadow-sm transition-all duration-200">
                  <span className="text-blue-600 font-bold text-3xl">
                    {stats.active}
                  </span>
                  <p className="text-blue-700 text-sm font-medium mt-1">
                    Active Applications
                  </p>
                </div>
                <div className="bg-green-50/50 border border-green-100 rounded-xl p-4 text-center hover:shadow-sm transition-all duration-200">
                  <span className="text-green-600 font-bold text-3xl">
                    {stats.accepted}
                  </span>
                  <p className="text-green-700 text-sm font-medium mt-1">
                    Accepted Applications
                  </p>
                </div>
              </div>

              {/* Actions Grid */}
              <div className="border-t border-gray-100 pt-6">
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <Link
                    href="/userapplication"
                    className="inline-flex items-center justify-center px-6 py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors shadow-sm text-sm"
                  >
                    View Applications
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                  <Link
                    href="/resume-builder"
                    className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm text-sm"
                  >
                    Resume Builder
                    <span className="ml-2 bg-amber-400 text-blue-900 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">PRO</span>
                  </Link>
                  {isPremium && (
                    <Link
                      href="/resume-builder/dashboard"
                      className="inline-flex items-center justify-center px-6 py-3 bg-teal-600 text-white font-medium rounded-xl hover:bg-teal-700 transition-colors shadow-sm text-sm"
                    >
                      My Resumes Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => setIsChangePasswordOpen(true)}
                    className="inline-flex items-center justify-center px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-xl transition-colors shadow-sm text-sm cursor-pointer"
                  >
                    Change Password
                    <Lock className="ml-2 h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Login History Section */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                <Activity className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Security & Login History</h2>
                <p className="text-xs text-gray-500">Recent login attempts and device sessions</p>
              </div>
            </div>
            {loadingHistory && (
              <Loader2 className="h-4 w-4 text-indigo-600 animate-spin" />
            )}
          </div>
          
          <div className="p-6">
            {loadingHistory && loginHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-3" />
                <p className="text-sm font-medium">Retrieving login logs...</p>
              </div>
            ) : loginHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <HelpCircle className="h-10 w-10 text-gray-300 mb-3" />
                <p className="text-sm font-medium">No recent login records found</p>
                <p className="text-xs text-gray-400 mt-1">Logs will appear here when you sign in again.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      <th className="pb-3 pl-4">Device & OS</th>
                      <th className="pb-3 px-4">Browser</th>
                      <th className="pb-3 px-4">IP Address</th>
                      <th className="pb-3 px-4">Time</th>
                      <th className="pb-3 px-4">Status</th>
                      <th className="pb-3 pr-4 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {loginHistory.map((item, idx) => {
                      // Get OS icon
                      let DeviceIcon = Monitor;
                      if (item.device === "mobile") DeviceIcon = Smartphone;
                      else if (item.device === "laptop") DeviceIcon = Laptop;
                      
                      // Status styling
                      let statusBg = "bg-slate-100 text-slate-700 border-slate-200";
                      let statusText = "Unknown";
                      if (item.status === "success") {
                        statusBg = "bg-emerald-50 text-emerald-700 border-emerald-200";
                        statusText = "Success";
                      } else if (item.status === "failed") {
                        statusBg = "bg-rose-50 text-rose-700 border-rose-200";
                        statusText = "Failed";
                      } else if (item.status === "pending_otp") {
                        statusBg = "bg-amber-50 text-amber-700 border-amber-200";
                        statusText = "Pending OTP";
                      } else if (item.status === "blocked") {
                        statusBg = "bg-red-50/80 text-red-800 border-red-200/80";
                        statusText = "Blocked";
                      }

                      return (
                        <tr key={item._id || idx} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="py-3.5 pl-4 flex items-center gap-3">
                            <div className="p-2 bg-slate-100 text-slate-600 rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                              <DeviceIcon className="h-4 w-4" />
                            </div>
                            <div>
                              <span className="font-semibold text-gray-800 capitalize">{item.device || "Unknown"}</span>
                              <span className="block text-xs text-gray-400 font-medium">{item.os || "Unknown OS"}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 align-middle">
                            <div className="flex items-center gap-1.5 text-gray-700">
                              {item.browser && item.browser.toLowerCase().includes("chrome") && (
                                <Chrome className="h-3.5 w-3.5 text-amber-500" />
                              )}
                              <span className="font-medium">{item.browser || "Unknown"}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 align-middle text-gray-500 font-mono text-xs">
                            {item.ipAddress || "—"}
                          </td>
                          <td className="py-3.5 px-4 align-middle">
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <Clock className="h-3.5 w-3.5 text-gray-400" />
                              <span>{new Date(item.timestamp).toLocaleString()}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 align-middle">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusBg}`}>
                              {statusText}
                            </span>
                          </td>
                          <td className="py-3.5 pr-4 align-middle text-right text-xs font-medium text-gray-400 max-w-[150px] truncate" title={item.failureReason}>
                            {item.failureReason || <span className="text-gray-300">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all duration-300 animate-fadeIn">
          <div className="relative w-full max-w-md bg-white border border-gray-100 rounded-3xl shadow-2xl p-8 transform transition-all duration-300 scale-100 flex flex-col text-black">
            {/* Close Button */}
            <button
              onClick={() => {
                setIsChangePasswordOpen(false);
                setNewPassword("");
                setConfirmPassword("");
              }}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center mb-3">
                <Lock className="h-6 w-6 text-rose-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
              <p className="text-xs text-gray-500 mt-1">
                Enter your new password below. Make sure it is secure.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-gray-700 text-xs font-semibold uppercase tracking-wider" htmlFor="profile-new-password">
                    New Password
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Generate Password
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock size={18} />
                  </div>
                  <input
                    id="profile-new-password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm focus:outline-none transition-all text-black"
                    placeholder="At least 6 characters"
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
                <label className="block text-gray-700 text-xs font-semibold uppercase tracking-wider mb-1.5" htmlFor="profile-confirm-password">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock size={18} />
                  </div>
                  <input
                    id="profile-confirm-password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm focus:outline-none transition-all text-black"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3 rounded-xl transition-all shadow-sm focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:opacity-50 cursor-pointer flex justify-center items-center"
              >
                {isUpdatingPassword ? (
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  "Update Password"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
