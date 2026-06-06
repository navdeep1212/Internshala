import { getApiUrl } from "@/utils/api";
import axios from "axios";
import {
  Calendar,
  CreditCard,
  Download,
  FileText,
  Key,
  Layers,
  Search,
  ArrowLeft,
  DollarSign,
  Users,
  CheckCircle,
  XCircle
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

const AdminResumes = () => {
  const [activeTab, setActiveTab] = useState<"resumes" | "payments" | "otps">("resumes");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalResumes: 0,
    revenueGenerated: 0,
    activePremiumUsers: 0,
    successfulPayments: 0,
    failedPayments: 0
  });

  const [resumes, setResumes] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [otpLogs, setOtpLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch admin stats & tables data
  const fetchAdminData = async () => {
    try {
      setLoading(true);

      // Fetch stats
      const statsRes = await axios.get(getApiUrl("/admin/stats"));
      setStats(statsRes.data);

      // Fetch resumes list
      const resumesRes = await axios.get(getApiUrl(`/admin/resumes?search=${searchQuery}`));
      setResumes(resumesRes.data);

      // Fetch payments
      const paymentsRes = await axios.get(getApiUrl("/admin/payments"));
      setPayments(paymentsRes.data);

      // Fetch OTP logs
      const otpsRes = await axios.get(getApiUrl("/admin/otp-logs"));
      setOtpLogs(otpsRes.data);

    } catch (err) {
      console.error("Failed to load admin data:", err);
      toast.error("Error loading administrative logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAdminData();
  };

  const downloadPdf = (resume: any) => {
    const token = localStorage.getItem("resume_token") || "admin";
    window.open(getApiUrl(`/resume/download/${resume._id}?token=${token}`));
    toast.success("Downloading student resume...");
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 text-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation back */}
        <Link
          href="/adminpanel"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Admin Panel
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Resume & Payment Management
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Monitor billing status, verification metrics, and download generated candidate resumes
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Resumes</span>
              <span className="text-2xl font-black text-slate-800">{stats.totalResumes}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Revenue Generated</span>
              <span className="text-2xl font-black text-slate-800">₹{stats.revenueGenerated}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Premium Users</span>
              <span className="text-2xl font-black text-slate-800">{stats.activePremiumUsers}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-teal-50 text-teal-600">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Paid Checkout</span>
              <span className="text-2xl font-black text-slate-800">{stats.successfulPayments}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-50 text-red-600">
              <XCircle className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Failed Attempts</span>
              <span className="text-2xl font-black text-slate-800">{stats.failedPayments}</span>
            </div>
          </div>
        </div>

        {/* Tab Selector & Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6 gap-4">
          <div className="flex bg-slate-50 p-1.5 rounded-xl border border-slate-200">
            {[
              { id: "resumes", label: "Student Resumes", count: resumes.length },
              { id: "payments", label: "Payments Logs", count: payments.length },
              { id: "otps", label: "OTP Verification Logs", count: otpLogs.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-white text-blue-600 shadow-sm border border-slate-200"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {activeTab === "resumes" && (
            <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-80">
              <div className="relative flex-grow">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by student email or name..."
                  className="w-full text-slate-800 text-xs pl-8 pr-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
              >
                Find
              </button>
            </form>
          )}
        </div>

        {/* Main Content Tables */}
        {loading ? (
          <div className="bg-white rounded-2xl p-10 border border-slate-100 shadow-sm text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto" />
            <span className="text-xs text-slate-400 mt-2 block">Refreshing logs from MongoDB...</span>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-lg overflow-hidden">
            
            {/* 1. Student Resumes Table */}
            {activeTab === "resumes" && (
              resumes.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">No generated resumes found.</div>
              ) : (
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Candidate Name</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Template</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Created Date</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {resumes.map((resume) => (
                      <tr key={resume._id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-800">
                          {resume.personalInfo?.fullName || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                          {resume.personalInfo?.email || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                          {resume.templateUsed}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                          {new Date(resume.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => downloadPdf(resume)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 text-[10px] font-bold rounded-lg transition-all focus:outline-none cursor-pointer"
                          >
                            <Download className="h-3 w-3" /> Download Resume
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {/* 2. Payments History Logs */}
            {activeTab === "payments" && (
              payments.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">No payment checkout logs found.</div>
              ) : (
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Order ID</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Payment ID</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">User UID</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Verified Email</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {payments.map((p) => (
                      <tr key={p._id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-800">{p.razorpay_order_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">{p.razorpay_payment_id || "—"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400 font-mono select-all">{p.user_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">{p.verified_email || "N/A"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                          {new Date(p.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            p.status === "successful"
                              ? "bg-emerald-100 text-emerald-800"
                              : p.status === "failed"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {/* 3. OTP Verification Logs */}
            {activeTab === "otps" && (
              otpLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">No OTP verification records.</div>
              ) : (
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Verified Email</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">OTP Hash</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Verification Attempts</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Last Request</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Verified Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {otpLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-800">{log.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400 font-mono max-w-[150px] truncate" title={log.otp}>
                          {log.otp}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 text-center font-bold">
                          {log.attempts} / 3
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                          {new Date(log.lastSentAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            log.verified ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                          }`}>
                            {log.verified ? "Verified" : "Pending"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

          </div>
        )}

      </div>
    </div>
  );
};

export default AdminResumes;
