import { selectuser } from "@/Feature/Userslice";
import axios from "axios";
import {
  ArrowUpRight,
  Bookmark,
  Calendar,
  Clock,
  Coins,
  ExternalLink,
  Hourglass,
  MapPin,
  Share2,
  ShieldAlert,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { getApiUrl } from "@/utils/api";

const JobDetail = () => {
  const user = useSelector(selectuser);
  const router = useRouter();
  const { id } = router.query;
  const [jobdata, setjob] = useState<any>(null);
  const [latestResume, setLatestResume] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchdata = async () => {
      try {
        const res = await axios.get(getApiUrl(`/job/${id}`));
        setjob(res.data);
      } catch (error) {
        console.error("Error fetching job details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchdata();
  }, [id]);

  useEffect(() => {
    if (!user) return;
    const fetchLatestResume = async () => {
      try {
        const token = localStorage.getItem("resume_token");
        if (!token) return;
        const res = await axios.get(getApiUrl("/resume/my-resumes"), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const activeResume = res.data.find((r: any) => r.pdfUrl);
        if (activeResume) {
          setLatestResume(activeResume);
        }
      } catch (err) {
        console.error("Failed to load user resume for job apply:", err);
      }
    };
    fetchLatestResume();
  }, [user]);

  const [availability, setAvailability] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");

  const handlesubmitapplication = async () => {
    if (!coverLetter.trim()) {
      toast.error("please write a cover letter");
      return;
    }
    if (!availability) {
      toast.error("please select your availability");
      return;
    }
    try {
      const applicationdata = {
        category: jobdata.category,
        company: jobdata.company,
        coverLetter: coverLetter,
        user: user,
        Application: id,
        availability,
      };
      await axios.post(getApiUrl("/application"), applicationdata);
      toast.success("Application submitted successfully");
      router.push("/job");
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit application");
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.info("Link copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8faff]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!jobdata) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8faff] p-4 text-center">
        <ShieldAlert className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Job Not Found</h2>
        <p className="text-gray-500 mt-2">The job position you are looking for does not exist or has been removed.</p>
        <Link href="/" className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl">
          Back to Home
        </Link>
      </div>
    );
  }

  // Derive skills based on category for a premium appearance
  const getDerivedSkills = (category: string) => {
    const cat = (category || "").toLowerCase();
    if (cat.includes("engineering") || cat.includes("computer") || cat.includes("web") || cat.includes("software")) {
      return ["React", "Node.js", "Javascript", "MongoDB", "Tailwind CSS", "Express"];
    } else if (cat.includes("data") || cat.includes("python") || cat.includes("science")) {
      return ["Python", "SQL", "Pandas", "Machine Learning", "Data Analysis", "R Studio"];
    } else if (cat.includes("design") || cat.includes("graphic") || cat.includes("ui")) {
      return ["Figma", "UI/UX Design", "Adobe Illustrator", "Photoshop", "Typography"];
    }
    return ["Coordination", "Marketing", "Sales Management", "Communication Skills"];
  };

  const skills = getDerivedSkills(jobdata.category);

  // Generate deterministic number of applicants
  const applicantCount = jobdata._id 
    ? (parseInt(jobdata._id.substring(0, 8), 16) % 35) + 15 
    : 32;

  return (
    <div className="bg-[#f8faff] min-h-screen py-10 font-sans text-gray-800">
      
      {/* Centered Page Heading */}
      <div className="max-w-4xl mx-auto px-4 mb-8 text-center">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950">
          {jobdata.title} - Job
        </h1>
      </div>

      <div className="max-w-4xl mx-auto px-4">
        
        {/* Main Detailed Card Container */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-8">
          
          {/* Card Header area */}
          <div className="border-b border-gray-100 pb-6 relative">
            
            {/* Actively Hiring Badge */}
            <div className="flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 w-fit px-2.5 py-1 rounded-full mb-4">
              <ArrowUpRight size={12} />
              Actively hiring
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-tight">
              {jobdata.title}
            </h2>
            <p className="text-gray-500 font-semibold mt-1">
              {jobdata.company}
            </p>
            <p className="text-gray-400 text-xs font-semibold mt-3 flex items-center gap-1">
              <MapPin size={14} className="text-gray-400" />
              {jobdata.location}
            </p>

            {/* Quick specifications grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6 p-4 rounded-xl bg-gray-50 text-xs font-semibold text-gray-600 border border-gray-100">
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Start Date</p>
                <p className="text-gray-800 mt-1">{jobdata.StartDate || "Immediate"}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Experience</p>
                <p className="text-gray-800 mt-1">{jobdata.Experience || "0-2 Years"}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">CTC (Annual)</p>
                <p className="text-gray-800 mt-1">{jobdata.CTC}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Apply By</p>
                <p className="text-gray-800 mt-1">5 Jul '26</p>
              </div>
            </div>

            {/* Little tags row */}
            <div className="flex flex-wrap gap-2 mt-4 text-[10px] font-bold">
              <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded">Posted today</span>
              <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Job</span>
            </div>

            {/* Social, Bookmark, and Application Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-gray-50 pt-4 mt-6 gap-4">
              <div className="flex items-center gap-4 text-xs text-gray-500 font-semibold">
                <div className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                  <Users size={14} className="text-gray-400" />
                  <span>{applicantCount} applicants</span>
                </div>
                
                {/* Bookmark Toggle */}
                <button
                  onClick={() => {
                    setIsBookmarked(!isBookmarked);
                    toast.success(isBookmarked ? "Removed bookmark" : "Bookmarked successfully!");
                  }}
                  className={`p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer ${isBookmarked ? "text-yellow-500 border-yellow-500" : "text-gray-400"}`}
                >
                  <Bookmark size={15} className={isBookmarked ? "fill-yellow-500" : ""} />
                </button>

                {/* Share Link */}
                <button
                  onClick={handleShare}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-400 cursor-pointer"
                >
                  <Share2 size={15} />
                </button>
              </div>

              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
              >
                Apply now
              </button>
            </div>

          </div>

          {/* Section: About the Job */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              About the Job
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line font-medium">
              {jobdata.aboutJob}
            </p>
          </div>

          {/* Section: Skill(s) required */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Skill(s) required
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {skills.map((skill) => (
                <span key={skill} className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full font-medium">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Section: Certification guides links */}
          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100/30 text-xs font-semibold text-gray-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>Earn certifications in these skills:</span>
            <div className="flex flex-wrap gap-3 text-blue-600">
              <span className="cursor-pointer hover:underline">Learn Business Communication</span>
              <span className="text-gray-300">|</span>
              <span className="cursor-pointer hover:underline">Learn Business Analytics</span>
              <span className="text-gray-300">|</span>
              <span className="cursor-pointer hover:underline">Learn Digital Marketing</span>
            </div>
          </div>

          {/* Section: Who can apply */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Who can apply
            </h3>
            <ul className="text-xs text-gray-600 space-y-2 font-medium list-decimal pl-4 leading-relaxed">
              <li>Are available for full time (in-office) job positioning</li>
              <li>Can start working immediately or standard notice structure</li>
              <li>Possess the relevant qualifications and experience level ({jobdata.Experience})</li>
              <li>Have robust problem solving and coordination capabilities</li>
              {jobdata.whoCanApply && (
                <li className="list-none -ml-4 mt-2 text-gray-500 italic">
                  Additional Details: {jobdata.whoCanApply}
                </li>
              )}
            </ul>
          </div>

          {/* Section: Perks */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Perks
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {jobdata.perks && jobdata.perks.length > 0 ? (
                jobdata.perks.map((perk: string) => (
                  <span key={perk} className="bg-orange-50 text-orange-700 text-xs px-3 py-1 rounded-full font-medium border border-orange-100">
                    {perk}
                  </span>
                ))
              ) : (
                <>
                  <span className="bg-orange-50 text-orange-700 text-xs px-3 py-1 rounded-full font-medium border border-orange-100">Health Insurance</span>
                  <span className="bg-orange-50 text-orange-700 text-xs px-3 py-1 rounded-full font-medium border border-orange-100">Flexible Work Hours</span>
                  <span className="bg-orange-50 text-orange-700 text-xs px-3 py-1 rounded-full font-medium border border-orange-100">Paid Time Off</span>
                </>
              )}
            </div>
          </div>

          {/* Section: Additional Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Additional Information
            </h3>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-600 leading-relaxed font-semibold">
              <p className="font-bold text-gray-800 mb-1">CTC &amp; Incentives Info:</p>
              <p>{jobdata.AdditionalInfo || "Detailed salary breakup, employee benefits, and equity options to be shared during interviews."}</p>
            </div>
          </div>

          {/* Section: About Company Info */}
          <div className="border-t border-gray-100 pt-6 space-y-4">
            <h3 className="text-md font-extrabold text-gray-900">
              About {jobdata.company}
            </h3>
            
            <a href="#" className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700">
              Website <ExternalLink size={12} />
            </a>

            <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line font-medium">
              {jobdata.aboutCompany || "We are a technology development studio building cutting-edge software applications. Our focus is to deliver simple solutions to complex business problems."}
            </p>

            {/* Activity Box */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-[11px] font-semibold text-gray-600 max-w-md">
              <p className="text-gray-400 font-bold uppercase tracking-wider text-[9px] mb-1.5">Activity on Internshala</p>
              <div className="flex items-center justify-between">
                <span>Hiring since June 2026</span>
                <span className="text-blue-600">1 opportunity posted</span>
              </div>
            </div>
          </div>

          {/* Centered Bottom Apply Button */}
          <div className="flex justify-center border-t border-gray-100 pt-6">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-10 py-3.5 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              Apply now
            </button>
          </div>

        </div>

        {/* BOTTOM WARNING BANNER: Save yourself from fraud */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mt-8 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed text-amber-900 font-medium">
            <span className="font-bold text-amber-950">Save yourself from fraud!</span> If an employer asks you to pay any security deposit, registration fee, laptop fee, etc., do not pay and <span className="underline cursor-pointer font-bold">notify us</span> immediately. Internshala <span className="font-bold">doesn't charge</span> a fee from the students to apply to a job or an internship &amp; <span className="font-bold">we don't</span> allow other companies to do so either.
          </div>
        </div>

      </div>

      {/* Apply Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full mx-4 max-h-[95vh] overflow-y-auto shadow-xl">
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  Apply to {jobdata.company}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Resume Section */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider">
                  Your Resume
                </h3>
                {latestResume ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between text-black">
                    <div>
                      <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                        ✨ Premium Resume Attached
                      </span>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                        Template: {latestResume.templateUsed} • Generated on {new Date(latestResume.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => window.open(getApiUrl(`/resume/download/${latestResume._id}?token=${localStorage.getItem("resume_token")}`))}
                      className="text-xs text-blue-600 hover:text-blue-700 font-bold cursor-pointer"
                    >
                      View PDF
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-black">
                    <span className="text-xs font-bold text-amber-800 flex items-center gap-1">
                      ⚠️ Standard Profile Submission
                    </span>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-normal font-medium">
                      No premium resume found. Upgrade to the premium Resume Builder to automatically attach an ATS-compliant PDF resume to your application.
                    </p>
                    <Link
                      href="/resume-builder"
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-700 mt-1.5 inline-block"
                    >
                      Build Premium Resume Now
                    </Link>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider">
                  Cover Letter
                </h3>
                <p className="text-xs text-gray-500 mb-2">
                  Why should you be selected for this job?
                </p>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  className="w-full h-32 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-black text-xs font-semibold focus:outline-none focus:border-transparent"
                  placeholder="Write your cover letter here..."
                ></textarea>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider">
                  Your Availability
                </h3>
                <div className="space-y-2 text-xs font-semibold text-gray-700">
                  {[
                    "Yes, I am available to join immediately",
                    "No, I am currently on notice period",
                    "No, I will have to serve notice period",
                    "Other",
                  ].map((option) => (
                    <label key={option} className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-50 rounded-lg">
                      <input
                        type="radio"
                        name="availability"
                        value={option}
                        checked={availability === option}
                        onChange={(e) => setAvailability(e.target.value)}
                        className="h-4 w-4 text-blue-600"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-50">
                {user ? (
                  <button className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl cursor-pointer" onClick={handlesubmitapplication}>
                    Submit Application
                  </button>
                ) : (
                  <Link
                    href={`/`}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl flex items-center justify-center"
                  >
                    Sign up to apply
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetail;
