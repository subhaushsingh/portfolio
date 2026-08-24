import { useState, useEffect } from "react";
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

const Landing2D = () => {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [displayName, setDisplayName] = useState("Subh Aush Singh");
  const [exiting, setExiting] = useState(false);
  const [activeSection, setActiveSection] = useState("intro");
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);
  const navigate = useNavigate();

  useLenis();

  // Custom Floating Scrollbar Logic
  const { scrollYProgress } = useScroll();
  
  const thumbTop = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

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
    <div className="relative w-full min-h-screen bg-[#050505]">
      
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
        html, body {
          overflow-x: hidden;
        }
      `}} />

      {/* Premium Floating Scrollbar */}
      <AnimatePresence>
        {isAnimationComplete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="fixed right-4 sm:right-6 top-24 bottom-24 w-1.5 bg-white/10 rounded-full z-50 pointer-events-none"
          >
            
            <div className="absolute inset-x-0 top-0 bottom-16">
              <motion.div
                className="absolute w-full h-16 bg-white/40 rounded-full backdrop-blur-sm"
                style={{ top: thumbTop }}
              />
            </div>
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

        <footer className="px-6 sm:px-12 py-8 text-white/40 text-sm border-t border-white/10 text-center flex flex-col items-center gap-3">
          <div className="flex gap-5">
            {socialLinks
              .filter((s) => s.name !== "Contact")
              .map((social) => (
                <a
                  key={social.name}
                  href={social.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/50 hover:text-white transition-colors"
                >
                  {social.name}
                </a>
              ))}
          </div>
          <p>&copy; {new Date().getFullYear()} Subh Aush Singh</p>
        </footer>
      </motion.div>
    </div>
  );
};

export default Landing2D;