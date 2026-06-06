import { Facebook, Twitter, Instagram, Youtube, Play } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#1f2937] text-gray-300 py-12 text-xs border-t border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* DIRECTORY SECTION (Directory style lists with horizontal pipe separation) */}
        <div className="space-y-6 pb-8 border-b border-gray-700 mb-10 text-gray-400">
          
          <div>
            <h4 className="font-bold text-gray-200 mb-1.5">Internship by Places:</h4>
            <p className="leading-relaxed">
              <Link href="/internship" className="hover:text-white transition-colors">Internship in Delhi</Link> |{" "}
              <Link href="/internship" className="hover:text-white transition-colors">Internship in Bangalore</Link> |{" "}
              <Link href="/internship" className="hover:text-white transition-colors">Internship in Hyderabad</Link> |{" "}
              <Link href="/internship" className="hover:text-white transition-colors">Internship in Mumbai</Link> |{" "}
              <Link href="/internship" className="hover:text-white transition-colors">Internship in Chennai</Link> |{" "}
              <Link href="/internship" className="hover:text-white transition-colors">Internship in Pune</Link> |{" "}
              <Link href="/internship" className="hover:text-white transition-colors">Internship in Kolkata</Link> |{" "}
              <Link href="/internship" className="hover:text-white transition-colors">Virtual Internship</Link>
            </p>
          </div>

          <div>
            <h4 className="font-bold text-gray-200 mb-1.5">Internship by Stream:</h4>
            <p className="leading-relaxed">
              <Link href="/internship" className="hover:text-white transition-colors">Computer Science Internship</Link> |{" "}
              <Link href="/internship" className="hover:text-white transition-colors">Electronics Internship</Link> |{" "}
              <Link href="/internship" className="hover:text-white transition-colors">Mechanical Internship</Link> |{" "}
              <Link href="/internship" className="hover:text-white transition-colors">Civil Internship</Link> |{" "}
              <Link href="/internship" className="hover:text-white transition-colors">Marketing Internship</Link> |{" "}
              <Link href="/internship" className="hover:text-white transition-colors">Chemical Internship</Link> |{" "}
              <Link href="/internship" className="hover:text-white transition-colors">Finance Internship</Link> |{" "}
              <Link href="/internship" className="hover:text-white transition-colors font-bold text-blue-400">View all internships</Link>
            </p>
          </div>

          <div>
            <h4 className="font-bold text-gray-200 mb-1.5">Jobs by Places:</h4>
            <p className="leading-relaxed">
              <Link href="/job" className="hover:text-white transition-colors">Jobs in Delhi</Link> |{" "}
              <Link href="/job" className="hover:text-white transition-colors">Jobs in Mumbai</Link> |{" "}
              <Link href="/job" className="hover:text-white transition-colors">Jobs in Bangalore</Link> |{" "}
              <Link href="/job" className="hover:text-white transition-colors">Jobs in Hyderabad</Link> |{" "}
              <Link href="/job" className="hover:text-white transition-colors">Jobs in Kolkata</Link> |{" "}
              <Link href="/job" className="hover:text-white transition-colors">Jobs in Chennai</Link> |{" "}
              <Link href="/job" className="hover:text-white transition-colors">Jobs in Pune</Link> |{" "}
              <Link href="/job" className="hover:text-white transition-colors">Jobs in Jaipur</Link> |{" "}
              <Link href="/job" className="hover:text-white transition-colors font-bold text-blue-400">View all jobs</Link>
            </p>
          </div>

          <div>
            <h4 className="font-bold text-gray-200 mb-1.5">Jobs by Stream:</h4>
            <p className="leading-relaxed">
              <Link href="/job" className="hover:text-white transition-colors">Computer Science Jobs</Link> |{" "}
              <Link href="/job" className="hover:text-white transition-colors">Electronics Jobs</Link> |{" "}
              <Link href="/job" className="hover:text-white transition-colors">Mechanical Jobs</Link> |{" "}
              <Link href="/job" className="hover:text-white transition-colors">Civil Jobs</Link> |{" "}
              <Link href="/job" className="hover:text-white transition-colors">Marketing Jobs</Link> |{" "}
              <Link href="/job" className="hover:text-white transition-colors">Chemical Jobs</Link> |{" "}
              <Link href="/job" className="hover:text-white transition-colors">Finance Jobs</Link> |{" "}
              <Link href="/job" className="hover:text-white transition-colors font-bold text-blue-400">View all jobs</Link>
            </p>
          </div>

          <div>
            <h4 className="font-bold text-gray-200 mb-1.5">Premium learn by Places:</h4>
            <p className="leading-relaxed">
              <span className="cursor-pointer hover:text-white transition-colors">Learn in Delhi</span> |{" "}
              <span className="cursor-pointer hover:text-white transition-colors">Learn in Mumbai</span> |{" "}
              <span className="cursor-pointer hover:text-white transition-colors">Learn in Bangalore</span> |{" "}
              <span className="cursor-pointer hover:text-white transition-colors">Learn in Pune</span> |{" "}
              <span className="cursor-pointer hover:text-white transition-colors">Learn in Hyderabad</span> |{" "}
              <span className="cursor-pointer hover:text-white transition-colors">Learn in Chennai</span> |{" "}
              <span className="cursor-pointer hover:text-white transition-colors">Learn in Kolkata</span> |{" "}
              <span className="cursor-pointer hover:text-white transition-colors">Learn in Jaipur</span> |{" "}
              <span className="cursor-pointer hover:text-white font-bold text-blue-400 transition-colors">View all training places</span>
            </p>
          </div>

          <div>
            <h4 className="font-bold text-gray-200 mb-1.5">Premium learn by Type:</h4>
            <p className="leading-relaxed">
              <span className="cursor-pointer hover:text-white transition-colors">100% Placement Guarantee Course</span> |{" "}
              <span className="cursor-pointer hover:text-white transition-colors">Degree Course</span> |{" "}
              <span className="cursor-pointer hover:text-white transition-colors">Online Training</span> |{" "}
              <span className="cursor-pointer hover:text-white transition-colors">PG Diploma Course</span> |{" "}
              <span className="cursor-pointer hover:text-white transition-colors">Short Term Course</span> |{" "}
              <span className="cursor-pointer hover:text-white font-bold text-blue-400 transition-colors">View all training types</span>
            </p>
          </div>

          <div>
            <h4 className="font-bold text-gray-200 mb-1.5">Career guidance:</h4>
            <p className="leading-relaxed">
              <span className="cursor-pointer hover:text-white transition-colors">Internship preparation course</span> |{" "}
              <span className="cursor-pointer hover:text-white transition-colors">Programming courses</span> |{" "}
              <span className="cursor-pointer hover:text-white transition-colors">Management courses</span> |{" "}
              <span className="cursor-pointer hover:text-white transition-colors">Marketing courses</span> |{" "}
              <span className="cursor-pointer hover:text-white transition-colors">Coding courses</span> |{" "}
              <span className="cursor-pointer hover:text-white transition-colors">Web design courses</span> |{" "}
              <span className="cursor-pointer hover:text-white transition-colors">Business courses</span> |{" "}
              <span className="cursor-pointer hover:text-white font-bold text-blue-400 transition-colors">View all course guides</span>
            </p>
          </div>

          <div>
            <h4 className="font-bold text-gray-200 mb-1.5">Verify/Build Resume:</h4>
            <p className="leading-relaxed">
              <span className="cursor-pointer hover:text-white transition-colors">Create free resume online</span> |{" "}
              <span className="cursor-pointer hover:text-white transition-colors">Resume writing guide</span> |{" "}
              <span className="cursor-pointer hover:text-white transition-colors">Free cover letter templates</span> |{" "}
              <span className="cursor-pointer hover:text-white transition-colors">Cover letter guide</span> |{" "}
              <span className="cursor-pointer hover:text-white transition-colors">Verify resume details</span> |{" "}
              <Link href="/resume-builder" className="hover:text-white transition-colors font-bold text-orange-400">Premium resume builder (New)</Link>
            </p>
          </div>

        </div>

        {/* BOTTOM NAVIGATION COLUMNS (Standard Links) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
          <div>
            <h4 className="font-bold text-gray-100 mb-3.5 uppercase tracking-wider">About us</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/" className="hover:text-white transition-colors">About us</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Careers</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">We're hiring</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Hire interns for your company</Link></li>
              <li><Link href="/postInternship" className="hover:text-white transition-colors">Post an Internship</Link></li>
              <li><Link href="/postJob" className="hover:text-white transition-colors">Post a Job</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-100 mb-3.5 uppercase tracking-wider">Team diary</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/" className="hover:text-white transition-colors">Team diary</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Our services</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-100 mb-3.5 uppercase tracking-wider">Terms &amp; conditions</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/" className="hover:text-white transition-colors">Terms &amp; conditions</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Privacy policy</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Refund policy</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Security</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-100 mb-3.5 uppercase tracking-wider">Sitemap</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/" className="hover:text-white transition-colors">Sitemap</Link></li>
              <li><Link href="/resume-builder" className="hover:text-white transition-colors font-bold text-orange-400">Premium resume builder</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Verify details</Link></li>
            </ul>
          </div>
        </div>

        {/* BOTTOM METADATA & APP DOWNLOADS */}
        <div className="border-t border-gray-700 pt-8 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex flex-wrap gap-4">
            <a href="https://play.google.com/store" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 border border-gray-500 rounded-xl px-4 py-2 hover:bg-gray-800 transition-colors">
              <span className="text-[10px] font-semibold text-gray-400">Get it on</span>
              <span className="font-bold text-gray-200">Google Play</span>
            </a>
            <a href="https://www.apple.com/app-store" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 border border-gray-500 rounded-xl px-4 py-2 hover:bg-gray-800 transition-colors">
              <span className="text-[10px] font-semibold text-gray-400">Download on the</span>
              <span className="font-bold text-gray-200">App Store</span>
            </a>
          </div>

          {/* Social icons */}
          <div className="flex gap-4">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full border border-gray-600 hover:border-white transition-colors text-gray-400 hover:text-white">
              <Facebook size={16} />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full border border-gray-600 hover:border-white transition-colors text-gray-400 hover:text-white">
              <Twitter size={16} />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full border border-gray-600 hover:border-white transition-colors text-gray-400 hover:text-white">
              <Instagram size={16} />
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full border border-gray-600 hover:border-white transition-colors text-gray-400 hover:text-white">
              <Youtube size={16} />
            </a>
          </div>

          <p className="text-[11px] text-gray-500 font-semibold">
            © Copyright 2026. Internshala Clone. All Rights Reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}