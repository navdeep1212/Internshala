import axios from "axios";
import {
  ArrowUpRight,
  Calendar,
  Clock,
  DollarSign,
  Filter,
  Pin,
  PlayCircle,
  X,
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

const index = () => {
  const { t } = useLanguage();
  const [filteredInternships, setfilteredInternships] = useState<any>([]);
  const [isFiltervisible, setisFiltervisible] = useState(false);
  const [filter, setfilters] = useState({
    category: "",
    location: "",
    workFromHome: false,
    partTime: false,
    stipend: 50,
  });
  const [internshipData, setinternship] = useState<any>([]);

  useEffect(() => {
    const fetchdata = async () => {
      try {
        const res = await axios.get("https://internshala-clone-y2p2.onrender.com/api/internship");     
        setinternship(res.data);
        setfilteredInternships(res.data);
      } catch (error) {
        console.log(error);
      }
    };
    fetchdata();
  }, []);

  useEffect(() => {
    const filtered = internshipData.filter((internship: any) => {
      const matchesCategory = internship.category
        .toLowerCase()
        .includes(filter.category.toLowerCase());
      const matchesLocation = internship.location
        .toLowerCase()
        .includes(filter.location.toLowerCase());
      return matchesCategory && matchesLocation;
    });
    setfilteredInternships(filtered);
  }, [filter, internshipData]);

  const handlefilterchange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setfilters((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const clearFilters = () => {
    setfilters({
      category: "",
      location: "",
      workFromHome: false,
      partTime: false,
      stipend: 50,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Filter  */}
          <div className="hidden md:block w-64 bg-white rounded-lg shadow-sm p-6 h-fit">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-black">{t("filters")}</span>
              </div>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                {t("clear_all")}
              </button>
            </div>
            <div className="space-y-6">
              {/* Profile/Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("category")}
                </label>
                <input
                  type="text"
                  name="category"
                  value={filter.category}
                  onChange={handlefilterchange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:outline-none focus:border-transparent"
                  placeholder="e.g. Marketing"
                />
              </div>
              {/* Location Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("location")}
                </label>
                <input
                  type="text"
                  name="location"
                  value={filter.location}
                  onChange={handlefilterchange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:outline-none focus:border-transparent"
                  placeholder="e.g. Mumbai"
                />
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="workFromHome"
                    checked={filter.workFromHome}
                    onChange={handlefilterchange}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <span className="text-gray-700">{t("work_from_home")}</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="partTime"
                    checked={filter.partTime}
                    onChange={handlefilterchange}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <span className="text-gray-700">{t("part_time")}</span>
                </label>
              </div>

              {/* Stipend Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("monthly_stipend")}
                </label>
                <input
                  type="range"
                  name="stipend"
                  min="0"
                  max="100"
                  value={filter.stipend}
                  onChange={handlefilterchange}
                  className="w-full cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>₹0</span>
                  <span>₹50K</span>
                  <span>₹100K</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <div className="md:hidden mb-4">
              <button
                onClick={() => setisFiltervisible(!isFiltervisible)}
                className="w-full flex items-center justify-center space-x-2 bg-white p-3 rounded-lg shadow-sm text-black cursor-pointer"
              >
                <Filter className="h-5 w-5" />
                <span> {t("show_filters")}</span>
              </button>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
              <p className="text-center font-semibold text-black">
                {filteredInternships.length} {t("internships_found")}
              </p>
            </div>
            <div className="space-y-4">
              {filteredInternships.map((internship: any) => (
                <div
                  key={internship._id}
                  className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-2 text-blue-600 mb-4">
                    <ArrowUpRight className="h-5 w-5" />
                    <span className="font-medium">{t("actively_hiring")}</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {internship.title}
                  </h2>
                  <p className="text-gray-600 mb-4 font-medium">{internship.company}</p>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <PlayCircle className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">{t("start_date")}</p>
                        <p className="text-sm font-medium text-gray-800">{internship.startDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Pin className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">{t("location")}</p>
                        <p className="text-sm font-medium text-gray-800">{internship.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">{t("stipend")}</p>
                        <p className="text-sm font-medium text-gray-800">{internship.stipend}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                        {t("internship")}
                      </span>
                      <div className="flex items-center space-x-1 text-green-600">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-medium">{t("posted_recently")}</span>
                      </div>
                    </div>
                    <Link
                      href={`/detailiternship/${internship._id}`}
                      className="text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      {t("view_details")}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Mobile Filters Modal */}
      {isFiltervisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden flex justify-end">
          <div className="bg-white h-full w-full max-w-sm p-6 overflow-y-auto animate-slideIn">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">{t("filters")}</h2>
              <button
                onClick={() => setisFiltervisible(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-6">
              {/* Profile/Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("category")}
                </label>
                <input
                  type="text"
                  name="category"
                  value={filter.category}
                  onChange={handlefilterchange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:outline-none"
                  placeholder="e.g. Marketing"
                />
              </div>
              {/* Location Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("location")}
                </label>
                <input
                  type="text"
                  name="location"
                  value={filter.location}
                  onChange={handlefilterchange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:outline-none"
                  placeholder="e.g. Mumbai"
                />
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="workFromHome"
                    checked={filter.workFromHome}
                    onChange={handlefilterchange}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <span className="text-gray-700">{t("work_from_home")}</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="partTime"
                    checked={filter.partTime}
                    onChange={handlefilterchange}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <span className="text-gray-700">{t("part_time")}</span>
                </label>
              </div>

              {/* Stipend Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("monthly_stipend")}
                </label>
                <input
                  type="range"
                  name="stipend"
                  min="0"
                  max="100"
                  value={filter.stipend}
                  onChange={handlefilterchange}
                  className="w-full cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>₹0</span>
                  <span>₹50K</span>
                  <span>₹100K</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default index;
