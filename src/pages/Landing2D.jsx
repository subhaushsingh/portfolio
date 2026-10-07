import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useInView,
  useMotionValueEvent,
} from "framer-motion";

import { experiences, skills, projects, contributions, socialLinks } from "../constants";
import { useLenis } from "../hooks/useLenis";
import portfolioFullImage from "../assets/images/portfolio-full-image.png";
import OpenSourceGallery from "../components/OpenSourceGallery";
import ProjectsHoverList from "../components/ProjectsHoverList";
import tcpserverImg from "../assets/images/tcpserver.png";
import signalistImg from "../assets/images/signalist.png";
import credexImg from "../assets/images/credex.png";

const SECTIONS = [
  { id: "intro", label: "Intro" },
  { id: "skills", label: "Skills" },
  { id: "work", label: "Work" },
  { id: "projects", label: "Projects" },
  { id: "opensource", label: "Open Source" },
  { id: "contact", label: "Contact" },
];

const PANEL_SECTIONS = ["skills", "work", "projects", "opensource", "contact"];

// Match each project to its preview image by name (or set `image` on the project in constants).
const PROJECT_IMAGES = { tcp: tcpserverImg, signalist: signalistImg, credex: credexImg };
const imageFor = (p) => {
  if (p.image) return p.image;
  const n = p.name.toLowerCase().replace(/[^a-z]/g, "");
  const key = Object.keys(PROJECT_IMAGES).find((k) => n.includes(k));
  return key ? PROJECT_IMAGES[key] : undefined;
};
const projectItems = projects.map((p) => ({
  title: p.name,
  label: p.description,
  imageSrc: imageFor(p),
  link: p.link,
  github: p.github,
}));

const seededRandom = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// ---------- Skills section icons ----------
const skillIconProps = {
  width: 17,
  height: 17,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const CodeIcon = () => (
  <svg {...skillIconProps}><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
);
const LayersIcon = () => (
  <svg {...skillIconProps}><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>
);
const ServerIcon = () => (
  <svg {...skillIconProps}><rect x="2" y="3" width="20" height="7" rx="1.5" /><rect x="2" y="14" width="20" height="7" rx="1.5" /><line x1="6" y1="6.5" x2="6.01" y2="6.5" /><line x1="6" y1="17.5" x2="6.01" y2="17.5" /></svg>
);
const DatabaseIcon = () => (
  <svg {...skillIconProps}><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5" /><path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" /></svg>
);
const GitBranchIcon = () => (
  <svg {...skillIconProps}><line x1="6" y1="3" x2="6" y2="15" /><circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M18 9a9 9 0 0 1-9 9" /></svg>
);

const SKILL_CATEGORY_META = {
  Language: { label: "Languages", icon: <CodeIcon /> },
  Frontend: { label: "Frontend", icon: <LayersIcon /> },
  Backend: { label: "Backend", icon: <ServerIcon /> },
  Database: { label: "Database", icon: <DatabaseIcon /> },
  "Version Control": { label: "Version Control", icon: <GitBranchIcon /> },
};

const SKILL_CATEGORY_ORDER = ["Language", "Frontend", "Backend", "Database", "Version Control"];

// ---------- Footer Effects ----------
const FOOTER_STAR_COUNT = 140;
const Starfield = () => {
  const stars = useMemo(() => {
    return Array.from({ length: FOOTER_STAR_COUNT }, (_, i) => {
      const top = seededRandom(i * 12.9 + 1) * 100;
      const left = seededRandom(i * 78.2 + 7) * 100;
      const size = 1 + seededRandom(i * 33.7 + 3) * 1.8;
      const baseOpacity = 0.25 + seededRandom(i * 5.1 + 9) * 0.55;
      const duration = 2.5 + seededRandom(i * 19.3 + 2) * 3;
      const delay = seededRandom(i * 44.4 + 6) * 4;
      return { top, left, size, baseOpacity, duration, delay };
    });
  }, []);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      {stars.map((s, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          style={{ top: `${s.top}%`, left: `${s.left}%`, width: s.size, height: s.size }}
          animate={{ opacity: [s.baseOpacity * 0.35, s.baseOpacity, s.baseOpacity * 0.35] }}
          transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
};

const DottedGrid = () => (
  <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
    <div className="absolute top-0 bottom-0 left-4 sm:left-8 border-l border-dashed border-white/10" />
    <div className="absolute top-0 bottom-0 right-4 sm:right-8 border-l border-dashed border-white/10" />
    <div className="absolute left-0 right-0 border-t border-dashed border-white/10" style={{ top: "88px" }} />
  </div>
);

// ---- Vertical Minimap ----
const VerticalMinimap = ({ sections, scrollYProgress, indicatorHeightPct, onSelect }) => {
  const indicatorTop = useTransform(scrollYProgress, [0, 1], ["0%", `${100 - indicatorHeightPct}%`]);

  return (
    <div className="flex items-center">
      <div className="relative flex items-center">
        <motion.div
          className="absolute right-full w-24 sm:w-32 pointer-events-none z-0"
          style={{ top: indicatorTop, height: `${indicatorHeightPct}%` }}
        >
          <div
            className="absolute right-0 top-[-10%] bottom-[-10%] w-[120px] bg-gradient-to-l from-[#3b82f6]/40 via-[#3b82f6]/5 to-transparent blur-[8px]"
            style={{
              WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)",
              maskImage: "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)",
            }}
          />
        </motion.div>

        <div
          className="relative w-20 sm:w-28 rounded-[12px] overflow-hidden bg-[#050505] border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.6)] pointer-events-auto z-10"
          style={{ height: "75vh" }}
        >
          <img
            src={portfolioFullImage}
            alt="Portfolio Minimap"
            className="absolute inset-0 w-full h-full object-cover object-top opacity-100 pointer-events-none"
            draggable={false}
          />
          <div className="absolute inset-0 flex flex-col z-10">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={onSelect(s.id)}
                aria-label={s.label}
                className="relative block w-full hover:bg-white/10 transition-colors"
                style={{ height: `${100 / sections.length}%` }}
              />
            ))}
          </div>
          <motion.div
            className="absolute left-0 right-0 border-2 border-[#3b82f6] pointer-events-none z-20"
            style={{ top: indicatorTop, height: `${indicatorHeightPct}%` }}
          />
        </div>
      </div>
      <div className="relative w-[5px] h-[75vh] hidden sm:block pointer-events-none z-10 ml-3">
        <motion.div
          className="absolute left-0 w-full bg-white/80 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.3)]"
          style={{ top: indicatorTop, height: `${indicatorHeightPct}%` }}
        />
      </div>
    </div>
  );
};


const Landing2D = () => {
  const [loadingPhase, setLoadingPhase] = useState("counting");
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [activeSection, setActiveSection] = useState("intro");
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);
  const navigate = useNavigate();

  const footerRef = useRef(null);
  const [footerHeight, setFooterHeight] = useState(0);
  const [time, setTime] = useState("");
  const [isFooterVisible, setIsFooterVisible] = useState(false);

  useEffect(() => {
    if (!footerRef.current) return;
    const update = () => {
      const h = footerRef.current.offsetHeight;
      setFooterHeight(h);
      requestAnimationFrame(() => window.lenis?.resize());
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(footerRef.current);
    window.addEventListener("resize", update);
    return () => { ro.disconnect(); window.removeEventListener("resize", update); };
  }, [isAnimationComplete]);

  useEffect(() => {
    if (!isAnimationComplete || !footerRef.current) return;
    const observer = new IntersectionObserver(([entry]) => setIsFooterVisible(entry.isIntersecting), { threshold: 0.05 });
    observer.observe(footerRef.current);
    return () => observer.disconnect();
  }, [isAnimationComplete]);

  useEffect(() => {
    const updateTime = () => setTime(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }));
    updateTime();
    const interval = setInterval(updateTime, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onLoad = () => window.lenis?.resize();
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  useLenis();

  const { scrollYProgress } = useScroll();
  const [indicatorSizePct, setIndicatorSizePct] = useState(15);

  useEffect(() => {
    const calc = () => {
      const doc = document.documentElement;
      const total = doc.scrollHeight;
      const viewport = window.innerHeight;
      if (total > 0) setIndicatorSizePct(Math.max(6, Math.min(100, (viewport / total) * 100)));
    };
    calc();
    window.addEventListener("resize", calc);
    const id = setInterval(calc, 1000);
    return () => { window.removeEventListener("resize", calc); clearInterval(id); };
  }, [isAnimationComplete]);

  const horizontalRef = useRef(null);
  const { scrollYProgress: hScroll } = useScroll({ target: horizontalRef, offset: ["start start", "end end"] });
  const panelX = useTransform(hScroll, [0, 1], ["0%", `-${(PANEL_SECTIONS.length - 1) * 100}%`]);

  const [reachedHorizontal, setReachedHorizontal] = useState(false);
  useMotionValueEvent(hScroll, "change", (v) => {
    setReachedHorizontal(v > 0.001);
    if (v > 0.001) {
      const idx = Math.min(PANEL_SECTIONS.length - 1, Math.max(0, Math.round(v * (PANEL_SECTIONS.length - 1))));
      setActiveSection(PANEL_SECTIONS[idx]);
    }
  });

  const handleEnterExperience = (e) => {
    e.preventDefault();
    setExiting(true);
    setTimeout(() => navigate("/experience"), 900);
  };

  const scrollTo = (id) => (e) => {
    e.preventDefault();
    const idx = PANEL_SECTIONS.indexOf(id);
    if (idx !== -1 && horizontalRef.current) {
      const spacerHeight = horizontalRef.current.offsetHeight;
      const viewportHeight = window.innerHeight;
      const panelProgress = PANEL_SECTIONS.length > 1 ? idx / (PANEL_SECTIONS.length - 1) : 0;
      const targetY = horizontalRef.current.offsetTop + panelProgress * (spacerHeight - viewportHeight);
      window.lenis?.scrollTo(targetY, { duration: 1.5 });
    } else {
      window.lenis?.scrollTo(`#${id}`, { offset: 0, duration: 1.5 });
    }
  };

  useEffect(() => {
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
    if (!isAnimationComplete) {
      document.body.style.overflow = "hidden";
      window.lenis?.stop();
      window.scrollTo(0, 0);
    } else {
      document.body.style.overflow = "";
      window.lenis?.start();
      setTimeout(() => { window.lenis?.resize(); }, 50);
    }
  }, [isAnimationComplete]);

  useEffect(() => {
    const progressDuration = 1500;
    const intervalTime = 30;
    const totalSteps = progressDuration / intervalTime;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const currentProgress = Math.min(Math.floor((currentStep / totalSteps) * 100), 100);
      setProgress(currentProgress);
      if (currentStep >= totalSteps) {
        clearInterval(interval);
        setLoadingPhase("signing");
      }
    }, intervalTime);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (loadingPhase === "signing") {
      const timer = setTimeout(() => { setLoadingPhase("done"); }, 1600);
      return () => clearTimeout(timer);
    }
  }, [loadingPhase]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    const introEl = document.getElementById("intro");
    if (introEl) observer.observe(introEl);
    return () => observer.disconnect();
  }, []);

  const skillCategories = useMemo(() => {
    return SKILL_CATEGORY_ORDER
      .map((type) => ({ type, label: SKILL_CATEGORY_META[type].label, icon: SKILL_CATEGORY_META[type].icon, items: skills.filter((s) => s.type === type) }))
      .filter((category) => category.items.length > 0);
  }, []);

  const isLoading = loadingPhase !== "done";

  return (
    <div
      className="relative w-full min-h-screen bg-[#050505] overflow-clip"
      style={{ zoom: 0.9 }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600&family=Inter:wght@400;500;600;700&display=swap');
        html, body {
          background-color: #050505 !important;
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
          font-family: 'Inter', sans-serif;
          overflow-x: clip; 
        }
        *::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
          background: transparent !important;
        }
        * {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}} />

      {/* --- FIXED UI ELEMENTS (Outside main container) --- */}
      <AnimatePresence>
        {isAnimationComplete && (
          <motion.nav
            key="sitemap"
            initial="vertical"
            animate={reachedHorizontal ? "horizontal" : "vertical"}
            exit={{ opacity: 0 }}
            variants={{
              vertical: {
                top: "50%",
                left: "2.5rem",
                x: "0%",
                y: "-50%",
                flexDirection: "column",
                gap: "0.75rem",
                backgroundColor: "rgba(0, 0, 0, 0)",
                padding: "0rem",
                borderRadius: "0px",
                border: "1px solid rgba(255, 255, 255, 0)",
                backdropFilter: "blur(0px)",
                boxShadow: "none",
                opacity: isFooterVisible ? 0 : 1,
              },
              horizontal: {
                top: "2rem",
                left: "50%",
                x: "-50%",
                y: "0%",
                flexDirection: "row",
                gap: "2rem",
                // Apple-style transparent glassmorphism
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                padding: "0.85rem 2.5rem",
                borderRadius: "9999px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(20px) saturate(150%)",
                boxShadow: "0 10px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
                opacity: isFooterVisible ? 0 : 1,
              }
            }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="hidden md:flex fixed z-50 pointer-events-auto items-center"
          >
            {SECTIONS.map((s) => (
              <a 
                key={s.id} 
                href={`#${s.id}`} 
                onClick={scrollTo(s.id)} 
                className={`text-sm transition-colors whitespace-nowrap ${activeSection === s.id ? "text-white font-semibold drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : "text-white/60 hover:text-white"}`}
              >
                {s.label}
              </a>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAnimationComplete && !isFooterVisible && (
          <motion.div
            key="vertical-minimap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.35 } }}
            transition={{ duration: 1 }}
            className="fixed right-4 sm:right-8 top-1/2 -translate-y-1/2 z-50 pointer-events-auto"
          >
            <VerticalMinimap sections={SECTIONS} scrollYProgress={scrollYProgress} indicatorHeightPct={indicatorSizePct} onSelect={scrollTo} />
          </motion.div>
        )}
      </AnimatePresence>
      {/* -------------------------------------------------------------------------------------- */}

      <AnimatePresence>
        {isLoading && (
          <motion.div
            exit={{ scale: [1, 0.85, 0.85, 0.85], borderRadius: ["0px", "24px", "24px", "24px"], x: ["0%", "0%", "-100%", "-100%"] }}
            transition={{ duration: 1.6, times: [0, 0.35, 0.75, 1], ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 bg-white flex items-center justify-center z-50 overflow-hidden shadow-2xl origin-center"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              {loadingPhase === "signing" && (
                <motion.h1
                  initial={{ clipPath: "inset(0 100% 0 0)", opacity: 1 }} animate={{ clipPath: "inset(0 0% 0 0)", opacity: 1 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="text-black text-6xl sm:text-8xl tracking-tight pr-10 py-4"
                  style={{ fontFamily: "'Caveat', cursive" }}
                >
                  Subh Aush Singh
                </motion.h1>
              )}
            </div>
            <AnimatePresence>
              {loadingPhase === "counting" && (
                <motion.div
                  initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                  className="absolute bottom-8 right-8 sm:bottom-12 sm:right-12 text-black text-5xl sm:text-6xl font-medium tracking-tighter"
                >
                  {progress}%
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {exiting && (
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }} className="fixed inset-0 bg-black flex items-center justify-center z-50">
            <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }} className="text-white text-4xl sm:text-6xl font-semibold tracking-tight">
              Entering the 3D world
            </motion.h1>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ x: "100%", scale: 0.85, borderRadius: "24px" }}
        animate={ isLoading ? { x: "100%", scale: 0.85, borderRadius: "24px" } : { x: ["100%", "100%", "0%", "0%"], scale: [0.85, 0.85, 0.85, 1], borderRadius: ["24px", "24px", "24px", "0px"] } }
        transition={{ duration: 1.6, times: [0, 0.35, 0.75, 1], ease: [0.76, 0, 0.24, 1] }}
        onAnimationComplete={() => { if (!isLoading) setIsAnimationComplete(true); }}
        style={{ height: isAnimationComplete ? "auto" : "100vh", overflow: isAnimationComplete ? "visible" : "hidden", transformOrigin: "center center", transform: isAnimationComplete ? "none" : undefined }}
        className="relative z-10 w-full bg-black text-white shadow-[0_0_50px_rgba(0,0,0,0.6)]"
      >
        <DottedGrid />

        <span className="group fixed top-6 left-6 sm:left-12 z-40 flex items-baseline font-bold text-3xl cursor-default overflow-hidden">
          <span>S</span>
          <span className="max-w-0 group-hover:max-w-xs opacity-0 group-hover:opacity-100 whitespace-nowrap overflow-hidden transition-all duration-500 ease-in-out">
            ubh Aush Singh
          </span>
        </span>

        <div className="flex items-center justify-end px-6 sm:px-12 py-6">
          <a href="/SubhAushSingh_Resume.pdf" target="_blank" rel="noopener noreferrer" className="text-sm border border-white/30 rounded-full px-4 py-2 hover:bg-white hover:text-black transition z-40 relative">
            Resume
          </a>
        </div>

        <div className="relative z-20 bg-black">
          <section id="intro" className="relative min-h-screen px-6 sm:px-12 flex flex-col items-center justify-center -mt-20 overflow-hidden">
            {/* Center Aligned Hero Section */}
            <div className="relative z-10 w-full max-w-4xl mx-auto text-center flex flex-col items-center">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold leading-relaxed tracking-tight max-w-3xl">
                I'm a backend focused developer who enjoys building practical systems, 
                learning through open source, and constantly improving my craft.
              </h1>
              <p className="mt-5 text-white/60 text-xs sm:text-sm">Final-year CS student, Kolkata, India.</p>
              
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <button onClick={handleEnterExperience} className="bg-white text-black font-semibold text-xs sm:text-sm rounded-full px-6 py-3 hover:opacity-80 transition">
                  Enter the 3D experience &rarr;
                </button>
                <a href="#contact" onClick={scrollTo("contact")} className="border border-white/30 rounded-full text-xs sm:text-sm px-6 py-3 hover:bg-white hover:text-black transition">
                  Get in touch
                </a>
              </div>
              
              <div className="mt-8 flex justify-center gap-6">
                {socialLinks.filter((s) => s.name !== "Contact").map((social) => (
                  <a key={social.name} href={social.link} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white text-xs sm:text-sm underline underline-offset-4">
                    {social.name}
                  </a>
                ))}
              </div>
            </div>
          </section>

          {/* HORIZONTAL-SCROLL STRIP */}
          <div ref={horizontalRef} className="relative" style={{ height: `${PANEL_SECTIONS.length * 100}vh` }}>
            <div className="sticky top-0 h-screen w-full overflow-hidden">
              <motion.div style={{ x: panelX }} className="flex h-full w-full">
                
                {/* Skills panel */}
                <div id="skills" className="w-screen h-full shrink-0 px-6 sm:px-12 py-16 flex flex-col items-center justify-center overflow-hidden">
                  <div className="relative z-10 w-full max-w-4xl mx-auto text-left">
                    <h2 className="text-3xl sm:text-4xl font-bold mb-7">Skills</h2>
                    <div className="flex flex-col gap-5">
                      {skillCategories.map((category) => (
                        <div key={category.type}>
                          <div className="flex items-center gap-2 mb-3 text-white">
                            {category.icon}
                            <h3 className="text-base sm:text-lg font-semibold">{category.label}</h3>
                          </div>
                          <div className="flex flex-wrap gap-2.5">
                            {category.items.map((skill) => (
                              <div key={skill.name} className="flex items-center gap-2 bg-black border border-white/15 rounded-full pl-1.5 pr-4 py-1.5">
                                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0">
                                  <img src={skill.imageUrl} alt={skill.name} className="w-3.5 h-3.5 object-contain" />
                                </div>
                                <span className="text-white font-medium text-sm whitespace-nowrap">{skill.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Work panel */}
                <div id="work" className="w-screen h-full shrink-0 px-6 sm:px-12 py-16 flex flex-col items-center justify-center overflow-hidden">
                  <div className="relative z-10 w-full max-w-4xl mx-auto text-left">
                    <h2 className="text-3xl sm:text-4xl font-bold mb-7">Work</h2>
                    <div className="flex flex-col gap-5">
                      {experiences.map((exp) => (
                        <div key={exp.company_name} className="border border-white/10 bg-white/[0.02] rounded-2xl p-6 w-full">
                          <div className="flex items-baseline justify-between flex-wrap gap-x-4 gap-y-1">
                            <h3 className="text-base sm:text-lg font-semibold">{exp.title}</h3>
                            <span className="text-white/50 text-sm whitespace-nowrap">{exp.date}</span>
                          </div>
                          <p className="text-white/60 mt-1 text-sm sm:text-base">{exp.company_name}</p>
                          <ul className="mt-4 list-disc ml-5 space-y-2 text-sm sm:text-[15px] leading-relaxed text-white/75 marker:text-white/30">
                            {exp.points.map((point, i) => <li key={i}>{point}</li>)}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Projects panel */}
                <div id="projects" className="w-screen h-full shrink-0 px-6 sm:px-12 py-16 flex flex-col items-center justify-center overflow-hidden">
                  <div className="relative z-10 w-full max-w-5xl mx-auto text-left">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-6">Projects</h2>
                    <ProjectsHoverList items={projectItems} />
                  </div>
                </div>

                {/* Open Source panel - lensed drag gallery (zoomed out + smaller window) */}
                <div id="opensource" className="relative w-screen h-full shrink-0 overflow-hidden">
                  <div
                    className="absolute inset-0 rounded-3xl overflow-hidden border border-white/10"
                    style={{ transform: "translateY(5%) scale(0.75)", transformOrigin: "center center" }}
                  >
                    <OpenSourceGallery contributions={contributions} />
                  </div>

                  {/* Heading sits outside the scaled wrapper so it stays full size */}
                  <div className="pointer-events-none absolute top-24 left-6 sm:left-12 z-20">
                    <h2
                      className="relative inline-block text-4xl sm:text-6xl font-bold tracking-tight"
                      style={{ textShadow: "0 0 28px rgba(59,130,246,0.55), 0 2px 14px rgba(0,0,0,0.95)" }}
                    >
                      Open{" "}
                      <span
                        className="text-[#60a5fa]"
                        style={{ fontFamily: "'Caveat', cursive", fontSize: "1.25em", fontWeight: 600 }}
                      >
                        Source
                      </span>
                      <svg
                        viewBox="0 0 300 20"
                        preserveAspectRatio="none"
                        className="absolute left-0 -bottom-3 w-full h-4 overflow-visible"
                        style={{ filter: "drop-shadow(0 0 6px rgba(59,130,246,0.8))" }}
                      >
                        <motion.path
                          d="M2 14 C 40 3, 80 19, 130 8 S 220 3, 298 12"
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: activeSection === "opensource" ? 1 : 0 }}
                          transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
                        />
                      </svg>
                    </h2>
                  </div>
                </div>

                {/* Contact panel */}
                <div id="contact" className="w-screen h-full shrink-0 px-6 sm:px-12 py-16 flex flex-col items-center justify-center overflow-hidden">
                  <div className="relative z-10 w-full max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl sm:text-5xl font-bold mb-5">Contact</h2>
                    <p className="text-white/60 max-w-xl mx-auto text-sm sm:text-base">
                      Looking for backend or SDE roles, or just want to talk shop about systems and code. Reach out.
                    </p>
                    <a href="mailto:subhaushsingh@gmail.com" className="inline-block mt-6 text-base sm:text-xl font-medium underline underline-offset-8 decoration-white/30 hover:decoration-white transition-colors">
                      subhaushsingh@gmail.com
                    </a>
                  </div>
                </div>

              </motion.div>
            </div>
          </div>
        </div>

        <footer ref={footerRef} className="relative bottom-0 left-0 w-full z-0 overflow-hidden bg-[#0a0a0a] border-t border-white/10">
          <Starfield />

          <div className="relative px-6 sm:px-12 pt-24 pb-10 min-h-screen flex flex-col justify-between">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-12">
              <div>
                <h6 className="text-white/40 text-xs uppercase tracking-widest mb-4">Sitemap</h6>
                <div className="flex flex-col gap-2">
                  {SECTIONS.filter((s) => s.id !== "contact").map((s) => (
                    <a key={s.id} href={`#${s.id}`} onClick={scrollTo(s.id)} className="text-white/80 hover:text-white transition-colors w-fit">{s.label}</a>
                  ))}
                </div>
              </div>
              <div>
                <h6 className="text-white/40 text-xs uppercase tracking-widest mb-4">Follow me</h6>
                <div className="flex flex-col gap-2">
                  {socialLinks.filter((s) => s.name !== "Contact").map((social) => (
                    <a key={social.name} href={social.link} target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white transition-colors w-fit">{social.name}</a>
                  ))}
                </div>
              </div>
              <div className="col-span-2">
                <h4 className="text-2xl sm:text-3xl font-semibold mb-3">Work With Me:</h4>
                <a href="mailto:subhaushsingh@gmail.com" className="inline-block text-xl sm:text-2xl font-medium underline decoration-white/30 hover:decoration-white underline-offset-8 transition-all">
                  subhaushsingh@gmail.com
                </a>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 text-sm">
              <div><p className="text-white/40">Based in Kolkata, India</p><p className="text-white/70 mt-1">Current Time: {time}</p></div>
              <div><p className="text-white/40">Availability</p><p className="text-white/70 mt-1">Currently open to backend / SDE roles</p></div>
              <div className="sm:text-right"><p className="text-white/40">&copy; {new Date().getFullYear()} &middot; Subh Aush Singh</p><p className="text-white/70 mt-1">All Rights Reserved</p></div>
            </div>
            <div className="flex items-end justify-between mt-16 relative">
              <div className="flex items-baseline"><span className="text-[20vw] sm:text-[11vw] leading-[0.8] font-bold text-white/90 select-none tracking-tighter">SUBH</span></div>
              <button onClick={scrollTo("intro")} aria-label="Go to top" className="w-12 h-12 shrink-0 mb-2 rounded-full bg-white text-black flex items-center justify-center hover:opacity-80 transition">&uarr;</button>
            </div>
          </div>
        </footer>
      </motion.div>
    </div>
  );
};

export default Landing2D;