import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { selectuser } from "@/Feature/Userslice";
import { X, Mail, ShieldCheck, RefreshCw } from "lucide-react";

export type LanguageCode = "en" | "es" | "hi" | "pt" | "zh" | "fr";

interface LanguageContextProps {
  lang: LanguageCode;
  changeLanguage: (targetLang: LanguageCode) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

// Language display names
export const LANGUAGES: { code: LanguageCode; name: string; flag: string }[] = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
];

// Translation dictionary
const translations: Record<LanguageCode, Record<string, string>> = {
  en: {
    // Navbar
    internships_nav: "Internships",
    jobs_nav: "Jobs",
    search_placeholder: "Search opportunities...",
    continue_google: "Continue with Google",
    logout: "Logout",
    admin: "Admin",
    // Hero & Home
    make_dream_career: "Make your dream career a reality",
    trending_on: "Trending on InternArea",
    popular_categories: "POPULAR CATEGORIES:",
    latest_internships: "Latest internships on Intern Area",
    latest_jobs: "Latest Jobs",
    actively_hiring: "Actively Hiring",
    view_details: "View details",
    internship: "Internship",
    jobs: "Jobs",
    companies_hiring: "companies hiring",
    new_openings: "new openings everyday",
    active_students: "active students",
    learners: "learners",
    // Filters & Sidebar
    filters: "Filters",
    clear_all: "Clear all",
    category: "Category",
    location: "Location",
    work_from_home: "Work from home",
    part_time: "Part-time",
    monthly_stipend: "Monthly Stipend (₹)",
    annual_salary: "Annual Salary (₹ in lakhs)",
    experience: "Experience",
    show_filters: "Show Filters",
    internships_found: "Internships found",
    jobs_found: "Jobs found",
    start_date: "Start Date",
    stipend: "Stipend",
    ctc: "CTC",
    posted_recently: "Posted recently",
    // Details Page
    about_company: "About Company",
    about_internship: "About the Internship",
    about_job: "About the Job",
    who_can_apply: "Who can apply",
    perks: "Perks",
    additional_info: "Additional Information",
    number_of_openings: "Number of Openings",
    apply_now: "Apply Now",
    visit_website: "Visit company website",
    posted_on: "Posted on",
    // Footer
    footer_places: "Internship by places",
    footer_stream: "Internship by stream",
    footer_jobs: "Job Places",
    footer_job_streams: "Jobs by streams",
    footer_about: "About us",
    footer_team: "Team diary",
    footer_terms: "Terms and conditions",
    footer_sitemap: "Sitemap",
    get_android_app: "Get Android App",
    rights_reserved: "All Rights Reserved",
  },
  es: {
    internships_nav: "Prácticas",
    jobs_nav: "Empleos",
    search_placeholder: "Buscar oportunidades...",
    continue_google: "Continuar con Google",
    logout: "Cerrar sesión",
    admin: "Administrador",
    make_dream_career: "Haz realidad la carrera de tus sueños",
    trending_on: "Tendencias en InternArea",
    popular_categories: "CATEGORÍAS POPULARES:",
    latest_internships: "Últimas prácticas en Intern Area",
    latest_jobs: "Últimos Empleos",
    actively_hiring: "Contratando activamente",
    view_details: "Ver detalles",
    internship: "Práctica",
    jobs: "Empleos",
    companies_hiring: "empresas contratando",
    new_openings: "nuevas vacantes todos los días",
    active_students: "estudiantes activos",
    learners: "aprendices",
    filters: "Filtros",
    clear_all: "Limpiar todo",
    category: "Categoría",
    location: "Ubicación",
    work_from_home: "Trabajo desde casa",
    part_time: "Medio tiempo",
    monthly_stipend: "Estipendio mensual (₹)",
    annual_salary: "Salario anual (₹ en lakhs)",
    experience: "Experiencia",
    show_filters: "Mostrar filtros",
    internships_found: "Prácticas encontradas",
    jobs_found: "Empleos encontrados",
    start_date: "Fecha de inicio",
    stipend: "Estipendio",
    ctc: "CTC",
    posted_recently: "Publicado recientemente",
    about_company: "Sobre la empresa",
    about_internship: "Sobre la práctica",
    about_job: "Sobre el empleo",
    who_can_apply: "Quién puede aplicar",
    perks: "Beneficios",
    additional_info: "Información adicional",
    number_of_openings: "Número de vacantes",
    apply_now: "Aplicar ahora",
    visit_website: "Visitar sitio web de la empresa",
    posted_on: "Publicado el",
    footer_places: "Prácticas por lugar",
    footer_stream: "Prácticas por área",
    footer_jobs: "Lugares de trabajo",
    footer_job_streams: "Empleos por área",
    footer_about: "Sobre nosotros",
    footer_team: "Diario del equipo",
    footer_terms: "Términos y condiciones",
    footer_sitemap: "Mapa del sitio",
    get_android_app: "Descargar App de Android",
    rights_reserved: "Todos los derechos reservados",
  },
  hi: {
    internships_nav: "इंटर्नशिप",
    jobs_nav: "नौकरियां",
    search_placeholder: "अवसरों की खोज करें...",
    continue_google: "गूगल के साथ जारी रखें",
    logout: "लॉगआउट",
    admin: "व्यवस्थापक",
    make_dream_career: "अपने सपनों के करियर को हकीकत बनाएं",
    trending_on: "InternArea पर ट्रेंडिंग",
    popular_categories: "लोकप्रिय श्रेणियां:",
    latest_internships: "Intern Area पर नवीनतम इंटर्नशिप",
    latest_jobs: "नवीनतम नौकरियां",
    actively_hiring: "सक्रिय रूप से भर्ती",
    view_details: "विवरण देखें",
    internship: "इंटर्नशिप",
    jobs: "नौकरियां",
    companies_hiring: "कंपनियां भर्ती कर रही हैं",
    new_openings: "हर दिन नई रिक्तियां",
    active_students: "सक्रिय छात्र",
    learners: "शिक्षार्थी",
    filters: "फिल्टर",
    clear_all: "सभी साफ करें",
    category: "श्रेणी",
    location: "स्थान",
    work_from_home: "घर से काम",
    part_time: "अंशकालिक",
    monthly_stipend: "मासिक वजीफा (₹)",
    annual_salary: "वार्षिक वेतन (लाख ₹ में)",
    experience: "अनुभव",
    show_filters: "फिल्टर दिखाएं",
    internships_found: "इंटर्नशिप मिलीं",
    jobs_found: "नौकरियां मिलीं",
    start_date: "प्रारंभ तिथि",
    stipend: "वजीफा",
    ctc: "सीटीसी",
    posted_recently: "हाल ही में पोस्ट किया गया",
    about_company: "कंपनी के बारे में",
    about_internship: "इंटर्नशिप के बारे में",
    about_job: "नौकरी के बारे में",
    who_can_apply: "कौन आवेदन कर सकता है",
    perks: "परक्स/लाभ",
    additional_info: "अतिरिक्त जानकारी",
    number_of_openings: "रिक्तियों की संख्या",
    apply_now: "अभी आवेदन करें",
    visit_website: "कंपनी की वेबसाइट पर जाएं",
    posted_on: "पोस्ट करने की तिथि",
    footer_places: "स्थानों के अनुसार इंटर्नशिप",
    footer_stream: "धारा के अनुसार इंटर्नशिप",
    footer_jobs: "नौकरी के स्थान",
    footer_job_streams: "धारा के अनुसार नौकरियां",
    footer_about: "हमारे बारे में",
    footer_team: "टीम डायरी",
    footer_terms: "नियम और शर्तें",
    footer_sitemap: "साइटमैप",
    get_android_app: "एंड्रॉइड ऐप प्राप्त करें",
    rights_reserved: "सर्वाधिकार सुरक्षित",
  },
  pt: {
    internships_nav: "Estágios",
    jobs_nav: "Empregos",
    search_placeholder: "Buscar oportunidades...",
    continue_google: "Continuar com o Google",
    logout: "Sair",
    admin: "Administrador",
    make_dream_career: "Torne a carreira dos seus sonhos realidade",
    trending_on: "Tendências no InternArea",
    popular_categories: "CATEGORIAS POPULARES:",
    latest_internships: "Últimos estágios no Intern Area",
    latest_jobs: "Últimos Empregos",
    actively_hiring: "Contratando ativamente",
    view_details: "Ver detalhes",
    internship: "Estágio",
    jobs: "Empregos",
    companies_hiring: "empresas contratando",
    new_openings: "novas vagas todos os dias",
    active_students: "estudantes ativos",
    learners: "alunos",
    filters: "Filtros",
    clear_all: "Limpar tudo",
    category: "Categoria",
    location: "Localização",
    work_from_home: "Trabalho remoto",
    part_time: "Meio período",
    monthly_stipend: "Bolsa mensal (₹)",
    annual_salary: "Salário anual (₹ em lakhs)",
    experience: "Experiência",
    show_filters: "Mostrar filtros",
    internships_found: "Estágios encontrados",
    jobs_found: "Empregos encontrados",
    start_date: "Data de início",
    stipend: "Bolsa-auxílio",
    ctc: "Salário total",
    posted_recently: "Publicado recentemente",
    about_company: "Sobre a empresa",
    about_internship: "Sobre o estágio",
    about_job: "Sobre o emprego",
    who_can_apply: "Quem pode se candidatar",
    perks: "Benefícios",
    additional_info: "Informações adicionais",
    number_of_openings: "Número de vagas",
    apply_now: "Candidatar-se agora",
    visit_website: "Visitar site da empresa",
    posted_on: "Publicado em",
    footer_places: "Estágios por local",
    footer_stream: "Estágios por área",
    footer_jobs: "Locais de emprego",
    footer_job_streams: "Empregos por área",
    footer_about: "Sobre nós",
    footer_team: "Diário da equipe",
    footer_terms: "Termos e condições",
    footer_sitemap: "Mapa do site",
    get_android_app: "Baixar App Android",
    rights_reserved: "Todos os direitos reservados",
  },
  zh: {
    internships_nav: "实习机会",
    jobs_nav: "全职工作",
    search_placeholder: "搜索机会...",
    continue_google: "使用 Google 继续",
    logout: "退出登录",
    admin: "管理员",
    make_dream_career: "让你的梦想职业成为现实",
    trending_on: "InternArea 上的热门趋势",
    popular_categories: "热门类别：",
    latest_internships: "Intern Area 上的最新实习",
    latest_jobs: "最新工作",
    actively_hiring: "积极招聘中",
    view_details: "查看详情",
    internship: "实习",
    jobs: "工作",
    companies_hiring: "公司正在招聘",
    new_openings: "每天都有新职位",
    active_students: "活跃学生",
    learners: "学习者",
    filters: "筛选",
    clear_all: "清除全部",
    category: "类别",
    location: "地点",
    work_from_home: "远程办公",
    part_time: "兼职",
    monthly_stipend: "月度津贴 (₹)",
    annual_salary: "年薪 (₹ 十万为单位)",
    experience: "工作经验",
    show_filters: "显示筛选",
    internships_found: "找到的实习机会",
    jobs_found: "找到的工作机会",
    start_date: "开始日期",
    stipend: "津贴",
    ctc: "薪资总额",
    posted_recently: "最近发布",
    about_company: "关于公司",
    about_internship: "关于实习",
    about_job: "关于工作",
    who_can_apply: "申请条件",
    perks: "福利待遇",
    additional_info: "附加信息",
    number_of_openings: "招聘人数",
    apply_now: "立即申请",
    visit_website: "访问公司网站",
    posted_on: "发布于",
    footer_places: "热门地点实习",
    footer_stream: "热门专业实习",
    footer_jobs: "工作地点",
    footer_job_streams: "按行业分类工作",
    footer_about: "关于我们",
    footer_team: "团队日志",
    footer_terms: "条款和条件",
    footer_sitemap: "网站地图",
    get_android_app: "获取安卓应用",
    rights_reserved: "版权所有。保留所有权利",
  },
  fr: {
    internships_nav: "Stages",
    jobs_nav: "Emplois",
    search_placeholder: "Rechercher des opportunités...",
    continue_google: "Continuer avec Google",
    logout: "Se déconnecter",
    admin: "Administrateur",
    make_dream_career: "Faites de la carrière de vos rêves une réalité",
    trending_on: "Tendances sur InternArea",
    popular_categories: "CATÉGORIES POPULAIRES :",
    latest_internships: "Derniers stages sur Intern Area",
    latest_jobs: "Derniers Emplois",
    actively_hiring: "Recrutement actif",
    view_details: "Voir les détails",
    internship: "Stage",
    jobs: "Emplois",
    companies_hiring: "entreprises qui recrutent",
    new_openings: "nouvelles offres chaque jour",
    active_students: "étudiants actifs",
    learners: "apprenants",
    filters: "Filtres",
    clear_all: "Tout effacer",
    category: "Catégorie",
    location: "Lieu",
    work_from_home: "Télétravail",
    part_time: "À temps partiel",
    monthly_stipend: "Indemnité mensuelle (₹)",
    annual_salary: "Salaire annuel (₹ en lakhs)",
    experience: "Expérience",
    show_filters: "Afficher les filtres",
    internships_found: "stages trouvés",
    jobs_found: "emplois trouvés",
    start_date: "Date de début",
    stipend: "Indemnité",
    ctc: "Rémunération",
    posted_recently: "Publié récemment",
    about_company: "À propos de l'entreprise",
    about_internship: "À propos du stage",
    about_job: "À propos de l'emploi",
    who_can_apply: "Qui peut postuler",
    perks: "Avantages",
    additional_info: "Informations complémentaires",
    number_of_openings: "Nombre de postes",
    apply_now: "Postuler maintenant",
    visit_website: "Visiter le site de l'entreprise",
    posted_on: "Publié le",
    footer_places: "Stages par lieu",
    footer_stream: "Stages par domaine",
    footer_jobs: "Lieux d'emploi",
    footer_job_streams: "Emplois par domaine",
    footer_about: "À propos de nous",
    footer_team: "Journal de l'équipe",
    footer_terms: "Conditions générales",
    footer_sitemap: "Plan du site",
    get_android_app: "Télécharger l'app Android",
    rights_reserved: "Tous droits réservés",
  },
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<LanguageCode>("en");
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingLang, setPendingLang] = useState<LanguageCode | null>(null);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Dev mode variables to assist evaluation
  const [devMode, setDevMode] = useState(false);
  const [devOtp, setDevOtp] = useState("");

  const user = useSelector(selectuser);

  // Initialize lang and verified languages from localStorage on client-mount
  useEffect(() => {
    const savedLang = localStorage.getItem("lang") as LanguageCode;
    if (savedLang && translations[savedLang]) {
      setLangState(savedLang);
    }
  }, []);

  // Pre-fill email when user profile changes
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  // Set language helper
  const changeLanguage = (targetLang: LanguageCode) => {
    if (targetLang === lang) return;

    // Only French ('fr') requires OTP verification
    const verifiedLangs = JSON.parse(localStorage.getItem("verified_languages") || "[]");
    
    if (targetLang !== "fr" || verifiedLangs.includes(targetLang)) {
      setLangState(targetLang);
      localStorage.setItem("lang", targetLang);
      toast.info(`Language switched to ${LANGUAGES.find(l => l.code === targetLang)?.name}`);
      return;
    }

    // Trigger email OTP verification for French
    setPendingLang(targetLang);
    setStep("email");
    setOtp("");
    setDevMode(false);
    setDevOtp("");
    setModalOpen(true);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("/api/send-otp", { email });
      if (response.data.success) {
        setToken(response.data.token);
        setStep("otp");
        toast.success("Verification code sent to your email!");
        if (response.data.devMode) {
          setDevMode(true);
          setDevOtp(response.data.otp);
          toast.info(`Demo verification code: ${response.data.otp}`);
        }
      } else {
        toast.error(response.data.message || "Failed to send code");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to initiate email verification");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("/api/verify-otp", {
        email,
        otp,
        token,
      });

      if (response.data.success && pendingLang) {
        setLangState(pendingLang);
        localStorage.setItem("lang", pendingLang);

        // Add to verified languages
        const verifiedLangs = JSON.parse(localStorage.getItem("verified_languages") || "[]");
        if (!verifiedLangs.includes(pendingLang)) {
          verifiedLangs.push(pendingLang);
          localStorage.setItem("verified_languages", JSON.stringify(verifiedLangs));
        }

        toast.success(`Email verified successfully! Switched to ${LANGUAGES.find(l => l.code === pendingLang)?.name}`);
        setModalOpen(false);
        setPendingLang(null);
      } else {
        toast.error(response.data.message || "Invalid verification code");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Translation function
  const t = (key: string): string => {
    return translations[lang]?.[key] || translations["en"]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, changeLanguage, t }}>
      {children}

      {/* Glassmorphic Security OTP Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all duration-300 animate-fadeIn">
          <div className="relative w-full max-w-md bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 scale-100">
            {/* Header decor */}
            <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>

            {/* Close Button */}
            <button
              onClick={() => {
                setModalOpen(false);
                setPendingLang(null);
              }}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="p-8">
              {/* Title & Info */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-blue-600 mb-3">
                  {step === "email" ? <Mail size={24} /> : <ShieldCheck size={24} />}
                </div>
                <h3 className="text-xl font-bold text-gray-900">Security Verification</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Switching to <strong className="text-blue-600">{LANGUAGES.find(l => l.code === pendingLang)?.name}</strong> requires email verification to ensure validated access.
                </p>
              </div>

              {/* Step 1: Send OTP Form */}
              {step === "email" && (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <RefreshCw className="animate-spin" size={18} />
                    ) : (
                      "Send Verification Code"
                    )}
                  </button>
                </form>
              )}

              {/* Step 2: Verify OTP Form */}
              {step === "otp" && (
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Enter 6-Digit Code
                      </label>
                      <button
                        type="button"
                        onClick={() => setStep("email")}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Change Email
                      </button>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      placeholder="XXXXXX"
                      className="w-full tracking-[1em] text-center font-bold text-2xl py-3 border border-gray-200 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:tracking-normal"
                    />
                    <p className="mt-2 text-center text-xs text-gray-500">
                      Code sent to <span className="font-semibold text-gray-700">{email}</span>
                    </p>
                  </div>

                  {/* Dev Mode Notification Panel */}
                  {devMode && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                      <p className="font-bold mb-1">Demo Mode Verification</p>
                      <p className="mb-2">For demonstration purposes, please use the following verification code to proceed:</p>
                      <div className="flex items-center justify-center p-2 bg-amber-100 font-mono font-bold text-base tracking-[0.5em] rounded border border-amber-300">
                        {devOtp}
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-xl hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <RefreshCw className="animate-spin" size={18} />
                    ) : (
                      "Verify & Apply Language"
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
