import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import {
  ArrowUpRight,
  Briefcase,
  Calendar,
  Clock,
  ExternalLink,
  GraduationCap,
  MapPin,
  Play,
  PlayCircle,
  ShieldAlert,
  Smartphone,
  Star,
  Users,
} from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { useSelector } from "react-redux";
import { selectuser } from "@/Feature/Userslice";
import { useLanguage } from "@/context/LanguageContext";
import { getApiUrl } from "@/utils/api";

export default function DashboardHome() {
  const { t } = useLanguage();
  const user = useSelector(selectuser);
  
  // Dynamic greeting name based on login state
  const userName = user ? (user.name || user.displayName || "Student") : "Student";

  const [internships, setinternships] = useState<any[]>([]);
  const [jobs, setjobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [internshipRes, jobRes] = await Promise.all([
          axios.get(getApiUrl("/internship")),
          axios.get(getApiUrl("/job")),
        ]);
        setinternships(internshipRes.data || []);
        setjobs(jobRes.data || []);
      } catch (error) {
        console.error("Error fetching homepage data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-[#f8faff] min-h-screen text-gray-800 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Greetings Section */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-950 flex items-center gap-2">
            Hi, {userName}!
          </h1>
          <p className="text-gray-500 text-lg mt-1 font-medium">
            Let's help you land your dream career.
          </p>
        </div>

        {/* Outer 2-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT SIDEBAR: To Do List (3 Cols on large screens) */}
          {user && (
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white rounded-2xl border border-blue-50 shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  To do list <span className="text-sm font-semibold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">2</span>
                </h2>
                <div className="space-y-4">
                  {/* To-do Item 1 */}
                  <div className="p-4 rounded-xl bg-orange-50 border border-orange-100 hover:shadow-sm transition-shadow">
                    <div className="flex items-start gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-orange-950">Resume premium access</h3>
                        <p className="text-xs text-orange-800 mt-1 font-medium">1 resource in progress</p>
                      </div>
                    </div>
                  </div>

                  {/* To-do Item 2 */}
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 hover:shadow-sm transition-shadow">
                    <div className="flex items-start gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-blue-950">Offline assessment pending</h3>
                        <p className="text-xs text-blue-800 mt-1 font-medium">Virtual Relationship Technology Partner</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick stats / advertising widget */}
              <div className="bg-gradient-to-br from-indigo-900 to-blue-800 text-white rounded-2xl shadow-md p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-8 -mt-8 blur-lg"></div>
                <h3 className="text-md font-bold mb-2">Build Premium Resume</h3>
                <p className="text-xs text-indigo-100 mb-4 leading-relaxed">
                  Create a professional resume and verify with OTP to get hired faster by top brands.
                </p>
                <Link
                  href="/resume-builder"
                  className="inline-flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm"
                >
                  Create Now &rarr;
                </Link>
              </div>
            </div>
          )}

          {/* RIGHT MAIN CONTENT: Swipers, Grid lists (9 or 12 Cols) */}
          <div className={`${user ? "lg:col-span-9" : "lg:col-span-12"} space-y-12`}>
            
            {/* 1. Trending Banners Swiper */}
            <div>
              <h2 className="text-xl font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                Trending on Internshala
              </h2>
              <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                spaceBetween={20}
                slidesPerView={1.1}
                breakpoints={{
                  640: { slidesPerView: 1.5 },
                  768: { slidesPerView: 2.1 },
                  1024: { slidesPerView: 2.3 },
                }}
                navigation
                pagination={{ clickable: true }}
                autoplay={{ delay: 6000 }}
                className="trending-swiper rounded-2xl overflow-visible"
              >
                <SwiperSlide>
                  <div className="bg-gradient-to-r from-blue-700 to-indigo-900 text-white p-6 rounded-2xl shadow-sm h-48 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500"></div>
                    <div>
                      <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Course Track</span>
                      <h3 className="text-lg font-bold mt-2 leading-tight">Get Trained &amp; Get Interned!</h3>
                      <p className="text-xs text-blue-100 mt-1">Certified Web Development Program</p>
                    </div>
                    <div>
                      <button className="bg-white text-blue-900 font-extrabold text-xs px-4 py-2 rounded-xl shadow hover:bg-blue-50 transition-colors">
                        Know More &gt;
                      </button>
                    </div>
                  </div>
                </SwiperSlide>

                <SwiperSlide>
                  <div className="bg-gradient-to-r from-teal-600 to-emerald-800 text-white p-6 rounded-2xl shadow-sm h-48 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500"></div>
                    <div>
                      <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Campus Program</span>
                      <h3 className="text-lg font-bold mt-2 leading-tight">Student Partner Program</h3>
                      <p className="text-xs text-teal-100 mt-1">Become the face of Internshala in your campus</p>
                    </div>
                    <div>
                      <button className="bg-white text-teal-900 font-extrabold text-xs px-4 py-2 rounded-xl shadow hover:bg-teal-50 transition-colors">
                        Register Now &gt;
                      </button>
                    </div>
                  </div>
                </SwiperSlide>

                <SwiperSlide>
                  <div className="bg-gradient-to-r from-purple-700 to-fuchsia-900 text-white p-6 rounded-2xl shadow-sm h-48 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500"></div>
                    <div>
                      <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Resume Premium</span>
                      <h3 className="text-lg font-bold mt-2 leading-tight">Unlock New Opportunities</h3>
                      <p className="text-xs text-purple-100 mt-1">Get verified badge and resume building resources</p>
                    </div>
                    <div>
                      <Link href="/resume-builder" className="inline-block bg-white text-purple-900 font-extrabold text-xs px-4 py-2 rounded-xl shadow hover:bg-purple-50 transition-colors">
                        Explore Premium &gt;
                      </Link>
                    </div>
                  </div>
                </SwiperSlide>
              </Swiper>
            </div>

            {/* 2. Latest Internships */}
            <div>
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-gray-950">Latest Internships</h2>
                  <p className="text-gray-500 text-sm mt-0.5 font-medium">MOCK internships based on your profile</p>
                </div>
                <Link href="/internship" className="text-sm text-blue-600 hover:underline font-bold flex items-center gap-1">
                  View all internships &rarr;
                </Link>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-pulse h-56 flex flex-col justify-between">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      </div>
                      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : internships.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center shadow-sm">
                  <Briefcase className="h-10 w-10 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600 font-medium">No internships found. Run backend seeder first.</p>
                </div>
              ) : (
                <Swiper
                  modules={[Navigation]}
                  spaceBetween={20}
                  slidesPerView={1.1}
                  breakpoints={{
                    640: { slidesPerView: 1.5 },
                    768: { slidesPerView: 2.1 },
                    1024: { slidesPerView: 2.5 },
                  }}
                  navigation
                  className="internships-swiper rounded-2xl overflow-visible"
                >
                  {internships.map((intern: any) => (
                    <SwiperSlide key={intern._id}>
                      <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col justify-between h-[280px] shadow-sm hover:shadow-md transition-shadow relative">
                        <div>
                          {/* Active badge */}
                          <div className="flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 w-fit px-2 py-0.5 rounded-full mb-3">
                            <ArrowUpRight size={12} />
                            Actively hiring
                          </div>
                          
                          <h3 className="text-md font-extrabold text-gray-900 leading-snug line-clamp-1">
                            {intern.title}
                          </h3>
                          <p className="text-gray-500 text-xs font-semibold mt-0.5">
                            {intern.company}
                          </p>

                          {/* Info items */}
                          <div className="space-y-2 mt-4 text-xs font-medium text-gray-600">
                            <div className="flex items-center gap-1.5">
                              <MapPin size={14} className="text-gray-400" />
                              <span>{intern.location}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Calendar size={14} className="text-gray-400" />
                              <span>Stipend: {intern.stipend}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock size={14} className="text-gray-400" />
                              <span>Duration: {intern.additionalInfo || "3 Months"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Bar */}
                        <div className="flex items-center justify-between border-t border-gray-50 pt-4 mt-4">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg">
                            Internship
                          </span>
                          <Link
                            href={`/detailiternship/${intern._id}`}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                          >
                            View Details &gt;
                          </Link>
                        </div>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              )}
            </div>

            {/* 3. Latest Jobs */}
            <div>
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-gray-950">Latest Jobs</h2>
                  <p className="text-gray-500 text-sm mt-0.5 font-medium">MOCK jobs matching your education</p>
                </div>
                <Link href="/job" className="text-sm text-blue-600 hover:underline font-bold flex items-center gap-1">
                  View all jobs &rarr;
                </Link>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-pulse h-56 flex flex-col justify-between">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      </div>
                      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : jobs.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center shadow-sm">
                  <Briefcase className="h-10 w-10 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600 font-medium">No jobs found. Run backend seeder first.</p>
                </div>
              ) : (
                <Swiper
                  modules={[Navigation]}
                  spaceBetween={20}
                  slidesPerView={1.1}
                  breakpoints={{
                    640: { slidesPerView: 1.5 },
                    768: { slidesPerView: 2.1 },
                    1024: { slidesPerView: 2.5 },
                  }}
                  navigation
                  className="jobs-swiper rounded-2xl overflow-visible"
                >
                  {jobs.map((job: any) => (
                    <SwiperSlide key={job._id}>
                      <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col justify-between h-[280px] shadow-sm hover:shadow-md transition-shadow relative">
                        <div>
                          {/* Active badge */}
                          <div className="flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 w-fit px-2 py-0.5 rounded-full mb-3">
                            <ArrowUpRight size={12} />
                            Actively hiring
                          </div>
                          
                          <h3 className="text-md font-extrabold text-gray-900 leading-snug line-clamp-1">
                            {job.title}
                          </h3>
                          <p className="text-gray-500 text-xs font-semibold mt-0.5">
                            {job.company}
                          </p>

                          {/* Info items */}
                          <div className="space-y-2 mt-4 text-xs font-medium text-gray-600">
                            <div className="flex items-center gap-1.5">
                              <MapPin size={14} className="text-gray-400" />
                              <span>{job.location}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Calendar size={14} className="text-gray-400" />
                              <span>CTC: {job.CTC}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock size={14} className="text-gray-400" />
                              <span>Experience: {job.Experience}</span>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Bar */}
                        <div className="flex items-center justify-between border-t border-gray-50 pt-4 mt-4">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg">
                            Job
                          </span>
                          <Link
                            href={`/detailjob/${job._id}`}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                          >
                            View Details &gt;
                          </Link>
                        </div>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              )}
            </div>

            {/* 4. Placement Assisted Online Courses */}
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">Online Courses with Placement Assistance</h2>
              <div className="flex flex-wrap gap-2.5 mt-3 mb-6">
                <span className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1 rounded-full flex items-center gap-1">
                  Free demo class
                </span>
                <span className="text-xs font-bold bg-green-50 text-green-600 px-3 py-1 rounded-full flex items-center gap-1">
                  Placement assistance
                </span>
                <span className="text-xs font-bold bg-purple-50 text-purple-600 px-3 py-1 rounded-full flex items-center gap-1">
                  Industry-recognized certificate
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Course 1 */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white h-32 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-lg"></div>
                      <span className="text-4xl font-extrabold">&lt;/&gt;</span>
                    </div>
                    <div className="p-6">
                      <h3 className="text-md font-bold text-gray-900">Web Development Course</h3>
                      <ul className="text-xs text-gray-600 space-y-2 mt-4 list-disc pl-4 font-medium">
                        <li>Master HTML, CSS, Javascript &amp; React</li>
                        <li>Build 5+ production-grade web projects</li>
                        <li>Learn database storage &amp; backend deployment</li>
                      </ul>
                    </div>
                  </div>
                  <div className="p-6 pt-0">
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl shadow-sm transition-colors uppercase tracking-wider">
                      Free Demo Class &gt;
                    </button>
                  </div>
                </div>

                {/* Course 2 */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white h-32 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-lg"></div>
                      <span className="text-4xl font-extrabold">Data</span>
                    </div>
                    <div className="p-6">
                      <h3 className="text-md font-bold text-gray-900">Data Science Course</h3>
                      <ul className="text-xs text-gray-600 space-y-2 mt-4 list-disc pl-4 font-medium">
                        <li>Master Python, SQL &amp; Machine Learning</li>
                        <li>Build prediction models on real dataset</li>
                        <li>Dashboard visualization in PowerBI</li>
                      </ul>
                    </div>
                  </div>
                  <div className="p-6 pt-0">
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl shadow-sm transition-colors uppercase tracking-wider">
                      Free Demo Class &gt;
                    </button>
                  </div>
                </div>

                {/* Course 3 */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="bg-gradient-to-r from-rose-500 to-pink-600 p-6 text-white h-32 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-lg"></div>
                      <span className="text-4xl font-extrabold">Marketing</span>
                    </div>
                    <div className="p-6">
                      <h3 className="text-md font-bold text-gray-900">Digital Marketing Course</h3>
                      <ul className="text-xs text-gray-600 space-y-2 mt-4 list-disc pl-4 font-medium">
                        <li>Master SEO, SEM &amp; Content Strategy</li>
                        <li>Run live marketing campaigns</li>
                        <li>Social media marketing and copywriting</li>
                      </ul>
                    </div>
                  </div>
                  <div className="p-6 pt-0">
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl shadow-sm transition-colors uppercase tracking-wider">
                      Free Demo Class &gt;
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Certification Courses */}
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Our certification courses for you</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Cert Card 1 */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-52">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-4">
                      <GraduationCap size={20} />
                    </div>
                    <h3 className="text-sm font-extrabold text-gray-900 leading-snug">
                      Ethical Hacking &amp; Network Security
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-1 font-semibold flex items-center gap-1">
                      <Star size={12} className="text-yellow-400 fill-yellow-400" />
                      4.5 rating | 8 weeks course
                    </p>
                  </div>
                  <button className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 border-t border-gray-50 pt-3 mt-4">
                    Learn More &gt;
                  </button>
                </div>

                {/* Cert Card 2 */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-52">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                      <GraduationCap size={20} />
                    </div>
                    <h3 className="text-sm font-extrabold text-gray-900 leading-snug">
                      Full-Stack Web Development Track
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-1 font-semibold flex items-center gap-1">
                      <Star size={12} className="text-yellow-400 fill-yellow-400" />
                      4.8 rating | 16 weeks course
                    </p>
                  </div>
                  <button className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 border-t border-gray-50 pt-3 mt-4">
                    Learn More &gt;
                  </button>
                </div>

                {/* Cert Card 3 */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-52">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                      <GraduationCap size={20} />
                    </div>
                    <h3 className="text-sm font-extrabold text-gray-900 leading-snug">
                      Programming with Python Foundation
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-1 font-semibold flex items-center gap-1">
                      <Star size={12} className="text-yellow-400 fill-yellow-400" />
                      4.6 rating | 6 weeks course
                    </p>
                  </div>
                  <button className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 border-t border-gray-50 pt-3 mt-4">
                    Learn More &gt;
                  </button>
                </div>

              </div>
            </div>

            {/* 6. Live Webinars */}
            <div>
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-gray-950">Start Confident: Live Webinars</h2>
                  <p className="text-gray-500 text-sm mt-0.5 font-medium">Insights and tips that are custom-tailored</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2.5 mb-6">
                <span className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1 rounded-full">
                  Live webinar sessions
                </span>
                <span className="text-xs font-bold bg-green-50 text-green-600 px-3 py-1 rounded-full">
                  Ask questions directly
                </span>
                <span className="text-xs font-bold bg-purple-50 text-purple-600 px-3 py-1 rounded-full">
                  Free to attend
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Webinar 1 */}
                <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl p-6 shadow-sm flex items-center justify-between gap-6 relative overflow-hidden group">
                  <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500"></div>
                  <div className="z-10 space-y-4">
                    <div>
                      <span className="bg-orange-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">Webinar</span>
                      <h3 className="text-md font-bold mt-2 leading-snug">How to build high-performance web services</h3>
                    </div>
                    <button className="bg-white text-indigo-950 text-xs font-extrabold px-4 py-2.5 rounded-xl hover:bg-blue-50 transition-colors">
                      Register Free &gt;
                    </button>
                  </div>
                  <div className="w-24 h-24 rounded-full border-4 border-indigo-700/50 bg-indigo-800 flex items-center justify-center overflow-hidden shrink-0 z-10">
                    <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200" alt="Trainer" className="w-full h-full object-cover" />
                  </div>
                </div>

                {/* Webinar 2 */}
                <div className="bg-gradient-to-r from-emerald-950 to-teal-900 text-white rounded-2xl p-6 shadow-sm flex items-center justify-between gap-6 relative overflow-hidden group">
                  <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500"></div>
                  <div className="z-10 space-y-4">
                    <div>
                      <span className="bg-orange-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">Webinar</span>
                      <h3 className="text-md font-bold mt-2 leading-snug">Demystifying Big Data &amp; Cloud Architectures</h3>
                    </div>
                    <button className="bg-white text-teal-950 text-xs font-extrabold px-4 py-2.5 rounded-xl hover:bg-emerald-50 transition-colors">
                      Register Free &gt;
                    </button>
                  </div>
                  <div className="w-24 h-24 rounded-full border-4 border-teal-700/50 bg-teal-800 flex items-center justify-center overflow-hidden shrink-0 z-10">
                    <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200" alt="Trainer" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
