import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { experiences, skills, projects, contributions, socialLinks } from "../constants";

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
  const [exiting, setExiting] = useState(false);
  const [activeSection, setActiveSection] = useState("intro");
  const navigate = useNavigate();

  const handleEnterExperience = (e) => {
    e.preventDefault();
    setExiting(true);
    setTimeout(() => navigate("/experience"), 900);
  };

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

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
    <>
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            onClick={() => setLoading(false)}
            className='fixed inset-0 bg-black flex items-center justify-center z-50 cursor-pointer'
          >
            <h1 className='text-white text-4xl sm:text-6xl font-semibold tracking-tight'>
              Subh Aush Singh
            </h1>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {exiting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className='fixed inset-0 bg-black flex items-center justify-center z-50'
          >
            <h1 className='text-white text-4xl sm:text-6xl font-semibold tracking-tight'>
              Entering the 3D world...
            </h1>
          </motion.div>
        )}
      </AnimatePresence>

      <div className='min-h-screen bg-black text-white'>
        {/* Logo — fixed in place while scrolling, larger font */}
        <span className='group fixed top-6 left-6 sm:left-12 z-40 flex items-baseline font-bold text-3xl cursor-default overflow-hidden'>
          <span>S</span>
          <span className='max-w-0 group-hover:max-w-xs opacity-0 group-hover:opacity-100 whitespace-nowrap overflow-hidden transition-all duration-500 ease-in-out'>
            ubh Aush Singh
          </span>
        </span>

        {/* Top bar — Resume button only, stays in normal document flow */}
        <div className='flex items-center justify-end px-6 sm:px-12 py-6'>
          <a
            href='/Subh Aush Singh_Resume.pdf'
            target='_blank'
            rel='noopener noreferrer'
            className='text-sm border border-white/30 rounded-full px-4 py-2 hover:bg-white hover:text-black transition'
          >
            Resume
          </a>
        </div>

        {/* Left-side section nav — hidden on mobile, fixed on larger screens */}
        <nav className='hidden lg:flex flex-col gap-3 fixed left-8 top-1/2 -translate-y-1/2 z-40'>
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={`text-sm transition-colors ${
                activeSection === s.id ? "text-white font-semibold" : "text-white/40 hover:text-white/70"
              }`}
            >
              {s.label}
            </a>
          ))}
        </nav>

        {/* Hero */}
        <section id='intro' className='min-h-screen px-6 sm:px-12 max-w-4xl mx-auto text-center flex flex-col items-center justify-center'>
          <h1 className='text-3xl sm:text-5xl font-semibold leading-tight'>
            I'm a backend-focused developer who likes shipping real systems,
            not just tutorials — and picking up open-source along the way.
          </h1>
          <p className='mt-6 text-white/60 text-lg'>
            Final-year CS student, Kolkata, India.
          </p>

          <div className='mt-10 flex flex-wrap justify-center gap-4'>
            <button
              onClick={handleEnterExperience}
              className='bg-white text-black font-semibold rounded-full px-6 py-3 hover:opacity-80 transition'
            >
              Enter the 3D experience →
            </button>
            <a
              href='#contact'
              className='border border-white/30 rounded-full px-6 py-3 hover:bg-white hover:text-black transition'
            >
              Get in touch
            </a>
          </div>

          <div className='mt-8 flex justify-center gap-5'>
            {socialLinks
              .filter((s) => s.name !== "Contact")
              .map((social) => (
                <a
                  key={social.name}
                  href={social.link}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-white/60 hover:text-white text-sm underline underline-offset-4'
                >
                  {social.name}
                </a>
              ))}
          </div>
        </section>

        {/* Skills */}
        <section id='skills' className='min-h-screen px-6 sm:px-12 text-center flex flex-col items-center justify-center'>
          <h2 className='text-4xl sm:text-5xl font-semibold mb-10'>skills.</h2>
          <div className='flex flex-wrap justify-center gap-3 max-w-4xl mx-auto'>
            {skills.map((skill) => (
              <span
                key={skill.name}
                className='flex items-center gap-2 border border-white/20 rounded-full px-4 py-2 text-sm text-white/80'
              >
                <img src={skill.imageUrl} alt={skill.name} className='w-4 h-4 object-contain' />
                {skill.name}
              </span>
            ))}
          </div>
        </section>

        {/* Experience */}
        <section id='work' className='min-h-screen px-6 sm:px-12 text-center flex flex-col items-center justify-center'>
          <h2 className='text-4xl sm:text-5xl font-semibold mb-10'>work.</h2>
          <div className='flex flex-col items-center gap-8 max-w-3xl mx-auto text-left'>
            {experiences.map((exp) => (
              <div key={exp.company_name} className='border border-white/10 rounded-xl p-6 w-full'>
                <div className='flex items-center justify-between flex-wrap gap-2'>
                  <h3 className='text-xl font-semibold'>{exp.title}</h3>
                  <span className='text-white/50 text-sm'>{exp.date}</span>
                </div>
                <p className='text-white/60 mt-1'>{exp.company_name}</p>
                <ul className='mt-4 list-disc ml-5 space-y-1 text-sm text-white/70'>
                  {exp.points.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Projects */}
        <section id='projects' className='min-h-screen px-6 sm:px-12 text-center flex flex-col items-center justify-center'>
          <h2 className='text-4xl sm:text-5xl font-semibold mb-10'>projects.</h2>
          <div className='grid sm:grid-cols-2 gap-6 max-w-5xl mx-auto text-left'>
            {projects.map((project) => (
              <div key={project.name} className='border border-white/10 rounded-xl p-6'>
                <h3 className='text-xl font-semibold'>{project.name}</h3>
                <p className='text-white/60 mt-2 text-sm'>{project.description}</p>
                <div className='mt-4 flex gap-4 text-sm'>
                  <a
                    href={project.link}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='underline underline-offset-4 hover:text-white/70'
                  >
                    Live
                  </a>
                  {project.github && (
                    <a
                      href={project.github}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='underline underline-offset-4 hover:text-white/70'
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
        <section id='opensource' className='min-h-screen px-6 sm:px-12 text-center flex flex-col items-center justify-center'>
          <h2 className='text-4xl sm:text-5xl font-semibold mb-10'>open source.</h2>
          <div className='grid sm:grid-cols-2 gap-6 max-w-5xl mx-auto text-left'>
            {contributions.map((c) => (
              <a
                key={c.link}
                href={c.link}
                target='_blank'
                rel='noopener noreferrer'
                className='border border-white/10 rounded-xl p-6 hover:border-white/30 transition block'
              >
                <p className='font-semibold'>{c.repo}</p>
                <p className='text-sm text-white/50'>{c.pr}</p>
                <p className='text-sm text-white/70 mt-2'>{c.description}</p>
              </a>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section id='contact' className='min-h-screen px-6 sm:px-12 text-center flex flex-col items-center justify-center'>
          <h2 className='text-4xl sm:text-5xl font-semibold mb-6'>contact.</h2>
          <p className='text-white/60 max-w-lg'>
            Looking for backend/SDE roles, or just want to talk shop about
            systems and code — reach out.
          </p>
          <a
            href='mailto:subhaushsingh@gmail.com'
            className='inline-block mt-6 text-lg underline underline-offset-4'
          >
            subhaushsingh@gmail.com
          </a>
        </section>

        <footer className='px-6 sm:px-12 py-8 text-white/40 text-sm border-t border-white/10 text-center flex flex-col items-center gap-3'>
          <div className='flex gap-5'>
            {socialLinks
              .filter((s) => s.name !== "Contact")
              .map((social) => (
                <a
                  key={social.name}
                  href={social.link}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-white/50 hover:text-white transition-colors'
                >
                  {social.name}
                </a>
              ))}
          </div>
          <p>© {new Date().getFullYear()} Subh Aush Singh</p>
        </footer>
      </div>
    </>
  );
};

export default Landing2D;