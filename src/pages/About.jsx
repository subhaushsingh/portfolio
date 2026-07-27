import {
  VerticalTimeline,
  VerticalTimelineElement,
} from "react-vertical-timeline-component";

import { CTA } from "../components";
import { experiences, skills, contributions } from "../constants";

import "react-vertical-timeline-component/style.min.css";

const About = () => {
  return (
    <section className='max-container'>
      <h1 className='head-text'>
        Hello, I'm{" "}
        <span className='blue-gradient_text font-semibold drop-shadow'>
          Subh Aush Singh
        </span>
      </h1>

      <div className='mt-5 flex flex-col gap-3 text-slate-500'>
        <p>
          Backend-focused developer and final-year B.Tech Computer Science
          student based in Kolkata, West Bengal, India. I enjoy building
          scalable backend systems, designing reliable APIs, and contributing to
          open-source software.
        </p>
      </div>

      <div className='py-10 flex flex-col'>
        <h3 className='subhead-text'>My Skills</h3>

        <div className='mt-16 flex flex-wrap gap-12'>
          {skills.map((skill) => (
            <div className='block-container w-20 h-20' key={skill.name}>
              <div className='btn-back rounded-xl' />
              <div className='btn-front rounded-xl flex justify-center items-center'>
                <img
                  src={skill.imageUrl}
                  alt={skill.name}
                  className='w-1/2 h-1/2 object-contain'
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className='py-16'>
        <h3 className='subhead-text'>Experience</h3>

        <div className='mt-5 flex flex-col gap-3 text-slate-500'>
          <p>
            My professional experience includes a backend internship, a
            freelance frontend project, and contributions to widely used
            open-source projects.
          </p>
        </div>

        <div className='mt-12 flex'>
          <VerticalTimeline>
            {experiences.map((experience) => (
              <VerticalTimelineElement
                key={experience.company_name}
                date={experience.date}
                iconStyle={{ background: experience.iconBg }}
                icon={
                  <div className='flex justify-center items-center w-full h-full'>
                    <img
                      src={experience.icon}
                      alt={experience.company_name}
                      className='w-[60%] h-[60%] object-contain'
                    />
                  </div>
                }
                contentStyle={{
                  borderBottom: "8px",
                  borderStyle: "solid",
                  borderBottomColor: experience.iconBg,
                  boxShadow: "none",
                }}
              >
                <div>
                  <h3 className='text-black text-xl font-poppins font-semibold'>
                    {experience.title}
                  </h3>

                  <p
                    className='text-black-500 font-medium text-base'
                    style={{ margin: 0 }}
                  >
                    {experience.company_name}
                  </p>
                </div>

                <ul className='my-5 list-disc ml-5 space-y-2'>
                  {experience.points.map((point, index) => (
                    <li
                      key={`experience-point-${index}`}
                      className='text-black-500/50 font-normal pl-1 text-sm'
                    >
                      {point}
                    </li>
                  ))}
                </ul>
              </VerticalTimelineElement>
            ))}
          </VerticalTimeline>
        </div>
      </div>

      <div className='py-16'>
        <h3 className='subhead-text'>Open Source Contributions</h3>

        <div className='mt-5 flex flex-col gap-3 text-slate-500'>
          <p>
            I actively contribute to established open-source projects, fixing
            bugs, improving tooling, and enhancing developer experience across
            multiple ecosystems.
          </p>
        </div>

        <div className='mt-12 grid grid-cols-1 md:grid-cols-2 gap-6'>
          {contributions.map((contribution) => (
            <div
              key={`${contribution.repo}-${contribution.pr}`}
              className='group relative bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between'
            >
              <div>
                <div className='flex justify-between items-start'>
                  <h4 className='text-xl font-poppins font-semibold text-black group-hover:text-blue-600 transition-colors duration-300'>
                    {contribution.repo}
                  </h4>
                  <div className='w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors duration-300'>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className="text-slate-400 group-hover:text-blue-600 transition-colors duration-300"
                    >
                      <circle cx="18" cy="18" r="3"></circle>
                      <circle cx="6" cy="6" r="3"></circle>
                      <path d="M13 6h3a2 2 0 0 1 2 2v7"></path>
                      <line x1="6" y1="9" x2="6" y2="21"></line>
                    </svg>
                  </div>
                </div>

                <div className='mt-3 inline-block px-3 py-1 bg-blue-50 rounded-full'>
                  <span className='text-xs font-semibold text-blue-600 tracking-wide'>
                    {contribution.pr}
                  </span>
                </div>

                <p className='mt-4 text-slate-500 text-sm leading-relaxed'>
                  {contribution.description}
                </p>
              </div>

              <a
                href={contribution.link}
                target='_blank'
                rel='noreferrer'
                className='mt-6 flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 w-fit'
              >
                View Contribution
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="group-hover:translate-x-1 transition-transform duration-300"
                >
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </a>
            </div>
          ))}
        </div>
      </div>

      <hr className='border-slate-200' />

      <CTA />
    </section>
  );
};

export default About;