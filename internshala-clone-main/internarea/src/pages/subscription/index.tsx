import { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import axios from "axios";
import { useSelector } from "react-redux";
import { selectuser } from "@/Feature/Userslice";
import { getApiUrl } from "@/utils/api";
import { CheckCircle, Crown, Clock, Shield, Zap, ArrowRight, Star, XCircle, Loader2, X } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const getPlanIcon = (planId: string, className = "h-8 w-8") => {
  switch (planId) {
    case "free": return <Shield className={className} />;
    case "bronze": return <Zap className={className} />;
    case "silver": return <Star className={className} />;
    case "gold": return <Crown className={className} />;
    default: return <Shield className={className} />;
  }
};

const PLANS = [
  {
    id: "free",
    name: "Free",
    emoji: "",
    price: 0,
    limit: 1,
    limitLabel: "1 application / month",
    color: "from-slate-600 to-slate-800",
    accent: "#64748b",
    badge: null,
    features: ["1 internship application per month", "Basic profile listing", "Email notifications"],
    notIncluded: ["Priority processing", "Profile visibility boost", "Premium internship access"],
  },
  {
    id: "bronze",
    name: "Bronze",
    emoji: "",
    price: 100,
    limit: 3,
    limitLabel: "3 applications / month",
    color: "from-amber-600 to-orange-700",
    accent: "#d97706",
    badge: "STARTER",
    features: ["3 internship applications per month", "Priority application processing", "Profile visibility boost", "Email notifications"],
    notIncluded: ["Premium internship access"],
  },
  {
    id: "silver",
    name: "Silver",
    emoji: "",
    price: 300,
    limit: 5,
    limitLabel: "5 applications / month",
    color: "from-slate-400 to-slate-600",
    accent: "#94a3b8",
    badge: "POPULAR",
    features: ["5 internship applications per month", "Priority application processing", "Profile visibility boost", "Access to premium internship listings", "Email notifications"],
    notIncluded: [],
  },
  {
    id: "gold",
    name: "Gold",
    emoji: "",
    price: 1000,
    limit: null,
    limitLabel: "Unlimited applications",
    color: "from-yellow-400 to-amber-500",
    accent: "#f59e0b",
    badge: "BEST VALUE",
    features: ["Unlimited internship applications", "Priority application processing", "Top profile visibility", "Access to all premium listings", "Dedicated support", "Early access to new internships"],
    notIncluded: [],
  },
];

interface WindowStatus {
  open: boolean;
  windowStart: string;
  windowEnd: string;
  secondsUntilOpen: number;
}

interface SubStatus {
  plan: string;
  limit: number | null;
  used: number;
  remaining: number | null;
}

export default function SubscriptionPage() {
  const user = useSelector(selectuser);

  const [windowStatus, setWindowStatus] = useState<WindowStatus | null>(null);
  const [subStatus, setSubStatus] = useState<SubStatus | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [loading, setLoading] = useState<string | null>(null); // planId being processed
  const [successModal, setSuccessModal] = useState<{ plan: string; invoice: string; expires: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    if (document.getElementById("rzp-script")) { setRazorpayLoaded(true); return; }
    const script = document.createElement("script");
    script.id = "rzp-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);
  }, []);

  const fetchWindowStatus = useCallback(async () => {
    try {
      const res = await axios.get(getApiUrl("/resume/subscription/check-window"));
      setWindowStatus(res.data);
      setCountdown(res.data.secondsUntilOpen || 0);
    } catch (_) {}
  }, []);

  const fetchSubStatus = useCallback(async () => {
    if (!user) return;
    try {
      let token = localStorage.getItem("authToken");
      if (!token) {
        const tokenRes = await axios.post(getApiUrl("/resume/auth-token"), {
          uid: user.uid,
          email: user.email,
          name: user.name,
          photoURL: user.photo
        });
        token = tokenRes.data.token;
        if (token) {
          localStorage.setItem("authToken", token);
          localStorage.setItem("resume_token", token);
        }
      }
      if (!token) return;
      const res = await axios.get(getApiUrl("/resume/subscription/status"), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubStatus(res.data);
    } catch (_) {}
  }, [user]);

  useEffect(() => {
    fetchWindowStatus();
    fetchSubStatus();
    const interval = setInterval(fetchWindowStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchWindowStatus, fetchSubStatus]);

  // Countdown timer
  useEffect(() => {
    if (!windowStatus || windowStatus.open) return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          fetchWindowStatus();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [windowStatus, fetchWindowStatus]);

  const formatCountdown = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
    return `${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  };

  const handleUpgrade = async (planId: string) => {
    if (!user) { setErrorMsg("Please log in to upgrade your plan."); return; }
    if (!razorpayLoaded) { setErrorMsg("Payment gateway is loading. Please try again."); return; }

    setErrorMsg(null);
    setLoading(planId);

    try {
      const token = localStorage.getItem("authToken");
      const orderRes = await axios.post(
        getApiUrl("/resume/subscription/order"),
        { plan: planId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { order, keyId, amount } = orderRes.data;

      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Internship Portal",
        description: `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan Subscription`,
        order_id: order.id,
        prefill: {
          email: user.email || "",
          name: user.name || user.displayName || "",
        },
        theme: { color: "#1e3a8a" },
        handler: async (response: any) => {
          try {
            const verifyRes = await axios.post(
              getApiUrl("/resume/subscription/verify"),
              {
                razorpay_order_id: response.razorpay_order_id || order.id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan: planId,
                email: user.email
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (verifyRes.data.success) {
              setSuccessModal({
                plan: planId,
                invoice: verifyRes.data.invoiceNumber,
                expires: verifyRes.data.expiresAt
              });
              fetchSubStatus();
            }
          } catch (err: any) {
            setErrorMsg(err?.response?.data?.error || "Payment verification failed.");
          } finally {
            setLoading(null);
          }
        },
        modal: {
          ondismiss: () => setLoading(null)
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Failed to initiate payment.";
      const secs = err?.response?.data?.secondsUntilOpen;
      if (secs) {
        setErrorMsg(`${msg} Payment window opens in ${formatCountdown(secs)}.`);
      } else {
        setErrorMsg(msg);
      }
      setLoading(null);
    }
  };

  const currentPlan = subStatus?.plan || "free";

  return (
    <>
      <Head>
        <title>Subscription Plans — Internship Portal</title>
        <meta name="description" content="Choose a subscription plan to unlock more internship applications. Free, Bronze, Silver, and Gold plans available." />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a] text-white">

        {/* Header */}
        <div className="pt-16 pb-8 text-center px-4">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs font-bold tracking-widest uppercase mb-6 backdrop-blur-sm">
            <Crown size={14} className="text-yellow-400" />
            Subscription Plans
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-white via-blue-200 to-indigo-300 bg-clip-text text-transparent">
            Unlock Your Potential
          </h1>
          <p className="text-blue-200 text-lg max-w-xl mx-auto font-medium">
            Choose the right plan to power your internship journey. Apply smarter, get hired faster.
          </p>
        </div>

        {/* Payment Window Banner */}
        <div className="max-w-4xl mx-auto px-4 mb-10">
          {windowStatus ? (
            windowStatus.open ? (
              <div className="flex items-center justify-center gap-3 bg-emerald-500/20 border border-emerald-400/40 rounded-2xl px-6 py-4 backdrop-blur-sm">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <p className="text-emerald-300 font-bold text-sm">
                  ✅ Payment window is <span className="text-emerald-200">OPEN</span> — {windowStatus.windowStart} to {windowStatus.windowEnd}. Complete your upgrade now!
                </p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-amber-500/10 border border-amber-400/30 rounded-2xl px-6 py-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <Clock size={20} className="text-amber-400 shrink-0" />
                  <div>
                    <p className="text-amber-300 font-bold text-sm">Payment window is closed</p>
                    <p className="text-amber-400/70 text-xs mt-0.5">Payments accepted only between {windowStatus.windowStart} – {windowStatus.windowEnd} IST</p>
                  </div>
                </div>
                <div className="bg-amber-500/20 border border-amber-400/30 rounded-xl px-5 py-2.5 text-center shrink-0">
                  <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-0.5">Window opens in</p>
                  <p className="text-amber-200 text-xl font-extrabold font-mono tabular-nums">
                    {formatCountdown(countdown)}
                  </p>
                </div>
              </div>
            )
          ) : (
            <div className="bg-white/5 rounded-2xl px-6 py-4 animate-pulse h-16" />
          )}
        </div>

        {/* Current Plan Badge */}
        {subStatus && (
          <div className="max-w-4xl mx-auto px-4 mb-8 flex justify-center">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-5 py-2 text-sm font-semibold backdrop-blur-sm">
              <span className="text-blue-200">Your current plan:</span>
              <span className="text-white font-extrabold capitalize flex items-center gap-1.5">
                {getPlanIcon(currentPlan, "h-4 w-4 text-yellow-400")} {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
              </span>
              {subStatus.limit !== null && (
                <span className="bg-blue-500/30 text-blue-200 text-xs px-2.5 py-0.5 rounded-full">
                  {subStatus.used}/{subStatus.limit} used
                </span>
              )}
              {subStatus.limit === null && (
                <span className="bg-yellow-500/30 text-yellow-200 text-xs px-2.5 py-0.5 rounded-full">
                  Unlimited
                </span>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMsg && (
          <div className="max-w-4xl mx-auto px-4 mb-6">
            <div className="flex items-start gap-3 bg-red-500/20 border border-red-400/40 rounded-xl px-5 py-4">
              <XCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm font-medium">{errorMsg}</p>
              <button onClick={() => setErrorMsg(null)} className="ml-auto text-red-400 hover:text-red-300">
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        <div className="max-w-6xl mx-auto px-4 pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map((plan) => {
              const isCurrent = currentPlan === plan.id;
              const isGold = plan.id === "gold";
              const isSilver = plan.id === "silver";

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-3xl flex flex-col overflow-hidden transition-transform duration-300 hover:-translate-y-1 ${
                    isGold
                      ? "ring-2 ring-yellow-400/60 shadow-2xl shadow-yellow-400/10"
                      : isSilver
                      ? "ring-2 ring-slate-400/40"
                      : "ring-1 ring-white/10"
                  }`}
                  style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(12px)" }}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div className={`absolute top-4 right-4 text-[9px] font-extrabold tracking-widest uppercase px-2.5 py-1 rounded-full ${
                      isGold ? "bg-yellow-400 text-yellow-900" :
                      isSilver ? "bg-blue-500 text-white" :
                      "bg-orange-500 text-white"
                    }`}>
                      {plan.badge}
                    </div>
                  )}

                  {/* Card Header */}
                  <div className={`bg-gradient-to-br ${plan.color} p-6 pt-8`}>
                    <div className="text-white opacity-95 mb-2">{getPlanIcon(plan.id, "h-8 w-8")}</div>
                    <h2 className="text-xl font-extrabold text-white">{plan.name}</h2>
                    <p className="text-white/70 text-xs mt-1 font-medium">{plan.limitLabel}</p>
                    <div className="mt-4">
                      {plan.price === 0 ? (
                        <span className="text-3xl font-extrabold text-white">Free</span>
                      ) : (
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-extrabold text-white">₹{plan.price}</span>
                          <span className="text-white/60 text-sm font-medium">/month</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="flex-1 p-6 space-y-3">
                    {plan.features.map((f, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <CheckCircle size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-white/80 text-xs font-medium leading-relaxed">{f}</span>
                      </div>
                    ))}
                    {plan.notIncluded.map((f, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <XCircle size={15} className="text-white/20 shrink-0 mt-0.5" />
                        <span className="text-white/25 text-xs font-medium leading-relaxed">{f}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="p-6 pt-0">
                    {isCurrent ? (
                      <div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 border border-white/20 text-sm font-bold text-white/60">
                        <Star size={15} className="text-yellow-400" />
                        Current Plan
                      </div>
                    ) : plan.id === "free" ? (
                      <div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-white/40">
                        Default Plan
                      </div>
                    ) : (
                      <button
                        id={`upgrade-${plan.id}`}
                        onClick={() => handleUpgrade(plan.id)}
                        disabled={loading !== null || !windowStatus?.open}
                        className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-extrabold transition-all duration-200 ${
                          !windowStatus?.open
                            ? "bg-white/10 text-white/30 cursor-not-allowed border border-white/10"
                            : isGold
                            ? "bg-gradient-to-r from-yellow-400 to-amber-500 text-yellow-900 hover:from-yellow-300 hover:to-amber-400 shadow-lg shadow-yellow-400/20 active:scale-95"
                            : "bg-white text-slate-900 hover:bg-blue-50 shadow-md active:scale-95"
                        }`}
                      >
                        {loading === plan.id ? (
                          <>
                            <Loader2 size={15} className="animate-spin" />
                            Processing…
                          </>
                        ) : !windowStatus?.open ? (
                          <>
                            <Clock size={15} />
                            Window Closed
                          </>
                        ) : (
                          <>
                            <Zap size={15} />
                            Upgrade to {plan.name}
                            <ArrowRight size={14} />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Security Note */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-white/40 text-xs">
            <div className="flex items-center gap-2">
              <Shield size={14} />
              <span>Secured by Razorpay</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} />
              <span>Payments accepted 10:00 AM – 11:00 AM IST only</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={14} />
              <span>Invoice emailed after payment</span>
            </div>
          </div>
        </div>

        {/* Success Modal */}
        {successModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-white/10 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
              <CheckCircle size={60} className="text-emerald-500 mx-auto mb-4" />
              <h2 className="text-2xl font-extrabold text-white mb-2">
                Welcome to {successModal.plan.charAt(0).toUpperCase() + successModal.plan.slice(1)}!
              </h2>
              <p className="text-blue-200 text-sm mb-6 leading-relaxed">
                Your plan has been activated. An invoice has been sent to your email.
              </p>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Invoice No.</span>
                  <span className="text-white font-bold font-mono">{successModal.invoice}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Plan</span>
                  <span className="text-white font-bold capitalize">{successModal.plan}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Valid Until</span>
                  <span className="text-white font-bold">
                    {new Date(successModal.expires).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSuccessModal(null)}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-2xl transition-all"
              >
                Start Applying!
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
