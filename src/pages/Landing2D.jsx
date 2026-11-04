import { useState, useEffect, useLayoutEffect, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useInView,
  useMotionValue,
  useSpring,
  useMotionValueEvent,
  useReducedMotion,
} from "framer-motion";

import { experiences, skills, projects, contributions, socialLinks } from "../constants";
import { useLenis } from "../hooks/useLenis";
import portfolioFullImage from "../assets/images/portfolio-full-image.png";
import OpenSourceGallery from "../components/OpenSourceGallery";
import ProjectsHoverList from "../components/ProjectsHoverList";
import EnterKeyScene from "../components/EnterKeyScene";
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

// ---------- Custom Cursor (crosshair lines + dot) ----------
const INTERACTIVE_SELECTOR = "a, button, [role='button'], input, textarea, select, label, [data-cursor='hover']";

const CustomCursor = () => {
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [pressed, setPressed] = useState(false);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);
  const springCfg = { stiffness: 600, damping: 45, mass: 0.35 };
  const x = useSpring(mouseX, springCfg);
  const y = useSpring(mouseY, springCfg);

  // Only on devices with a real pointer
  useEffect(() => {
    setEnabled(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const onMove = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      setVisible(true);
      const t = e.target;
      setHovering(!!(t instanceof Element && t.closest(INTERACTIVE_SELECTOR)));
    };
    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);
    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.addEventListener("mouseenter", onEnter);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.removeEventListener("mouseenter", onEnter);
    };
  }, [enabled, mouseX, mouseY]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-0 z-[9999] pointer-events-none mix-blend-difference"
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* vertical line */}
      <motion.div className="absolute top-0 bottom-0 left-0 w-px bg-white/20" style={{ x }} />
      {/* horizontal line */}
      <motion.div className="absolute left-0 right-0 top-0 h-px bg-white/20" style={{ y }} />
      {/* dot at the intersection (18px, half-size offset = 9px) */}
      <motion.div className="absolute top-0 left-0" style={{ x, y }}>
        <motion.div
          className="-ml-[9px] -mt-[9px] w-[18px] h-[18px] rounded-full border-[1.5px]"
          animate={{
            scale: pressed ? 0.7 : hovering ? 1.8 : 1,
            backgroundColor: hovering ? "rgba(255,255,255,0)" : "rgba(255,255,255,1)",
            borderColor: "rgba(255,255,255,1)",
          }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
        />
      </motion.div>
    </motion.div>
  );
};

// ---------- Lamp theme toggle (light mode = lamp ON) ----------
let lampAudio = null;
const playSwitchClick = (turningOn) => {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    lampAudio = lampAudio || new AC();
    const ac = lampAudio;
    if (ac.state === "suspended") ac.resume();
    const t = ac.currentTime;

    // sharp, short "tick" of the switch
    const len = Math.floor(ac.sampleRate * 0.035);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const f = ac.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = turningOn ? 3400 : 2400;
    f.Q.value = 1.2;
    const g = ac.createGain();
    g.gain.value = 0.5;
    src.connect(f).connect(g).connect(ac.destination);
    src.start(t);

    // the small body of the click: a touch higher turning on, lower turning off
    const osc = ac.createOscillator();
    const og = ac.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(turningOn ? 520 : 380, t);
    osc.frequency.exponentialRampToValueAtTime(turningOn ? 260 : 160, t + 0.06);
    og.gain.setValueAtTime(0.18, t);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    osc.connect(og).connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.09);
  } catch {}
};

const ThemeLamp = ({ theme, onToggle }) => {
  const on = theme === "light";
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState(false);

  // Head: raised toward the page when ON, drooped when OFF. Hover leans it toward the cursor.
  const headAngle = on ? (hovered ? -20 : -13) : hovered ? 22 : 32;
  const armAngle = on ? -2 : 6;

  const spring = reduced ? "none" : "transform 0.9s cubic-bezier(0.34, 1.56, 0.64, 1)";
  const pivot = (x, y) => ({ transformOrigin: `${x}px ${y}px`, transformBox: "view-box" });
  const body = "rgb(var(--fg))";

  const handleClick = () => {
    playSwitchClick(!on);
    onToggle();
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      whileTap={{ scale: 0.95 }}
      aria-label={on ? "Turn the lamp off (dark mode)" : "Turn the lamp on (light mode)"}
      aria-pressed={on}
      className="relative block w-[132px] h-[150px] pointer-events-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent))] rounded-xl"
      style={{ transformOrigin: "50% 100%" }}
    >
      <svg
        viewBox="0 0 150 170"
        width="132"
        height="150"
        className="overflow-visible block pointer-events-none"
        fill="none"
      >
        <defs>
          {/* the beam: warm at the lamp, fading to nothing */}
          <linearGradient id="lampBeam" gradientUnits="userSpaceOnUse" x1="108" y1="55" x2="300" y2="55">
            <stop offset="0" stopColor="#FFD27A" stopOpacity="0.62" />
            <stop offset="0.55" stopColor="#FFC85A" stopOpacity="0.16" />
            <stop offset="1" stopColor="#FFC85A" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="lampGlow">
            <stop offset="0" stopColor="#FFE08A" stopOpacity="0.85" />
            <stop offset="0.5" stopColor="#FFCB5C" stopOpacity="0.28" />
            <stop offset="1" stopColor="#FFC85A" stopOpacity="0" />
          </radialGradient>
          {/* a little metal shine painted over every body part */}
          <linearGradient id="lampShine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.3" />
          </linearGradient>
          <filter id="lampSoft" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        {/* contact shadow */}
        <ellipse cx="50" cy="163" rx="38" ry="4" fill="#000" opacity="0.22" filter="url(#lampSoft)" />

        {/* base */}
        <rect x="16" y="148" width="68" height="13" rx="6.5" fill={body} />
        <rect x="16" y="148" width="68" height="13" rx="6.5" fill="url(#lampShine)" />
        <rect x="32" y="141" width="36" height="9" rx="4.5" fill={body} />
        <rect x="32" y="141" width="36" height="9" rx="4.5" fill="url(#lampShine)" />

        {/* power LED on the base */}
        <circle
          className="lamp-anim"
          cx="74"
          cy="154.5"
          r="4.5"
          fill="#FFB84D"
          filter="url(#lampSoft)"
          style={{ opacity: on ? 0.7 : 0, transition: "opacity 0.4s ease" }}
        />
        <circle
          className="lamp-anim"
          cx="74"
          cy="154.5"
          r="2"
          style={{ fill: on ? "#FFB84D" : "rgb(var(--surface))", opacity: on ? 1 : 0.55, transition: "fill 0.3s ease, opacity 0.3s ease" }}
        />

        {/* lower arm: a double strut, like a real architect lamp */}
        <line x1="47.5" y1="142" x2="33.5" y2="94" stroke={body} strokeWidth="2.6" strokeLinecap="round" />
        <line x1="52.5" y1="142" x2="38.5" y2="94" stroke={body} strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="50" cy="142" r="5" fill={body} />
        <circle cx="50" cy="142" r="1.8" fill="rgb(var(--surface))" opacity="0.6" />

        {/* upper arm + head, pivoting at the elbow (36, 94) */}
        <g className="lamp-anim" style={{ ...pivot(36, 94), transform: `rotate(${armAngle}deg)`, transition: spring }}>
          <line x1="34.3" y1="92.2" x2="76.3" y2="52.2" stroke={body} strokeWidth="2.6" strokeLinecap="round" />
          <line x1="37.7" y1="95.8" x2="79.7" y2="55.8" stroke={body} strokeWidth="2.6" strokeLinecap="round" />
          <circle cx="36" cy="94" r="5.5" fill={body} />
          <circle cx="36" cy="94" r="2" fill="rgb(var(--surface))" opacity="0.6" />

          {/* head, pivoting at its hinge (78, 54) */}
          <g className="lamp-anim" style={{ ...pivot(78, 54), transform: `rotate(${headAngle}deg)`, transition: spring }}>
            {/* light: beam, brighter core, floating dust, glow (all lit only when ON) */}
            <g
              className={`lamp-anim ${on ? "lamp-light-on" : ""}`}
              style={{ opacity: on ? 1 : 0, transition: "opacity 0.5s ease", pointerEvents: "none" }}
            >
              <polygon points="113,40 108,80 300,160 300,-50" fill="url(#lampBeam)" filter="url(#lampSoft)" />
              <polygon points="112,48 109,72 260,125 260,-10" fill="url(#lampBeam)" opacity="0.7" />
              {!reduced &&
                [
                  [140, 62, 1.6, 0],
                  [168, 84, 1.2, 1.4],
                  [192, 66, 1.8, 2.6],
                  [152, 98, 1.3, 0.8],
                  [214, 104, 1.5, 3.4],
                  [182, 44, 1.2, 2],
                ].map(([cx, cy, r, delay], i) => (
                  <circle
                    key={i}
                    className="lamp-anim lamp-mote"
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="#FFE2A0"
                    style={{ animationDelay: `${delay}s` }}
                  />
                ))}
            </g>

            {/* shade */}
            <path d="M70 50 L100 33 Q111 30 113 41 L108 79 Q106 85 98 82 L74 66 Q66 61 70 50 Z" fill={body} />
            <path d="M70 50 L100 33 Q111 30 113 41 L108 79 Q106 85 98 82 L74 66 Q66 61 70 50 Z" fill="url(#lampShine)" />
            <path d="M74 52 L99 37" stroke="#fff" strokeOpacity="0.28" strokeWidth="1.6" strokeLinecap="round" />

            {/* lit interior of the shade */}
            <ellipse
              className="lamp-anim"
              cx="110.5"
              cy="60"
              rx="4.6"
              ry="20"
              transform="rotate(-7 110.5 60)"
              style={{ fill: on ? "#FFEBB8" : "rgb(var(--fg) / 0.28)", transition: "fill 0.4s ease" }}
            />
            {/* bulb + filament */}
            <circle
              className="lamp-anim"
              cx="111"
              cy="60"
              r="6.5"
              style={{ fill: on ? "#FFD166" : "rgb(var(--fg) / 0.35)", transition: "fill 0.4s ease" }}
            />
            <path
              d="M108.6 62.5 L110 58.2 L112 62.2 L113.4 58"
              stroke={on ? "#B26A00" : "rgb(var(--surface))"}
              strokeOpacity={on ? 0.8 : 0.4}
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              className={`lamp-anim ${on ? "lamp-light-on" : ""}`}
              cx="112"
              cy="60"
              r="34"
              fill="url(#lampGlow)"
              style={{ opacity: on ? 1 : 0, transition: "opacity 0.5s ease", pointerEvents: "none" }}
            />

            {/* hinge */}
            <circle cx="78" cy="54" r="4.8" fill={body} />
            <circle cx="78" cy="54" r="1.8" fill="rgb(var(--surface))" opacity="0.6" />
          </g>
        </g>
      </svg>

      {/* tiny label so the toggle explains itself */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-2 left-1 whitespace-nowrap rounded-full border border-[rgb(var(--fg)/0.15)] bg-[rgb(var(--surface)/0.85)] px-2.5 py-1 text-[11px] font-medium text-[rgb(var(--fg)/0.8)] backdrop-blur-md"
        style={{ opacity: hovered ? 1 : 0, transform: `translateY(${hovered ? 0 : 4}px)`, transition: "opacity .25s ease, transform .25s ease" }}
      >
        {on ? "Lights off" : "Lights on"}
      </span>
    </motion.button>
  );
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
    <div className="absolute top-0 bottom-0 left-4 sm:left-8 border-l border-dashed border-[rgb(var(--fg)/0.1)]" />
    <div className="absolute top-0 bottom-0 right-4 sm:right-8 border-l border-dashed border-[rgb(var(--fg)/0.1)]" />
    <div className="absolute left-0 right-0 border-t border-dashed border-[rgb(var(--fg)/0.1)]" style={{ top: "88px" }} />
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
          className="relative w-20 sm:w-28 rounded-[12px] overflow-hidden bg-[#050505] border border-[rgb(var(--fg)/0.1)] shadow-[0_0_30px_rgba(0,0,0,0.6)] pointer-events-auto z-10"
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
          className="absolute left-0 w-full bg-[rgb(var(--fg)/0.8)] rounded-full shadow-[0_0_8px_rgba(59,130,246,0.3)]"
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

  // ---------- Theme ----------
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved === "light" || saved === "dark") return saved;
    } catch {}
    return "dark";
  });

  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("theme", theme); } catch {}
  }, [theme]);

  const toggleTheme = () => {
    const root = document.documentElement;
    root.classList.add("theme-transitioning");
    setTheme((t) => (t === "dark" ? "light" : "dark"));
    setTimeout(() => root.classList.remove("theme-transitioning"), 450);
  };

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
    e?.preventDefault?.();
    if (exiting) return;
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
    <>
      {/* Rendered OUTSIDE the zoomed wrapper so fixed positioning + clientX/Y stay accurate */}
      <CustomCursor />

      {/* Lamp theme toggle, bottom-left. Hidden over the footer (footer never changes theme). */}
      <AnimatePresence>
        {isAnimationComplete && !isFooterVisible && (
          <motion.div
            key="theme-lamp"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40, transition: { duration: 0.25 } }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-2 left-3 sm:left-8 z-50 pointer-events-none"
          >
            <ThemeLamp theme={theme} onToggle={toggleTheme} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Warm pool of light spilling from the lamp across the page (light mode only) */}
      <AnimatePresence>
        {isAnimationComplete && !isFooterVisible && theme === "light" && (
          <motion.div
            key="lamp-ambient"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="fixed inset-0 z-[40] pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 70% 90% at 3% 102%, rgba(255,190,95,0.30) 0%, rgba(255,200,120,0.12) 38%, rgba(255,210,150,0) 70%)",
            }}
          />
        )}
      </AnimatePresence>

      <div
        className="relative w-full min-h-screen bg-[rgb(var(--outer))] overflow-clip"
        style={{ zoom: 0.9 }}
      >
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@600;700&family=Caveat:wght@600&display=swap');

          /* ---- Theme tokens (space-separated RGB so Tailwind alpha works) ---- */
          :root {
            --outer: 5 5 5;
            --surface: 0 0 0;
            --fg: 255 255 255;
            --accent: 96 165 250;
            --glow: rgba(255,255,255,0.5);
            --nav-shadow: 0 10px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1);
          }
          /* Light theme: muted warm paper, lower glare, softer text contrast */
          :root[data-theme="light"] {
            --outer: 207 202 190;     /* deeper frame around the page */
            --surface: 229 224 212;   /* #E5E0D4 muted paper */
            --fg: 52 48 43;           /* #34302B soft charcoal */
            --accent: 52 102 214;
            --glow: rgba(0,0,0,0);
            --nav-shadow: 0 10px 40px rgba(60,50,30,0.12), inset 0 1px 0 rgba(255,255,255,0.35);
          }

          html, body {
            background-color: rgb(var(--outer)) !important;
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

          /* Smooth color crossfade while toggling (lamp parts excluded so their own transitions survive) */
          .theme-transitioning, .theme-transitioning *:not(.lamp-anim) {
            transition: background-color .4s ease, color .4s ease, border-color .4s ease, fill .4s ease, stroke .4s ease !important;
          }

          /* Lamp light: flicker on, then a slow breathing glow */
          @keyframes lampFlicker {
            0%   { opacity: 0; }
            12%  { opacity: .9; }
            20%  { opacity: .25; }
            34%  { opacity: 1; }
            44%  { opacity: .5; }
            60%, 100% { opacity: 1; }
          }
          @keyframes lampBreath {
            0%, 100% { opacity: 1; }
            50%      { opacity: .8; }
          }
          .lamp-light-on {
            animation: lampFlicker .7s ease-out 1, lampBreath 4s ease-in-out .7s infinite;
          }

          /* Dust drifting through the lamp's beam */
          @keyframes lampMote {
            0%   { opacity: 0;  transform: translate(0, 0); }
            20%  { opacity: .9; }
            80%  { opacity: .45; }
            100% { opacity: 0;  transform: translate(10px, -14px); }
          }
          .lamp-mote { animation: lampMote 5s ease-in-out infinite; }

          /* Nav glass pill (colors via CSS so they follow the theme) */
          .nav-shell {
            background-color: transparent;
            border: 1px solid transparent;
            backdrop-filter: blur(0px) saturate(100%);
            -webkit-backdrop-filter: blur(0px) saturate(100%);
            box-shadow: none;
            transition: background-color .6s, border-color .6s, box-shadow .6s, backdrop-filter .6s, -webkit-backdrop-filter .6s;
          }
          .nav-shell.is-glass {
            background-color: rgb(var(--fg) / 0.05);
            border-color: rgb(var(--fg) / 0.1);
            backdrop-filter: blur(20px) saturate(150%);
            -webkit-backdrop-filter: blur(20px) saturate(150%);
            box-shadow: var(--nav-shadow);
          }

          /* Footer content lets clicks through to the Enter key behind it; its links stay clickable */
          .footer-content a, .footer-content button { pointer-events: auto; }

          /* Hide native cursor only on devices with a real mouse */
          @media (hover: hover) and (pointer: fine) {
            *, *::before, *::after { cursor: none !important; }
          }
        `}} />

        {/* --- FIXED UI ELEMENTS --- */}
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
                  padding: "0rem",
                  borderRadius: "0px",
                  opacity: isFooterVisible ? 0 : 1,
                },
                horizontal: {
                  top: "2rem",
                  left: "50%",
                  x: "-50%",
                  y: "0%",
                  flexDirection: "row",
                  gap: "2rem",
                  padding: "0.85rem 2.5rem",
                  borderRadius: "9999px",
                  opacity: isFooterVisible ? 0 : 1,
                }
              }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className={`hidden md:flex fixed z-50 pointer-events-auto items-center nav-shell ${reachedHorizontal ? "is-glass" : ""}`}
            >
              {SECTIONS.map((s) => (
                <a 
                  key={s.id} 
                  href={`#${s.id}`} 
                  onClick={scrollTo(s.id)} 
                  style={activeSection === s.id ? { filter: "drop-shadow(0 0 8px var(--glow))" } : undefined}
                  className={`text-sm transition-colors whitespace-nowrap ${activeSection === s.id ? "text-[rgb(var(--fg))] font-semibold" : "text-[rgb(var(--fg)/0.6)] hover:text-[rgb(var(--fg))]"}`}
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
              className="fixed inset-0 bg-[rgb(var(--fg))] flex items-center justify-center z-50 overflow-hidden shadow-2xl origin-center"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                {loadingPhase === "signing" && (
                  <motion.h1
                    initial={{ clipPath: "inset(0 100% 0 0)", opacity: 1 }} animate={{ clipPath: "inset(0 0% 0 0)", opacity: 1 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="text-[rgb(var(--surface))] text-4xl sm:text-7xl md:text-8xl font-bold leading-none tracking-tighter text-center px-4 py-4"
                    style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}
                  >
                    Subh Aush Singh
                  </motion.h1>
                )}
              </div>
              <AnimatePresence>
                {loadingPhase === "counting" && (
                  <motion.div
                    initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                    className="absolute bottom-8 right-8 sm:bottom-12 sm:right-12 text-[rgb(var(--surface))] text-5xl sm:text-6xl font-medium tracking-tighter"
                  >
                    {progress}%
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* The 3D world transition stays dark regardless of theme */}
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
          className="relative z-10 w-full bg-[rgb(var(--surface))] text-[rgb(var(--fg))] shadow-[0_0_50px_rgba(0,0,0,0.6)]"
        >
          <DottedGrid />

          {/* white + difference blend = always readable, incl. over the dark footer in light mode */}
          <span className="group fixed top-6 left-6 sm:left-12 z-40 flex items-baseline font-bold text-3xl cursor-default overflow-hidden text-white mix-blend-difference">
            <span>S</span>
            <span className="max-w-0 group-hover:max-w-xs opacity-0 group-hover:opacity-100 whitespace-nowrap overflow-hidden transition-all duration-500 ease-in-out">
              ubh Aush Singh
            </span>
          </span>

          <div className="flex items-center justify-end px-6 sm:px-12 py-6">
            <a href="/SubhAushSingh_Resume.pdf" target="_blank" rel="noopener noreferrer" className="text-sm border border-[rgb(var(--fg)/0.3)] rounded-full px-4 py-2 hover:bg-[rgb(var(--fg))] hover:text-[rgb(var(--surface))] transition z-40 relative">
              Resume
            </a>
          </div>

          <div className="relative z-20 bg-[rgb(var(--surface))]">
            <section id="intro" className="relative min-h-screen px-6 sm:px-12 flex flex-col items-center justify-center -mt-20 overflow-hidden">
              {/* Center Aligned Hero Section */}
              <div className="relative z-10 w-full max-w-4xl mx-auto text-center flex flex-col items-center">
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold leading-[1.18] tracking-tight max-w-4xl">
                  <span className="block">I'm a backend focused developer</span>
                  <span className="block">who enjoys building practical systems,</span>
                  <span className="block">learning through open source,</span>
                  <span className="block">and constantly improving my craft.</span>
                </h1>
                <p className="mt-5 text-[rgb(var(--fg)/0.6)] text-xs sm:text-sm">Final-year CS student, Kolkata, India.</p>
                
                <div className="mt-8 flex flex-wrap justify-center gap-4">
                  <button onClick={handleEnterExperience} className="bg-[rgb(var(--fg))] text-[rgb(var(--surface))] font-semibold text-xs sm:text-sm rounded-full px-6 py-3 hover:opacity-80 transition">
                    Enter the 3D experience &rarr;
                  </button>
                  <a href="#contact" onClick={scrollTo("contact")} className="border border-[rgb(var(--fg)/0.3)] rounded-full text-xs sm:text-sm px-6 py-3 hover:bg-[rgb(var(--fg))] hover:text-[rgb(var(--surface))] transition">
                    Get in touch
                  </a>
                </div>
                
                <div className="mt-8 flex justify-center gap-6">
                  {socialLinks.filter((s) => s.name !== "Contact").map((social) => (
                    <a key={social.name} href={social.link} target="_blank" rel="noopener noreferrer" className="text-[rgb(var(--fg)/0.6)] hover:text-[rgb(var(--fg))] text-xs sm:text-sm underline underline-offset-4">
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
                            <div className="flex items-center gap-2 mb-3 text-[rgb(var(--fg))]">
                              {category.icon}
                              <h3 className="text-base sm:text-lg font-semibold">{category.label}</h3>
                            </div>
                            <div className="flex flex-wrap gap-2.5">
                              {category.items.map((skill) => (
                                <div key={skill.name} className="flex items-center gap-2 bg-[rgb(var(--surface))] border border-[rgb(var(--fg)/0.15)] rounded-full pl-1.5 pr-4 py-1.5">
                                  <div className="w-6 h-6 rounded-full bg-[#F1EDE2] ring-1 ring-black/10 flex items-center justify-center shrink-0">
                                    <img src={skill.imageUrl} alt={skill.name} className="w-3.5 h-3.5 object-contain" />
                                  </div>
                                  <span className="text-[rgb(var(--fg))] font-medium text-sm whitespace-nowrap">{skill.name}</span>
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
                          <div key={exp.company_name} className="border border-[rgb(var(--fg)/0.1)] bg-[rgb(var(--fg)/0.03)] rounded-2xl p-6 w-full">
                            <div className="flex items-baseline justify-between flex-wrap gap-x-4 gap-y-1">
                              <h3 className="text-base sm:text-lg font-semibold">{exp.title}</h3>
                              <span className="text-[rgb(var(--fg)/0.5)] text-sm whitespace-nowrap">{exp.date}</span>
                            </div>
                            <p className="text-[rgb(var(--fg)/0.6)] mt-1 text-sm sm:text-base">{exp.company_name}</p>
                            <ul className="mt-4 list-disc ml-5 space-y-2 text-sm sm:text-[15px] leading-relaxed text-[rgb(var(--fg)/0.75)] marker:text-[rgb(var(--fg)/0.3)]">
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
                      className="absolute inset-0 rounded-3xl overflow-hidden border border-[rgb(var(--fg)/0.15)] bg-[rgb(var(--surface))]"
                      style={{ transform: "translateY(5%) scale(0.75)", transformOrigin: "center center" }}
                    >
                      <OpenSourceGallery contributions={contributions} theme={theme} />
                    </div>

                    {/* Heading sits outside the scaled wrapper so it stays full size */}
                    <div className="pointer-events-none absolute top-24 left-6 sm:left-12 z-20">
                      <h2
                        className="relative inline-block text-4xl sm:text-6xl font-bold tracking-tight"
                        style={{ textShadow: "0 0 28px rgba(59,130,246,0.55), 0 2px 14px rgb(var(--surface) / 0.95)" }}
                      >
                        Open{" "}
                        <span
                          className="text-[rgb(var(--accent))]"
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
                      <p className="text-[rgb(var(--fg)/0.6)] max-w-xl mx-auto text-sm sm:text-base">
                        Looking for backend or SDE roles, or just want to talk shop about systems and code. Reach out.
                      </p>
                      <a href="mailto:subhaushsingh@gmail.com" className="inline-block mt-6 text-base sm:text-xl font-medium underline underline-offset-8 decoration-[rgb(var(--fg)/0.3)] hover:decoration-[rgb(var(--fg))] transition-colors">
                        subhaushsingh@gmail.com
                      </a>
                    </div>
                  </div>

                </motion.div>
              </div>
            </div>
          </div>

          {/* FOOTER: intentionally hardcoded dark, does NOT follow the theme */}
          <footer ref={footerRef} className="relative bottom-0 left-0 w-full z-0 overflow-hidden bg-[#0a0a0a] text-white border-t border-white/10">
            {/* Hand + Enter key fill the footer as its background. Purely an animation: it does not navigate anywhere. */}
            <EnterKeyScene />
            <Starfield />
            <div className="footer-content pointer-events-none relative z-10 px-6 sm:px-12 pt-24 pb-10 min-h-screen flex flex-col justify-between">
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
              <div className="flex items-end justify-end gap-6 mt-16 relative">
                <div className="flex items-baseline"><span className="text-[20vw] sm:text-[11vw] leading-[0.8] font-bold text-white/90 select-none tracking-tighter [text-shadow:0_2px_30px_rgba(0,0,0,0.5)]">SUBH</span></div>
                <button onClick={scrollTo("intro")} aria-label="Go to top" className="w-12 h-12 shrink-0 mb-2 rounded-full bg-white text-black flex items-center justify-center hover:opacity-80 transition">&uarr;</button>
              </div>
            </div>
          </footer>
        </motion.div>
      </div>
    </>
  );
};

export default Landing2D;