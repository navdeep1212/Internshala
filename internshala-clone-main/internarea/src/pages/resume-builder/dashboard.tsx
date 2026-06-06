import { selectuser } from "@/Feature/Userslice";
import { getApiUrl } from "@/utils/api";
import axios from "axios";
import {
  Calendar,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  Lock,
  Plus,
  Sparkles,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

const ResumeDashboard = () => {
  const user = useSelector(selectuser);
  const [resumes, setResumes] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("resume_token");
        if (!token) return;

        // Fetch user resumes
        const resumesRes = await axios.get(getApiUrl("/resume/my-resumes"), {
          headers: { Authorization: `Bearer ${token}` }
        });
        setResumes(resumesRes.data);

        // Fetch payment logs
        const paymentsRes = await axios.get(getApiUrl("/resume/payment-history"), {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPayments(paymentsRes.data);
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const handleDownload = (resumeId: string) => {
    const token = localStorage.getItem("resume_token");
    if (!token) return;
    window.open(getApiUrl(`/resume/download/${resumeId}?token=${token}`));
    toast.success("Downloading PDF resume...");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 text-black">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-100 text-center">
          <Lock className="mx-auto h-12 w-12 text-blue-500 mb-4 animate-bounce" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Login Required</h2>
          <p className="text-slate-600 mb-6">
            Please login to access your Resume Dashboard.
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-md text-sm"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 text-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-slate-200 pb-5">
          <div className="space-y-1">
            <Link
              href="/resume-builder"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors mb-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Builder
            </Link>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              My Resumes Dashboard <Sparkles className="h-5.5 w-5.5 text-amber-500" />
            </h1>
            <p className="text-slate-600 text-sm">
              Manage your generated resumes, PDF downloads, and transaction history
            </p>
          </div>
          <Link
            href="/resume-builder"
            className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Create New Resume
          </Link>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse bg-white border border-slate-100 rounded-2xl h-44" />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            
            {/* Generated Resumes Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Generated Resumes
              </h2>

              {resumes.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <FileText className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                  <h3 className="font-bold text-slate-700">No Resumes Found</h3>
                  <p className="text-slate-500 text-xs mt-1 mb-5">
                    You haven't generated any premium resumes yet. Complete the payment to unlock downloading.
                  </p>
                  <Link
                    href="/resume-builder"
                    className="inline-flex items-center px-5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-all"
                  >
                    Generate Resume Now
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {resumes.map((resume) => (
                    <div
                      key={resume._id}
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between h-48 group relative overflow-hidden"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            resume.pdfUrl ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                          }`}>
                            {resume.pdfUrl ? "PDF Generated" : "Draft Status"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {new Date(resume.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-800 text-sm tracking-tight truncate">
                          {resume.personalInfo?.fullName || "Untitled Resume"}
                        </h3>
                        <p className="text-xs text-slate-400 font-medium">
                          Template: <span className="text-slate-600">{resume.templateUsed}</span>
                        </p>
                      </div>

                      <div className="border-t pt-3 flex justify-between items-center mt-4">
                        {resume.pdfUrl ? (
                          <>
                            <button
                              onClick={() => handleDownload(resume._id)}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 focus:outline-none cursor-pointer"
                            >
                              <Download className="h-4 w-4" /> Download PDF
                            </button>
                            <Link
                              href="/resume-builder"
                              className="text-slate-400 hover:text-slate-600 text-[10px] font-bold inline-flex items-center gap-1"
                            >
                              Edit details <ExternalLink className="h-3 w-3" />
                            </Link>
                          </>
                        ) : (
                          <>
                            <Link
                              href="/resume-builder"
                              className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700"
                            >
                              Continue Draft
                            </Link>
                            <span className="text-[9px] text-slate-400 font-bold uppercase">Unpaid</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment History Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                Payment & Billing History
              </h2>

              {payments.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-2xl border border-slate-100 shadow-sm text-slate-400 text-xs">
                  No billing transactions logged.
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Order ID</th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Verified Email</th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {payments.map((payment) => (
                        <tr key={payment._id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-700">{payment.razorpay_order_id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" />
                              {new Date(payment.created_at).toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-900">₹{payment.amount}.00</td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">{payment.verified_email || "N/A"}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              payment.status === "successful"
                                ? "bg-emerald-100 text-emerald-800"
                                : payment.status === "failed"
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                            }`}>
                              {payment.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default ResumeDashboard;
