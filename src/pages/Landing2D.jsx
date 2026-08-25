import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";

import { experiences, skills, projects, contributions, socialLinks } from "../constants";
import { useLenis } from "../hooks/useLenis";

const SECTIONS = [
  { id: "intro", label: "Intro" },
  { id: "skills", label: "Skills" },
  { id: "work", label: "Work" },
  { id: "projects", label: "Projects" },
  { id: "opensource", label: "Open Source" },
  { id: "contact", label: "Contact" },
];

// Generates a vertical wavy/zigzag SVG path string (top -> bottom)
const generateWavePath = (height, width, humps = 6) => {
  if (!height || !width) return "";
  const midX = width / 2;
  const amp = width * 0.38; // how wide the zigzag swings
  const segH = height / humps;
  let d = `M ${midX} 0`;

  for (let i = 0; i < humps; i++) {
    const y0 = i * segH;
    const y1 = y0 + segH;
    const dir = i % 2 === 0 ? 1 : -1;
    const cx = midX + dir * amp;
    d += ` C ${cx} ${y0 + segH * 0.25}, ${cx} ${y1 - segH * 0.25}, ${midX} ${y1}`;
  }
  return d;
};

const Landing2D = () => {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [displayName, setDisplayName] = useState("Subh Aush Singh");
  const [exiting, setExiting] = useState(false);
  const [activeSection, setActiveSection] = useState("intro");
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);
  const navigate = useNavigate();

  // --- Reveal footer setup ---
  const footerRef = useRef(null);
  const [footerHeight, setFooterHeight] = useState(0);
  const [time, setTime] = useState("");

  useEffect(() => {
    if (!footerRef.current) return;
    const update = () => {
      const h = footerRef.current.offsetHeight;
      setFooterHeight(h);
      // The negative margin trick changes total document/scroll height —
      // Lenis caches that height, so it must be told to recalc every time
      // the footer's size changes, or it'll clamp scroll before the
      // footer ever gets revealed.
      requestAnimationFrame(() => window.lenis?.resize());
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(footerRef.current);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [isAnimationComplete]);

  useEffect(() => {
    const updateTime = () => {
      setTime(
        new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Images (skill icons, etc.) loading after Lenis's initial measurement can
  // also silently change page height — resync once everything has loaded.
  useEffect(() => {
    const onLoad = () => window.lenis?.resize();
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);
  // --- end reveal footer setup ---

  useLenis();

  // Custom Floating Scrollbar Logic
  const { scrollYProgress } = useScroll();

  // --- Zigzag scrollbar path setup ---
  const trackRef = useRef(null);
  const [trackHeight, setTrackHeight] = useState(0);
  const trackWidth = 50;

  useEffect(() => {
    if (!trackRef.current) return;
    const update = () => setTrackHeight(trackRef.current.clientHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(trackRef.current);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [isAnimationComplete]);

  const pathD = useMemo(
    () => generateWavePath(trackHeight, trackWidth, 6),
    [trackHeight]
  );

  const offsetDistance = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  // --- end zigzag scrollbar setup ---

  const handleEnterExperience = (e) => {
    e.preventDefault();
    setExiting(true);
    setTimeout(() => navigate("/experience"), 900);
  };

  const scrollTo = (id) => (e) => {
    e.preventDefault();
    window.lenis?.scrollTo(`#${id}`, { offset: 0, duration: 1.5 });
  };

  // The Ultimate Scroll Lock & Resize Fix
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    if (!isAnimationComplete) {
      // Hard lock during animation
      document.body.style.overflow = "hidden";
      window.lenis?.stop();
      window.scrollTo(0, 0);
    } else {
      // Set to empty string instead of "auto" to prevent the browser from forcefully re-rendering native scrollbars
      document.body.style.overflow = "";
      window.lenis?.start();

      // Force Lenis to recalculate the page height immediately after it expands
      setTimeout(() => {
        window.lenis?.resize();
      }, 50);
    }
  }, [isAnimationComplete]);

  // Loading timer, text transition, and percentage counter logic
  useEffect(() => {
    const progressDuration = 2000;
    const intervalTime = 30;
    const totalSteps = progressDuration / intervalTime;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const currentProgress = Math.min(Math.floor((currentStep / totalSteps) * 100), 100);
      setProgress(currentProgress);

      if (currentStep >= totalSteps) {
        clearInterval(interval);
        setTimeout(() => setDisplayName("Subh."), 400);
        setTimeout(() => setLoading(false), 1200);
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, []);

  // Intersection Observer for scroll sections
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-[#050505] overflow-x-hidden">

      <style dangerouslySetInnerHTML={{ __html: `
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

      {/* Premium Zigzag Scrollbar */}
      <AnimatePresence>
        {isAnimationComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            ref={trackRef}
            className="fixed right-4 sm:right-6 top-24 bottom-24 z-50 pointer-events-none"
            style={{ width: trackWidth }}
          >
            {trackHeight > 0 && (
              <>
                {/* Dashed zigzag track */}
                <svg
                  width={trackWidth}
                  height={trackHeight}
                  className="absolute inset-0"
                >
                  <path
                    d={pathD}
                    fill="none"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="1.5"
                    strokeDasharray="1 7"
                    strokeLinecap="round"
                  />
                </svg>

                {/* Marker that travels along the path as you scroll */}
                <motion.div
                  className="absolute w-2.5 h-2.5 rounded-full bg-white"
                  style={{
                    offsetPath: `path("${pathD}")`,
                    offsetDistance,
                    offsetRotate: "0deg",
                    translateX: "-50%",
                    translateY: "-50%",
                    boxShadow: "0 0 10px 2px rgba(255,255,255,0.7)",
                  }}
                />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {loading && (
          <motion.div
            exit={{
              scale: [1, 0.85, 0.85, 0.85],
              borderRadius: ["0px", "24px", "24px", "24px"],
              x: ["0%", "0%", "-100%", "-100%"],
            }}
            transition={{
              duration: 1.6,
              times: [0, 0.35, 0.75, 1],
              ease: [0.76, 0, 0.24, 1],
            }}
            className="fixed inset-0 bg-white flex items-center justify-center z-50 overflow-hidden shadow-2xl origin-center"
          >
            <AnimatePresence mode="wait">
              <motion.h1
                key={displayName}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="text-black text-5xl sm:text-7xl font-semibold tracking-tight"
              >
                {displayName}
              </motion.h1>
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute bottom-8 right-8 sm:bottom-12 sm:right-12 text-black text-5xl sm:text-6xl font-medium tracking-tighter"
            >
              {progress}%
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {exiting && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 bg-black flex items-center justify-center z-50"
          >
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="text-white text-4xl sm:text-6xl font-semibold tracking-tight"
            >
              Entering the 3D world
            </motion.h1>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Wrapper */}
      <motion.div
        initial={{ x: "100%", scale: 0.85, borderRadius: "24px" }}
        animate={
          loading
            ? { x: "100%", scale: 0.85, borderRadius: "24px" }
            : {
                x: ["100%", "100%", "0%", "0%"],
                scale: [0.85, 0.85, 0.85, 1],
                borderRadius: ["24px", "24px", "24px", "0px"]
              }
        }
        transition={{
          duration: 1.6,
          times: [0, 0.35, 0.75, 1],
          ease: [0.76, 0, 0.24, 1],
        }}
        onAnimationComplete={() => {
          if (!loading) setIsAnimationComplete(true);
        }}
        style={{
          height: isAnimationComplete ? "auto" : "100vh",
          overflow: isAnimationComplete ? "visible" : "hidden",
          transformOrigin: "center center"
        }}
        className="relative z-10 w-full bg-black text-white shadow-[0_0_50px_rgba(0,0,0,0.6)]"
      >
        <span className="group fixed top-6 left-6 sm:left-12 z-40 flex items-baseline font-bold text-3xl cursor-default overflow-hidden">
          <span>S</span>
          <span className="max-w-0 group-hover:max-w-xs opacity-0 group-hover:opacity-100 whitespace-nowrap overflow-hidden transition-all duration-500 ease-in-out">
            ubh Aush Singh
          </span>
        </span>

        <div className="flex items-center justify-end px-6 sm:px-12 py-6">
          <a
            href="/SubhAushSingh_Resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm border border-white/30 rounded-full px-4 py-2 hover:bg-white hover:text-black transition z-40 relative"
          >
            Resume
          </a>
        </div>

        <nav className="hidden lg:flex flex-col gap-3 fixed left-8 top-1/2 -translate-y-1/2 z-40">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={scrollTo(s.id)}
              className={`text-sm transition-colors ${
                activeSection === s.id
                  ? "text-white font-semibold"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              {s.label}
            </a>
          ))}
        </nav>

        {/* Scrollable page content — sits above the footer. No negative
            margin here: the footer needs to contribute its own genuine
            height to the document so there's real scroll room for the
            reveal. (A negative margin here would cancel that height out,
            making the footer permanently unreachable — don't add one.) */}
        <div className="relative z-20 bg-black">
        {/* Hero */}
        <section
          id="intro"
          className="min-h-screen px-6 sm:px-12 max-w-4xl mx-auto text-center flex flex-col items-center justify-center -mt-20"
        >
          <h1 className="text-3xl sm:text-5xl font-semibold leading-tight">
            I'm a backend-focused developer who likes shipping real systems,
            not just tutorials, and picking up open-source work along the way.
          </h1>
          <p className="mt-6 text-white/60 text-lg">
            Final-year CS student, Kolkata, India.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <button
              onClick={handleEnterExperience}
              className="bg-white text-black font-semibold rounded-full px-6 py-3 hover:opacity-80 transition"
            >
              Enter the 3D experience &rarr;
            </button>
            <a
              href="#contact"
              onClick={scrollTo("contact")}
              className="border border-white/30 rounded-full px-6 py-3 hover:bg-white hover:text-black transition"
            >
              Get in touch
            </a>
          </div>

          <div className="mt-8 flex justify-center gap-5">
            {socialLinks
              .filter((s) => s.name !== "Contact")
              .map((social) => (
                <a
                  key={social.name}
                  href={social.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/60 hover:text-white text-sm underline underline-offset-4"
                >
                  {social.name}
                </a>
              ))}
          </div>
        </section>

        {/* Skills */}
        <section
          id="skills"
          className="min-h-screen px-6 sm:px-12 text-center flex flex-col items-center justify-center"
        >
          <h2 className="text-4xl sm:text-5xl font-semibold mb-10">skills.</h2>
          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
            {skills.map((skill) => (
              <span
                key={skill.name}
                className="flex items-center gap-2 border border-white/20 rounded-full px-4 py-2 text-sm text-white/80"
              >
                <img src={skill.imageUrl} alt={skill.name} className="w-4 h-4 object-contain" />
                {skill.name}
              </span>
            ))}
          </div>
        </section>

        {/* Experience */}
        <section
          id="work"
          className="min-h-screen px-6 sm:px-12 text-center flex flex-col items-center justify-center"
        >
          <h2 className="text-4xl sm:text-5xl font-semibold mb-10">work.</h2>
          <div className="flex flex-col items-center gap-8 max-w-3xl mx-auto text-left">
            {experiences.map((exp) => (
              <div key={exp.company_name} className="border border-white/10 rounded-xl p-6 w-full">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-xl font-semibold">{exp.title}</h3>
                  <span className="text-white/50 text-sm">{exp.date}</span>
                </div>
                <p className="text-white/60 mt-1">{exp.company_name}</p>
                <ul className="mt-4 list-disc ml-5 space-y-1 text-sm text-white/70">
                  {exp.points.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Projects */}
        <section
          id="projects"
          className="min-h-screen px-6 sm:px-12 text-center flex flex-col items-center justify-center"
        >
          <h2 className="text-4xl sm:text-5xl font-semibold mb-10">projects.</h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto text-left">
            {projects.map((project, index) => (
              <div
                key={project.name}
                className={`flex flex-col border border-white/10 rounded-xl p-6 hover:border-white/30 transition duration-300 ${
                  index === 2 && projects.length === 3 ? "sm:col-span-2 lg:col-span-1" : ""
                }`}
              >
                <h3 className="text-xl font-semibold">{project.name}</h3>

                <p className="text-white/60 mt-3 text-sm flex-grow leading-relaxed">
                  {project.description}
                </p>

                <div className="mt-6 flex gap-4 text-sm font-medium">
                  {project.link && (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-4 hover:text-white/70 transition"
                    >
                      Live
                    </a>
                  )}
                  {project.github && (
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-4 hover:text-white/70 transition"
                    >
                      GitHub
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Open Source */}
        <section
          id="opensource"
          className="min-h-screen px-6 sm:px-12 text-center flex flex-col items-center justify-center"
        >
          <h2 className="text-4xl sm:text-5xl font-semibold mb-10">open source.</h2>
          <div className="grid sm:grid-cols-2 gap-6 max-w-5xl mx-auto text-left">
            {contributions.map((c) => (
              <a
                key={c.link}
                href={c.link}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-white/10 rounded-xl p-6 hover:border-white/30 transition block"
              >
                <p className="font-semibold">{c.repo}</p>
                <p className="text-sm text-white/50">{c.pr}</p>
                <p className="text-sm text-white/70 mt-2">{c.description}</p>
              </a>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section
          id="contact"
          className="min-h-screen px-6 sm:px-12 text-center flex flex-col items-center justify-center"
        >
          <h2 className="text-4xl sm:text-5xl font-semibold mb-6">contact.</h2>
          <p className="text-white/60 max-w-lg">
            Looking for backend or SDE roles, or just want to talk shop about
            systems and code. Reach out.
          </p>
          <a
            href="mailto:subhaushsingh@gmail.com"
            className="inline-block mt-6 text-lg underline underline-offset-4"
          >
            subhaushsingh@gmail.com
          </a>
        </section>
        </div>
        {/* end scrollable page content */}

        {/* Reveal Footer — sticky to the bottom of the viewport. Because it
            follows the content wrapper normally (no overlap/negative margin),
            it contributes real extra height to the page. As you scroll
            through that extra height, the wrapper's opaque bottom edge
            slides up and off-screen, uncovering this pinned footer. */}
        <footer
          ref={footerRef}
          className="sticky bottom-0 left-0 w-full z-0 overflow-hidden bg-[#0a0a0a] border-t border-white/10"
        >
          {/* Light beams background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-1/2 left-[8%] w-40 h-[220%] bg-gradient-to-b from-white/[0.07] via-white/[0.02] to-transparent rotate-[18deg] blur-3xl" />
            <div className="absolute -top-1/2 left-[30%] w-32 h-[220%] bg-gradient-to-b from-white/[0.09] via-white/[0.02] to-transparent rotate-[18deg] blur-3xl" />
            <div className="absolute -top-1/2 left-[55%] w-48 h-[220%] bg-gradient-to-b from-white/[0.06] via-white/[0.02] to-transparent rotate-[18deg] blur-3xl" />
            <div className="absolute -top-1/2 left-[78%] w-24 h-[220%] bg-gradient-to-b from-white/[0.08] via-white/[0.02] to-transparent rotate-[18deg] blur-3xl" />
          </div>

          <div className="relative px-6 sm:px-12 pt-24 pb-10 min-h-screen flex flex-col justify-between">
            {/* Top links */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-12">
              <div>
                <h6 className="text-white/40 text-xs uppercase tracking-widest mb-4">
                  Sitemap
                </h6>
                <div className="flex flex-col gap-2">
                  {SECTIONS.filter((s) => s.id !== "contact").map((s) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      onClick={scrollTo(s.id)}
                      className="text-white/80 hover:text-white transition-colors w-fit"
                    >
                      {s.label}
                    </a>
                  ))}
                </div>
              </div>

              <div>
                <h6 className="text-white/40 text-xs uppercase tracking-widest mb-4">
                  Follow me
                </h6>
                <div className="flex flex-col gap-2">
                  {socialLinks
                    .filter((s) => s.name !== "Contact")
                    .map((social) => (
                      <a
                        key={social.name}
                        href={social.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/80 hover:text-white transition-colors w-fit"
                      >
                        {social.name}
                      </a>
                    ))}
                </div>
              </div>

              <div className="col-span-2">
                <h4 className="text-2xl sm:text-3xl font-semibold mb-3">
                  Work With Me:
                </h4>
                <a
                  href="mailto:subhaushsingh@gmail.com"
                  className="inline-block text-xl sm:text-2xl font-medium underline decoration-white/30 hover:decoration-white underline-offset-8 transition-all"
                >
                  subhaushsingh@gmail.com
                </a>
              </div>
            </div>

            {/* Middle row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 text-sm">
              <div>
                <p className="text-white/40">Based in Kolkata, India</p>
                <p className="text-white/70 mt-1">Current Time: {time}</p>
              </div>
              <div>
                <p className="text-white/40">Availability</p>
                <p className="text-white/70 mt-1">
                  Currently open to backend / SDE roles
                </p>
              </div>
              <div className="sm:text-right">
                <p className="text-white/40">
                  &copy; {new Date().getFullYear()} &middot; Subh Aush Singh
                </p>
                <p className="text-white/70 mt-1">All Rights Reserved</p>
              </div>
            </div>

            {/* Giant wordmark + go to top */}
            <div className="flex items-end justify-between mt-16">
              <span className="text-[20vw] sm:text-[11vw] leading-[0.8] font-bold text-white/90 select-none">
                SUBH
              </span>
              <button
                onClick={scrollTo("intro")}
                aria-label="Go to top"
                className="w-12 h-12 shrink-0 mb-2 rounded-full bg-white text-black flex items-center justify-center hover:opacity-80 transition"
              >
                &uarr;
              </button>
            </div>
          </div>
        </footer>
      </motion.div>
    </div>
  );
};

export default Landing2D;