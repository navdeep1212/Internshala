import { selectuser } from "@/Feature/Userslice";
import { getApiUrl } from "@/utils/api";
import axios from "axios";
import {
  Briefcase,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  GraduationCap,
  Image as ImageIcon,
  Key,
  Layers,
  Lock,
  Mail,
  Plus,
  Settings,
  Sparkles,
  Trash2,
  Upload,
  User as UserIcon,
  X,
  ShieldCheck,
  RefreshCw
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

const ResumeBuilder = () => {
  const user = useSelector(selectuser);
  const router = useRouter();

  // Active steps: 1 (Personal Info & Photo), 2 (Education), 3 (Skills), 4 (Experience), 5 (Projects), 6 (Certifications & Extra), 7 (Template & Payment/Download)
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [backendToken, setBackendToken] = useState("");

  // Resume State Data
  const [personalInfo, setPersonalInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    linkedin: "",
    github: "",
    portfolio: "",
    objective: "",
    photoUrl: ""
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [education, setEducation] = useState<any[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [experience, setExperience] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [achievementInput, setAchievementInput] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [languageInput, setLanguageInput] = useState("");
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [hobbyInput, setHobbyInput] = useState("");
  const [templateUsed, setTemplateUsed] = useState("Template 1"); // Template 1: Modern Professional, Template 2: Minimal Clean, Template 3: Corporate Executive

  // OTP Verification Modal States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpToken, setOtpToken] = useState(""); // Backend validation token/reference if needed
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpStep, setOtpStep] = useState<"email" | "otp">("email");
  const [devMode, setDevMode] = useState(false);
  const [devOtp, setDevOtp] = useState("");

  // Resume Download States
  const [downloading, setDownloading] = useState(false);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState("");
  const [resumeId, setResumeId] = useState("");

  // Load backend authentication and prefill details
  useEffect(() => {
    if (!user) return;
    
    // Prefill personal info from Firebase Auth
    setPersonalInfo((prev) => ({
      ...prev,
      fullName: prev.fullName || user.name || "",
      email: prev.email || user.email || ""
    }));

    const fetchAuthToken = async () => {
      try {
        const res = await axios.post(getApiUrl("/resume/auth-token"), {
          uid: user.uid,
          email: user.email,
          name: user.name,
          photoURL: user.photo
        });
        setBackendToken(res.data.token);
        setIsPremium(res.data.isPremium);
        localStorage.setItem("resume_token", res.data.token);

        // Load latest draft if any
        const resumesRes = await axios.get(getApiUrl("/resume/my-resumes"), {
          headers: { Authorization: `Bearer ${res.data.token}` }
        });
        if (resumesRes.data.length > 0) {
          const draft = resumesRes.data[0];
          setPersonalInfo(draft.personalInfo || {});
          if (draft.personalInfo?.photoUrl) {
            setPhotoPreview(draft.personalInfo.photoUrl.startsWith("http") ? draft.personalInfo.photoUrl : `http://localhost:5000${draft.personalInfo.photoUrl}`);
          }
          setEducation(draft.education || []);
          setSkills(draft.skills || []);
          setExperience(draft.experience || []);
          setProjects(draft.projects || []);
          setCertifications(draft.certifications || []);
          setAchievements(draft.achievements || []);
          setLanguages(draft.languages || []);
          setHobbies(draft.hobbies || []);
          setTemplateUsed(draft.templateUsed || "Template 1");
          if (draft.pdfUrl) {
            setGeneratedPdfUrl(draft.pdfUrl);
            setResumeId(draft._id);
          }
        }
      } catch (err) {
        console.error("Error exchanging tokens:", err);
      }
    };
    fetchAuthToken();
  }, [user]);

  // Handle OTP timer cooldown
  useEffect(() => {
    let interval: any;
    if (otpCooldown > 0) {
      interval = setInterval(() => {
        setOtpCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpCooldown]);

  // Handle file photo uploads
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit");
      return;
    }

    // Display Preview
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server
    const token = backendToken || localStorage.getItem("resume_token");
    if (!token) {
      toast.error("Auth session expired. Please log in again.");
      return;
    }

    const formData = new FormData();
    formData.append("photo", file);

    try {
      setLoading(true);
      const res = await axios.post(getApiUrl("/resume/upload-photo"), formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`
        }
      });
      setPersonalInfo((prev) => ({ ...prev, photoUrl: res.data.photoUrl }));
      toast.success("Profile photo uploaded successfully");
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to upload photo");
    } finally {
      setLoading(false);
    }
  };

  // Save Draft progress
  const saveDraft = async () => {
    const token = backendToken || localStorage.getItem("resume_token");
    if (!token) return;

    try {
      const resumeData = {
        personalInfo,
        education,
        skills,
        experience,
        projects,
        certifications,
        achievements,
        languages,
        hobbies,
        templateUsed
      };
      await axios.post(
        getApiUrl("/resume/save-draft"),
        { resumeData },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Failed to save draft:", err);
    }
  };

  // Form Field Dynamic Adders
  const addEducation = () => {
    setEducation([...education, { degree: "", college: "", branch: "", startYear: "", endYear: "", cgpa: "" }]);
  };
  const removeEducation = (index: number) => {
    setEducation(education.filter((_, i) => i !== index));
  };
  const handleEducationChange = (index: number, field: string, val: string) => {
    const updated = [...education];
    updated[index][field] = val;
    setEducation(updated);
  };

  const addExperience = () => {
    setExperience([...experience, { company: "", role: "", description: "", startDate: "", endDate: "" }]);
  };
  const removeExperience = (index: number) => {
    setExperience(experience.filter((_, i) => i !== index));
  };
  const handleExperienceChange = (index: number, field: string, val: string) => {
    const updated = [...experience];
    updated[index][field] = val;
    setExperience(updated);
  };

  const addProject = () => {
    setProjects([...projects, { name: "", technologies: "", description: "", githubLink: "", liveLink: "" }]);
  };
  const removeProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index));
  };
  const handleProjectChange = (index: number, field: string, val: string) => {
    const updated = [...projects];
    updated[index][field] = val;
    setProjects(updated);
  };

  const addCertification = () => {
    setCertifications([...certifications, { name: "", issuedBy: "", issueDate: "" }]);
  };
  const removeCertification = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };
  const handleCertificationChange = (index: number, field: string, val: string) => {
    const updated = [...certifications];
    updated[index][field] = val;
    setCertifications(updated);
  };

  // Tag Adders
  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && skillInput.trim()) {
      e.preventDefault();
      if (!skills.includes(skillInput.trim())) {
        setSkills([...skills, skillInput.trim()]);
      }
      setSkillInput("");
    }
  };
  const handleAddAchievement = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && achievementInput.trim()) {
      e.preventDefault();
      setAchievements([...achievements, achievementInput.trim()]);
      setAchievementInput("");
    }
  };
  const handleAddLanguage = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && languageInput.trim()) {
      e.preventDefault();
      setLanguages([...languages, languageInput.trim()]);
      setLanguageInput("");
    }
  };
  const handleAddHobby = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && hobbyInput.trim()) {
      e.preventDefault();
      setHobbies([...hobbies, hobbyInput.trim()]);
      setHobbyInput("");
    }
  };

  // Steps handling navigation
  const nextStep = () => {
    if (step === 1 && !personalInfo.fullName.trim()) {
      toast.error("Full Name is required");
      return;
    }
    saveDraft();
    setStep((prev) => Math.min(prev + 1, 7));
  };
  const prevStep = () => {
    saveDraft();
    setStep((prev) => Math.max(prev - 1, 1));
  };

  // OTP Email Sender Logic
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otpEmail || !otpEmail.includes("@")) {
      toast.error("Please enter a valid email address first.");
      return;
    }

    try {
      setOtpSending(true);
      const res = await axios.post(getApiUrl("/resume/send-otp"), { email: otpEmail });
      toast.success(res.data.message || "OTP code sent to your email!");
      setOtpCooldown(60);
      setOtpAttempts(0);
      setOtpStep("otp");
      
      // If backend runs in Developer Mode, it returns OTP in payload for testing
      if (res.data.devMode && res.data.otp) {
        setDevMode(true);
        setDevOtp(res.data.otp);
        toast.warning(`[Dev Mode] Verification OTP: ${res.data.otp}`);
        setOtpCode(res.data.otp); // Prefill for easy sandbox testing
      } else {
        setDevMode(false);
        setDevOtp("");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to dispatch verification email");
    } finally {
      setOtpSending(false);
    }
  };

  // OTP Verification Submission
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      toast.error("Please enter a 6-digit OTP code");
      return;
    }

    try {
      setOtpVerifying(true);
      const res = await axios.post(getApiUrl("/resume/verify-otp"), {
        email: otpEmail,
        otp: otpCode
      });
      toast.success(res.data.message || "Email verified successfully!");
      setOtpVerified(true);
      setShowOtpModal(false);
      
      // Call payment initializer immediately
      initiatePayment();
    } catch (err: any) {
      console.error(err);
      setOtpAttempts((prev) => prev + 1);
      toast.error(err.response?.data?.error || "Invalid verification code.");
      if (otpAttempts + 1 >= 3) {
        setShowOtpModal(false);
        toast.error("Maximum attempts reached. Please request a new code.");
      }
    } finally {
      setOtpVerifying(false);
    }
  };

  // Razorpay Checkout Integration script loading
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Initiate Razorpay Payment
  const initiatePayment = async () => {
    const token = backendToken || localStorage.getItem("resume_token");
    if (!token) {
      toast.error("Session expired. Please log in again.");
      return;
    }

    try {
      setLoading(true);
      
      // 1. Create order on Express backend
      const orderRes = await axios.post(
        getApiUrl("/resume/order"),
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { order, keyId } = orderRes.data;

      // 2. Load Checkout script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Failed to load Razorpay SDK. Check your network.");
        setLoading(false);
        return;
      }

      // 3. Open Checkout Panel
      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Internship Portal Pro",
        description: "Premium Resume Generation Fee",
        image: "/logo.png",
        order_id: order.id,
        handler: async function (response: any) {
          try {
            setLoading(true);
            const verifyRes = await axios.post(
              getApiUrl("/resume/verify-payment"),
              {
                razorpay_order_id: order.id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                verified_email: otpEmail,
                resumeData: {
                  personalInfo,
                  education,
                  skills,
                  experience,
                  projects,
                  certifications,
                  achievements,
                  languages,
                  hobbies,
                  templateUsed
                }
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (verifyRes.data.success) {
              toast.success("Payment verified! Premium resume generated.");
              setIsPremium(true);
              setGeneratedPdfUrl(verifyRes.data.pdfUrl);
              setResumeId(verifyRes.data.resumeId);
            }
          } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.error || "Payment verification failed.");
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: personalInfo.fullName,
          email: personalInfo.email,
          contact: personalInfo.phone
        },
        theme: {
          color: "#2563EB"
        },
        modal: {
          ondismiss: function () {
            toast.warning("Payment cancelled by user");
            setLoading(false);
          }
        }
      };

      // Handle Sandbox mock checkout bypass for dummy key settings
      if (keyId === "rzp_test_dummykeyid1234") {
        toast.info("[Dev Mode Bypass] Dummy Razorpay keys detected. Automating successful payment simulation...", { autoClose: 5000 });
        setTimeout(async () => {
          try {
            const verifyRes = await axios.post(
              getApiUrl("/resume/verify-payment"),
              {
                razorpay_order_id: order.id,
                razorpay_payment_id: "pay_dummy_transaction_1001",
                razorpay_signature: "dummy_signature_verified",
                verified_email: otpEmail || personalInfo.email,
                resumeData: {
                  personalInfo,
                  education,
                  skills,
                  experience,
                  projects,
                  certifications,
                  achievements,
                  languages,
                  hobbies,
                  templateUsed
                }
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (verifyRes.data.success) {
              toast.success("Payment verified! (Bypass Simulation)");
              setIsPremium(true);
              setGeneratedPdfUrl(verifyRes.data.pdfUrl);
              setResumeId(verifyRes.data.resumeId);
            }
          } catch (e) {
            console.error(e);
            toast.error("Bypass transaction failed");
          } finally {
            setLoading(false);
          }
        }, 1500);
        return;
      }

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to initiate transaction");
      setLoading(false);
    }
  };

  // Triggers PDF Download stream from Backend securely
  const downloadResume = async () => {
    if (!resumeId) return;
    const token = backendToken || localStorage.getItem("resume_token");
    if (!token) return;

    try {
      setDownloading(true);
      // We pass token as query parameter so browser download handles it easily
      window.open(getApiUrl(`/resume/download/${resumeId}?token=${token}`));
      toast.success("Downloading PDF resume...");
    } catch (err) {
      console.error(err);
      toast.error("Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 text-black">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-100 text-center">
          <Lock className="mx-auto h-12 w-12 text-blue-500 mb-4 animate-bounce" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Login Required</h2>
          <p className="text-slate-600 mb-6">
            Please login to access the Premium Resume Builder features.
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-md shadow-blue-200 text-sm"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  // Pre-load current templates color theme matching preview
  const getPreviewTheme = () => {
    switch (templateUsed) {
      case "Template 2":
        return {
          primary: "text-slate-800 border-slate-800",
          secondary: "text-slate-600",
          divider: "border-slate-200",
          font: "font-serif"
        };
      case "Template 3":
        return {
          primary: "text-teal-600 border-teal-600",
          secondary: "text-slate-700",
          divider: "border-teal-100",
          font: "font-mono"
        };
      default: // Modern Professional
        return {
          primary: "text-blue-600 border-blue-600",
          secondary: "text-slate-900",
          divider: "border-blue-100",
          font: "font-sans"
        };
    }
  };

  const previewTheme = getPreviewTheme();

  return (
    <div className="min-h-screen bg-slate-50 py-10 text-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page title header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
              Premium Resume Builder <Sparkles className="h-6 w-6 text-amber-500 fill-amber-100 animate-pulse" />
            </h1>
            <p className="mt-1 text-slate-600 text-sm">
              Design ATS-optimized, high-converting professional resumes
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/profile"
              className="inline-flex items-center px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-all shadow-sm"
            >
              Go to Profile
            </Link>
            <Link
              href="/resume-builder/dashboard"
              className="inline-flex items-center px-4 py-2 border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl transition-all shadow-sm"
            >
              Resume Dashboard
            </Link>
          </div>
        </div>

        {/* Steps Tracker */}
        <div className="mb-8 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
          <div className="flex justify-between items-center min-w-[700px] px-4">
            {[
              { id: 1, label: "Personal" },
              { id: 2, label: "Education" },
              { id: 3, label: "Skills" },
              { id: 4, label: "Experience" },
              { id: 5, label: "Projects" },
              { id: 6, label: "Certifications" },
              { id: 7, label: "Preview & Save" }
            ].map((s) => (
              <React.Fragment key={s.id}>
                <button
                  onClick={() => setStep(s.id)}
                  className="flex flex-col items-center gap-2 cursor-pointer focus:outline-none group"
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border transition-all duration-300 ${
                      step === s.id
                        ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100 scale-110"
                        : step > s.id
                        ? "bg-blue-100 text-blue-700 border-blue-200"
                        : "bg-slate-50 text-slate-400 border-slate-200 group-hover:border-slate-300"
                    }`}
                  >
                    {s.id}
                  </div>
                  <span
                    className={`text-[11px] font-medium transition-colors ${
                      step === s.id ? "text-blue-600 font-bold" : "text-slate-500"
                    }`}
                  >
                    {s.label}
                  </span>
                </button>
                {s.id < 7 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 rounded-full transition-colors duration-300 ${
                      step > s.id ? "bg-blue-300" : "bg-slate-100"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Main Interface Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left panel: Form Inputs (8 cols on large screen, 7 on preview page) */}
          <div className={`bg-white rounded-2xl border border-slate-100 shadow-lg p-6 ${step === 7 ? "lg:col-span-6" : "lg:col-span-7"}`}>
            
            {/* STEP 1: Personal Information */}
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-blue-600" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={personalInfo.fullName}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, fullName: e.target.value })}
                      placeholder="e.g. Navdeep Chaurasia"
                      className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Email Address *</label>
                    <input
                      type="email"
                      value={personalInfo.email}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                      placeholder="e.g. navdeep@example.com"
                      className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={personalInfo.phone}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                      placeholder="e.g. +91 9876543210"
                      className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Address</label>
                    <input
                      type="text"
                      value={personalInfo.address}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, address: e.target.value })}
                      placeholder="City, Country"
                      className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">LinkedIn URL</label>
                    <input
                      type="url"
                      value={personalInfo.linkedin}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, linkedin: e.target.value })}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">GitHub URL</label>
                    <input
                      type="url"
                      value={personalInfo.github}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, github: e.target.value })}
                      placeholder="https://github.com/username"
                      className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Portfolio Website</label>
                    <input
                      type="url"
                      value={personalInfo.portfolio}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, portfolio: e.target.value })}
                      placeholder="https://yourportfolio.com"
                      className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Career Objective</label>
                    <textarea
                      value={personalInfo.objective}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, objective: e.target.value })}
                      rows={3}
                      placeholder="Describe your career goals and profile strengths..."
                      className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 text-sm"
                    />
                  </div>
                </div>

                {/* Profile Photo Upload */}
                <div className="border-t pt-4">
                  <label className="block text-xs font-semibold text-slate-500 mb-2">Profile Photo (Max 5MB, JPG/PNG)</label>
                  <div className="flex items-center gap-4">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Photo Preview"
                        className="w-16 h-16 rounded-full border border-slate-200 object-cover bg-slate-50"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full border border-dashed border-slate-300 flex items-center justify-center bg-slate-50 text-slate-400">
                        <ImageIcon className="h-6 w-6" />
                      </div>
                    )}
                    <div>
                      <input
                        type="file"
                        id="resume-photo"
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="resume-photo"
                        className="cursor-pointer inline-flex items-center px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-all shadow-sm gap-2"
                      >
                        <Upload className="h-3.5 w-3.5 text-slate-400" />
                        Upload Image
                      </label>
                      <p className="mt-1 text-[10px] text-slate-400">Supported types: PNG, JPEG</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Education List */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-blue-600" />
                    Education Details
                  </h3>
                  <button
                    onClick={addEducation}
                    className="inline-flex items-center px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl transition-all gap-1 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add New
                  </button>
                </div>

                {education.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm border border-dashed rounded-2xl bg-slate-50">
                    No education entries added yet. Click 'Add New' to begin.
                  </div>
                ) : (
                  <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2">
                    {education.map((edu, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 rounded-2xl relative border border-slate-100 shadow-sm">
                        <button
                          onClick={() => removeEducation(idx)}
                          className="absolute top-4 right-4 text-slate-400 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Degree / Certification</label>
                            <input
                              type="text"
                              value={edu.degree}
                              onChange={(e) => handleEducationChange(idx, "degree", e.target.value)}
                              placeholder="e.g. Bachelor of Technology"
                              className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 text-sm bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">College / University</label>
                            <input
                              type="text"
                              value={edu.college}
                              onChange={(e) => handleEducationChange(idx, "college", e.target.value)}
                              placeholder="e.g. IIT Delhi"
                              className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 text-sm bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Branch / Stream</label>
                            <input
                              type="text"
                              value={edu.branch}
                              onChange={(e) => handleEducationChange(idx, "branch", e.target.value)}
                              placeholder="e.g. Computer Science"
                              className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 text-sm bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Start Year</label>
                            <input
                              type="text"
                              value={edu.startYear}
                              onChange={(e) => handleEducationChange(idx, "startYear", e.target.value)}
                              placeholder="e.g. 2021"
                              className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 text-sm bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">End Year (or Expected)</label>
                            <input
                              type="text"
                              value={edu.endYear}
                              onChange={(e) => handleEducationChange(idx, "endYear", e.target.value)}
                              placeholder="e.g. 2025"
                              className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 text-sm bg-white"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-slate-500 mb-1">CGPA / Percentage</label>
                            <input
                              type="text"
                              value={edu.cgpa}
                              onChange={(e) => handleEducationChange(idx, "cgpa", e.target.value)}
                              placeholder="e.g. 9.1 CGPA or 85%"
                              className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 text-sm bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: Skills Tags */}
            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                  <Layers className="h-5 w-5 text-blue-600" />
                  Skills Tags
                </h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Add Skill (Press Enter to add tag)
                  </label>
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleAddSkill}
                    placeholder="e.g. React.js, Python, AWS (Press Enter)"
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 text-sm"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Press 'Enter' on keyboard after typing each skill name.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {skills.length === 0 ? (
                    <span className="text-slate-400 text-sm">No skill tags added yet.</span>
                  ) : (
                    skills.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-100 text-blue-700 rounded-full text-xs font-semibold"
                      >
                        {s}
                        <button
                          type="button"
                          onClick={() => setSkills(skills.filter((sk) => sk !== s))}
                          className="hover:text-blue-900 font-bold focus:outline-none cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* STEP 4: Experience List */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-blue-600" />
                    Work Experience
                  </h3>
                  <button
                    onClick={addExperience}
                    className="inline-flex items-center px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl transition-all gap-1 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add New
                  </button>
                </div>

                {experience.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm border border-dashed rounded-2xl bg-slate-50">
                    No work experience entries added. Click 'Add New' to insert details.
                  </div>
                ) : (
                  <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2">
                    {experience.map((exp, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 rounded-2xl relative border border-slate-100 shadow-sm">
                        <button
                          onClick={() => removeExperience(idx)}
                          className="absolute top-4 right-4 text-slate-400 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Company Name</label>
                            <input
                              type="text"
                              value={exp.company}
                              onChange={(e) => handleExperienceChange(idx, "company", e.target.value)}
                              placeholder="e.g. Google India"
                              className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 text-sm bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Role / Job Title</label>
                            <input
                              type="text"
                              value={exp.role}
                              onChange={(e) => handleExperienceChange(idx, "role", e.target.value)}
                              placeholder="e.g. Software Engineer Intern"
                              className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 text-sm bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Start Date</label>
                            <input
                              type="text"
                              value={exp.startDate}
                              onChange={(e) => handleExperienceChange(idx, "startDate", e.target.value)}
                              placeholder="e.g. May 2023"
                              className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 text-sm bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">End Date (or 'Present')</label>
                            <input
                              type="text"
                              value={exp.endDate}
                              onChange={(e) => handleExperienceChange(idx, "endDate", e.target.value)}
                              placeholder="e.g. Aug 2023 or Present"
                              className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 text-sm bg-white"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Role Description</label>
                            <textarea
                              value={exp.description}
                              onChange={(e) => handleExperienceChange(idx, "description", e.target.value)}
                              rows={3}
                              placeholder="Describe your accomplishments, key responsibilities, or projects handled..."
                              className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 text-sm bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP 5: Projects List */}
            {step === 5 && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Settings className="h-5 w-5 text-blue-600" />
                    Projects List
                  </h3>
                  <button
                    onClick={addProject}
                    className="inline-flex items-center px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl transition-all gap-1 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add New
                  </button>
                </div>

                {projects.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm border border-dashed rounded-2xl bg-slate-50">
                    No projects added. Click 'Add New' to show project records.
                  </div>
                ) : (
                  <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2">
                    {projects.map((proj, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 rounded-2xl relative border border-slate-100 shadow-sm">
                        <button
                          onClick={() => removeProject(idx)}
                          className="absolute top-4 right-4 text-slate-400 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Project Name</label>
                            <input
                              type="text"
                              value={proj.name}
                              onChange={(e) => handleProjectChange(idx, "name", e.target.value)}
                              placeholder="e.g. Chat App"
                              className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 text-sm bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Technologies Used</label>
                            <input
                              type="text"
                              value={proj.technologies}
                              onChange={(e) => handleProjectChange(idx, "technologies", e.target.value)}
                              placeholder="e.g. Node, React, Socket.io"
                              className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 text-sm bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">GitHub Link</label>
                            <input
                              type="url"
                              value={proj.githubLink}
                              onChange={(e) => handleProjectChange(idx, "githubLink", e.target.value)}
                              placeholder="https://github.com/username/project"
                              className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 text-sm bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Live Demo Link</label>
                            <input
                              type="url"
                              value={proj.liveLink}
                              onChange={(e) => handleProjectChange(idx, "liveLink", e.target.value)}
                              placeholder="https://yourdemo.com"
                              className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 text-sm bg-white"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
                            <textarea
                              value={proj.description}
                              onChange={(e) => handleProjectChange(idx, "description", e.target.value)}
                              rows={3}
                              placeholder="Explain what the project does, your contributions, and core achievements..."
                              className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 text-sm bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP 6: Certifications & Extras */}
            {step === 6 && (
              <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-2">
                
                {/* Certifications Section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b pb-1">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-blue-600" />
                      Certifications
                    </h4>
                    <button
                      onClick={addCertification}
                      className="inline-flex items-center px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold rounded-lg transition-all gap-0.5 cursor-pointer"
                    >
                      <Plus className="h-3 w-3" /> Add
                    </button>
                  </div>
                  {certifications.map((cert, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl relative border border-slate-100">
                      <button
                        onClick={() => removeCertification(idx)}
                        className="absolute top-3 right-3 text-slate-400 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-1">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Cert Name</label>
                          <input
                            type="text"
                            value={cert.name}
                            onChange={(e) => handleCertificationChange(idx, "name", e.target.value)}
                            placeholder="e.g. AWS Solutions Architect"
                            className="w-full px-2 py-1.5 border rounded-lg focus:outline-none text-slate-800 text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Issued By</label>
                          <input
                            type="text"
                            value={cert.issuedBy}
                            onChange={(e) => handleCertificationChange(idx, "issuedBy", e.target.value)}
                            placeholder="e.g. Amazon Web Services"
                            className="w-full px-2 py-1.5 border rounded-lg focus:outline-none text-slate-800 text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Issue Date</label>
                          <input
                            type="text"
                            value={cert.issueDate}
                            onChange={(e) => handleCertificationChange(idx, "issueDate", e.target.value)}
                            placeholder="e.g. Oct 2023"
                            className="w-full px-2 py-1.5 border rounded-lg focus:outline-none text-slate-800 text-xs bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Achievements Input tags */}
                <div className="space-y-2 border-t pt-4">
                  <label className="block text-xs font-semibold text-slate-500">
                    Achievements (Press Enter to add item)
                  </label>
                  <input
                    type="text"
                    value={achievementInput}
                    onChange={(e) => setAchievementInput(e.target.value)}
                    onKeyDown={handleAddAchievement}
                    placeholder="e.g. Secured 1st rank in Hackathon (Press Enter)"
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none text-slate-800 text-sm"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {achievements.map((ach, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 border text-slate-700 rounded-lg text-xs font-medium">
                        {ach}
                        <button type="button" onClick={() => setAchievements(achievements.filter((_, idx) => idx !== i))} className="font-bold text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer">×</button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Languages Input tags */}
                <div className="space-y-2 border-t pt-4">
                  <label className="block text-xs font-semibold text-slate-500">
                    Languages Known (Press Enter to add tag)
                  </label>
                  <input
                    type="text"
                    value={languageInput}
                    onChange={(e) => setLanguageInput(e.target.value)}
                    onKeyDown={handleAddLanguage}
                    placeholder="e.g. English, Hindi, Spanish (Press Enter)"
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none text-slate-800 text-sm"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {languages.map((l, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 border text-slate-700 rounded-lg text-xs font-medium">
                        {l}
                        <button type="button" onClick={() => setLanguages(languages.filter((_, idx) => idx !== i))} className="font-bold text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer">×</button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Hobbies Input tags */}
                <div className="space-y-2 border-t pt-4">
                  <label className="block text-xs font-semibold text-slate-500">
                    Hobbies & Interests (Press Enter to add tag)
                  </label>
                  <input
                    type="text"
                    value={hobbyInput}
                    onChange={(e) => setHobbyInput(e.target.value)}
                    onKeyDown={handleAddHobby}
                    placeholder="e.g. Reading, Football, Chess (Press Enter)"
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none text-slate-800 text-sm"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {hobbies.map((h, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 border text-slate-700 rounded-lg text-xs font-medium">
                        {h}
                        <button type="button" onClick={() => setHobbies(hobbies.filter((_, idx) => idx !== i))} className="font-bold text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer">×</button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 7: Select Template & Checkout Paywall */}
            {step === 7 && (
              <div className="space-y-6">
                
                {/* Select templates grid */}
                <div className="space-y-3">
                  <h3 className="text-md font-bold text-slate-800 flex items-center gap-1.5">
                    <Layers className="h-4.5 w-4.5 text-blue-600" />
                    Select Resume Template
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { name: "Template 1", label: "Modern Professional", desc: "Two-column bold sidebar design" },
                      { name: "Template 2", label: "Minimal Clean", desc: "Clean center aligned simple layout" },
                      { name: "Template 3", label: "Corporate Executive", desc: "Sleek horizontal headers layout" }
                    ].map((t) => (
                      <button
                        key={t.name}
                        onClick={() => {
                          setTemplateUsed(t.name);
                          saveDraft();
                        }}
                        className={`p-3 text-left border-2 rounded-xl transition-all duration-300 flex flex-col justify-between h-28 cursor-pointer ${
                          templateUsed === t.name
                            ? "border-blue-600 bg-blue-50/20 shadow-md shadow-blue-50"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            templateUsed === t.name ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                          }`}>
                            {t.name}
                          </span>
                          <h4 className="text-xs font-bold text-slate-800 mt-2 tracking-tight">{t.label}</h4>
                        </div>
                        <span className="text-[9px] text-slate-400 leading-tight">{t.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Paywall Container */}
                <div className="border-t pt-6">
                  {isPremium ? (
                    <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl flex flex-col items-center text-center">
                      <CheckCircle className="h-10 w-10 text-emerald-600 mb-2 animate-bounce" />
                      <h4 className="font-bold text-emerald-800">Premium Access Enabled!</h4>
                      <p className="text-xs text-emerald-600 max-w-sm mt-1">
                        You have unlocked the resume builder. Download your high-resolution, ATS-friendly PDF.
                      </p>
                      <button
                        onClick={downloadResume}
                        disabled={downloading}
                        className="mt-4 inline-flex items-center px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-100 gap-2 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {downloading ? "Downloading..." : "Download PDF Resume"}
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-28 h-28 bg-blue-600/30 rounded-full blur-xl" />
                      <div className="absolute bottom-0 left-0 transform -translate-x-4 translate-y-4 w-28 h-28 bg-teal-600/30 rounded-full blur-xl" />
                      
                      <div className="relative z-10 space-y-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-400 text-blue-900 uppercase">
                          PRO Feature
                        </span>
                        <h4 className="text-lg font-bold tracking-tight">Upgrade to Premium Builder</h4>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Verify your email and complete a one-time fee of **₹50** to download your PDF resume and automatically attach it to your internship applications.
                        </p>
                        
                        <div className="border-t border-slate-800 pt-4 flex justify-between items-center">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium">TOTAL PAYABLE</span>
                            <span className="text-2xl font-black text-white">₹50 <span className="text-xs font-normal text-slate-400">INR</span></span>
                          </div>
                          <button
                            onClick={() => {
                              setShowOtpModal(true);
                              setOtpStep("email");
                              setOtpEmail(personalInfo.email || user?.email || "");
                              setDevMode(false);
                              setDevOtp("");
                              setOtpCode("");
                            }}
                            className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-all gap-1.5 cursor-pointer"
                          >
                            Verify & Pay
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Button Controls */}
            <div className="flex justify-between items-center border-t pt-4 mt-6">
              {step > 1 ? (
                <button
                  onClick={prevStep}
                  className="inline-flex items-center px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all gap-1 cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
              ) : (
                <div />
              )}

              {step < 7 ? (
                <button
                  onClick={nextStep}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all gap-1 cursor-pointer"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <div />
              )}
            </div>
          </div>

          {/* Right panel: Real-time Visual Resume Preview (4 cols on step 7, 5 cols on steps 1-6) */}
          <div className={`lg:block ${step === 7 ? "lg:col-span-6" : "lg:col-span-5"}`}>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-5 sticky top-6">
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="h-4.5 w-4.5 text-blue-600" />
                  Live Resume Preview
                </h3>
                <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg border">
                  Updates in Real-time
                </span>
              </div>

              {/* PDF Mock Visual Canvas */}
              <div className={`border rounded-xl p-5 bg-white shadow-inner max-h-[75vh] overflow-y-auto ${previewTheme.font}`}>
                
                {/* Header preview depending on template selection */}
                {templateUsed === "Template 2" ? (
                  <div className="text-center border-b pb-4">
                    <h2 className="text-xl font-bold tracking-tight text-slate-800">{personalInfo.fullName || "Your Full Name"}</h2>
                    <p className="text-[9px] text-slate-500 mt-1 leading-snug">
                      {personalInfo.phone && `${personalInfo.phone}  |  `}{personalInfo.email || "email@example.com"}
                      {personalInfo.address && `  |  ${personalInfo.address}`}
                    </p>
                    <div className="text-[8px] text-slate-400 mt-1 flex justify-center gap-2">
                      {personalInfo.linkedin && <span>LinkedIn: {personalInfo.linkedin}</span>}
                      {personalInfo.github && <span>GitHub: {personalInfo.github}</span>}
                      {personalInfo.portfolio && <span>Portfolio: {personalInfo.portfolio}</span>}
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-4 border-b pb-4 items-start">
                    {photoPreview && (
                      <img
                        src={photoPreview}
                        alt="Photo Preview"
                        className="w-14 h-14 rounded-full object-cover border border-slate-200"
                      />
                    )}
                    <div>
                      <h2 className={`text-lg font-bold tracking-tight ${previewTheme.primary}`}>
                        {personalInfo.fullName || "Your Full Name"}
                      </h2>
                      <p className="text-[9px] text-slate-500 mt-0.5 font-medium">
                        {personalInfo.phone && `${personalInfo.phone}  •  `}{personalInfo.email || "email@example.com"}
                        {personalInfo.address && `  •  ${personalInfo.address}`}
                      </p>
                      <div className="text-[8px] text-slate-400 mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
                        {personalInfo.linkedin && <span>LinkedIn: {personalInfo.linkedin}</span>}
                        {personalInfo.github && <span>GitHub: {personalInfo.github}</span>}
                        {personalInfo.portfolio && <span>Portfolio: {personalInfo.portfolio}</span>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Career Objective */}
                {personalInfo.objective && (
                  <div className="mt-3">
                    <h3 className={`text-[10px] font-extrabold uppercase tracking-wide border-b pb-0.5 mb-1.5 ${previewTheme.primary}`}>
                      Career Objective
                    </h3>
                    <p className="text-[9px] text-slate-700 leading-relaxed text-justify">
                      {personalInfo.objective}
                    </p>
                  </div>
                )}

                {/* Education Section */}
                {education.length > 0 && (
                  <div className="mt-3">
                    <h3 className={`text-[10px] font-extrabold uppercase tracking-wide border-b pb-0.5 mb-1.5 ${previewTheme.primary}`}>
                      Education
                    </h3>
                    <div className="space-y-2">
                      {education.map((edu, i) => (
                        <div key={i} className="text-[9px]">
                          <div className="flex justify-between font-bold text-slate-800">
                            <span>{edu.degree || "Degree"} {edu.branch && `(${edu.branch})`}</span>
                            <span className="text-slate-400 font-normal">{edu.startYear || "Year"} - {edu.endYear || "Year"}</span>
                          </div>
                          <div className="flex justify-between text-slate-600 mt-0.5">
                            <span>{edu.college || "College / University"}</span>
                            {edu.cgpa && <span className="font-semibold text-slate-500">Marks: {edu.cgpa}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience Section */}
                {experience.length > 0 && (
                  <div className="mt-3">
                    <h3 className={`text-[10px] font-extrabold uppercase tracking-wide border-b pb-0.5 mb-1.5 ${previewTheme.primary}`}>
                      Work Experience
                    </h3>
                    <div className="space-y-2.5">
                      {experience.map((exp, i) => (
                        <div key={i} className="text-[9px]">
                          <div className="flex justify-between font-bold text-slate-800">
                            <span>{exp.role || "Role"} at {exp.company || "Company"}</span>
                            <span className="text-slate-400 font-normal">{exp.startDate || "Date"} - {exp.endDate || "Date"}</span>
                          </div>
                          <p className="text-slate-600 mt-1 leading-relaxed text-justify white-space-pre-line">
                            {exp.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Projects Section */}
                {projects.length > 0 && (
                  <div className="mt-3">
                    <h3 className={`text-[10px] font-extrabold uppercase tracking-wide border-b pb-0.5 mb-1.5 ${previewTheme.primary}`}>
                      Projects
                    </h3>
                    <div className="space-y-2.5">
                      {projects.map((proj, i) => (
                        <div key={i} className="text-[9px]">
                          <div className="flex justify-between font-bold text-slate-800">
                            <span>{proj.name || "Project Name"}</span>
                            <div className="text-[7.5px] text-slate-400 font-normal flex gap-1.5">
                              {proj.githubLink && <span>Repo</span>}
                              {proj.liveLink && <span>Live</span>}
                            </div>
                          </div>
                          {proj.technologies && (
                            <span className={`text-[8px] font-bold block ${previewTheme.primary}`}>
                              Tech: {proj.technologies}
                            </span>
                          )}
                          <p className="text-slate-600 mt-1 leading-relaxed text-justify">
                            {proj.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills tags list */}
                {skills.length > 0 && (
                  <div className="mt-3">
                    <h3 className={`text-[10px] font-extrabold uppercase tracking-wide border-b pb-0.5 mb-1.5 ${previewTheme.primary}`}>
                      Skills
                    </h3>
                    <p className="text-[9px] text-slate-700 leading-snug">
                      {skills.join(", ")}
                    </p>
                  </div>
                )}

                {/* Certifications Section */}
                {certifications.length > 0 && (
                  <div className="mt-3">
                    <h3 className={`text-[10px] font-extrabold uppercase tracking-wide border-b pb-0.5 mb-1.5 ${previewTheme.primary}`}>
                      Certifications
                    </h3>
                    <div className="space-y-1">
                      {certifications.map((cert, i) => (
                        <div key={i} className="flex justify-between text-[9px] text-slate-700">
                          <span>
                            <span className="font-semibold text-slate-800">{cert.name || "Cert Name"}</span>
                            {cert.issuedBy && ` — Issued by ${cert.issuedBy}`}
                          </span>
                          <span className="text-slate-400">{cert.issueDate || "Date"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Achievements List */}
                {achievements.length > 0 && (
                  <div className="mt-3">
                    <h3 className={`text-[10px] font-extrabold uppercase tracking-wide border-b pb-0.5 mb-1.5 ${previewTheme.primary}`}>
                      Achievements
                    </h3>
                    <ul className="list-disc pl-3 text-[9px] text-slate-700 space-y-0.5">
                      {achievements.map((ach, i) => (
                        <li key={i}>{ach}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Extra columns for Languages and Hobbies */}
                <div className="grid grid-cols-2 gap-4 mt-3">
                  {languages.length > 0 && (
                    <div>
                      <h3 className={`text-[9px] font-extrabold uppercase tracking-wide border-b pb-0.5 mb-1.5 ${previewTheme.primary}`}>
                        Languages
                      </h3>
                      <p className="text-[8.5px] text-slate-700">{languages.join(", ")}</p>
                    </div>
                  )}
                  {hobbies.length > 0 && (
                    <div>
                      <h3 className={`text-[9px] font-extrabold uppercase tracking-wide border-b pb-0.5 mb-1.5 ${previewTheme.primary}`}>
                        Hobbies
                      </h3>
                      <p className="text-[8.5px] text-slate-700">{hobbies.join(", ")}</p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>

        </div>

      </div>

      {/* OTP verification email modal overlay */}
      {showOtpModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all duration-300 animate-fadeIn text-black">
          <div className="relative w-full max-w-md bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 scale-100 text-slate-700">
            {/* Header decor */}
            <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>

            {/* Close Button */}
            <button
              onClick={() => {
                setShowOtpModal(false);
              }}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="p-8">
              {/* Title & Info */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-blue-600 mb-3">
                  {otpStep === "email" ? <Mail size={24} /> : <ShieldCheck size={24} />}
                </div>
                <h3 className="text-xl font-bold text-gray-900">OTP Email Verification</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Verify your email to securely purchase premium resume access and download it instantly.
                </p>
              </div>

              {/* Step 1: Send OTP Form */}
              {otpStep === "email" && (
                <form onSubmit={handleSendOtp} className="space-y-4 text-left">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="email"
                        required
                        value={otpEmail}
                        onChange={(e) => setOtpEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={otpSending}
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {otpSending ? (
                      <RefreshCw className="animate-spin" size={18} />
                    ) : (
                      "Send Verification Code"
                    )}
                  </button>
                </form>
              )}

              {/* Step 2: Verify OTP Form */}
              {otpStep === "otp" && (
                <form onSubmit={handleVerifyOtp} className="space-y-6 text-left">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Enter 6-Digit Code
                      </label>
                      <button
                        type="button"
                        onClick={() => setOtpStep("email")}
                        className="text-xs text-blue-600 hover:underline cursor-pointer"
                      >
                        Change Email
                      </button>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="XXXXXX"
                      className="w-full tracking-[1em] text-center font-bold text-2xl py-3 border border-gray-200 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:tracking-normal"
                    />
                    <p className="mt-2 text-center text-xs text-gray-500">
                      Code sent to <span className="font-semibold text-gray-700">{otpEmail}</span>
                    </p>
                  </div>

                  {/* Cooldown Resend Area */}
                  <div className="flex justify-between items-center text-xs px-1">
                    <span className="text-slate-400">
                      {otpCooldown > 0 ? `Resend OTP in ${otpCooldown}s` : "No code received?"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSendOtp()}
                      disabled={otpCooldown > 0 || otpSending}
                      className="font-bold text-blue-600 hover:text-blue-700 disabled:text-slate-400 focus:outline-none cursor-pointer"
                    >
                      {otpSending ? "Resending..." : "Resend Code"}
                    </button>
                  </div>

                  {/* Dev Mode Notification Panel */}
                  {devMode && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                      <p className="font-bold mb-1">🛠 Sandbox Mode (No SMTP Credentials Set)</p>
                      <p className="mb-2">Your email server environment variables are not configured. Use the generated OTP below to complete verification:</p>
                      <div className="flex items-center justify-center p-2 bg-amber-100 font-mono font-bold text-base tracking-[0.5em] rounded border border-amber-300">
                        {devOtp}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowOtpModal(false)}
                      className="flex-1 py-3 border rounded-xl hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={otpVerifying}
                      className="flex-1 py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-xl hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {otpVerifying ? (
                        <RefreshCw className="animate-spin" size={18} />
                      ) : (
                        "Verify Code"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ResumeBuilder;
