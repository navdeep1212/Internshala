import { selectuser } from "@/Feature/Userslice";
import { ExternalLink, Mail, User as UserIcon, ShieldCheck } from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { getApiUrl } from "@/utils/api";

const Index = () => {
  const user = useSelector(selectuser);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ active: 0, accepted: 0 });

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

    fetchUserData();
  }, [user]);

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
                    ✨ Premium Student
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
