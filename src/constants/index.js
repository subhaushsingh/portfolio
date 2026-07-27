import {
    car,
    contact,
    css,
    estate,
    express,
    git,
    github,
    html,
    javascript,
    linkedin,
    mongodb,
    motion,
    mui,
    nextjs,
    nodejs,
    pricewise,
    react,
    redux,
    sass,
    snapgram,
    summiz,
    tailwindcss,
    threads,
    typescript,
    postgresql,
    cpp,
    go,
    python
} from "../assets/icons";

export const skills = [
    {
        imageUrl: cpp,
        name: "C++",
        type: "Language",
    },
    {
        imageUrl: python,
        name: "Python",
        type: "Language",
    },
    {
        imageUrl: go,
        name: "Go",
        type: "Language",
    },
    {
        imageUrl: typescript,
        name: "TypeScript",
        type: "Language",
    },
    {
        imageUrl: javascript,
        name: "JavaScript",
        type: "Language",
    },
    {
        imageUrl: nodejs,
        name: "Node.js",
        type: "Backend",
    },
    {
        imageUrl: express,
        name: "Express",
        type: "Backend",
    },
    {
        imageUrl: mongodb,
        name: "MongoDB",
        type: "Database",
    },
    {
        imageUrl: postgresql,
        name: "PostgreSQL",
        type: "Database",
    },
    {
        imageUrl: react,
        name: "React",
        type: "Frontend",
    },
    {
        imageUrl: nextjs,
        name: "Next.js",
        type: "Frontend",
    },
    {
        imageUrl: tailwindcss,
        name: "Tailwind CSS",
        type: "Frontend",
    },
    {
        imageUrl: git,
        name: "Git",
        type: "Version Control",
    },
    {
        imageUrl: github,
        name: "GitHub",
        type: "Version Control",
    },
];

export const experiences = [
    {
        title: "Full Stack Developer Intern",
        company_name: "Qbayes",
        icon: css,
        iconBg: "#accbe1",
        date: "Feb 2026 - Mar 2026",
        points: [
            "Architected a production-grade multi-tenant ERP backend for a bakery chain with strict data isolation across companies, locations, and shops using Node.js, Express, PostgreSQL, and Prisma ORM.",
            "Implemented hierarchical RBAC across 5 roles with role-scoped Prisma queries enforced at the service layer, plus JWT auth with HttpOnly cookies, refresh token rotation, and multi-device session management.",
            "Built stock lifecycle management (inbound to distribution to sales to expiry returns), atomic Prisma transactions for every multi-step operation, and node-cron jobs for automated expiry alerts.",
        ],
    },
    {
        title: "Frontend Developer (Freelance)",
        company_name: "Aston Glass",
        icon: css,
        iconBg: "#b7e4c7",
        date: "2026",
        points: [
            "Built and deployed a production landing page for a glass manufacturer — responsive, performance-optimized, and aligned with client branding.",
        ],
    },
];

export const socialLinks = [
    {
        name: 'Contact',
        iconUrl: contact,
        link: '/contact',
    },
    {
        name: 'GitHub',
        iconUrl: github,
        link: 'https://github.com/subhaushsingh',
    },
    {
        name: 'LinkedIn',
        iconUrl: linkedin,
        link: 'https://www.linkedin.com/in/subh-aush-singh',
    }
];

export const projects = [
    {
        iconUrl: car,
        theme: 'btn-back-blue',
        name: 'Signalist — Stock Market Platform',
        description: 'Full-stack stock analysis platform with real-time market data, interactive TradingView charts, and watchlist-driven portfolio tracking via Finnhub. Secure Next.js API routes with BetterAuth, rate limiting, and Inngest-powered background workflows for daily market digest emails.',
        link: 'https://signalist-one-pink.vercel.app/',
        github: 'https://github.com/subhaushsingh/Stock-app',
    },
    {
        iconUrl: estate,
        theme: 'btn-back-black',
        name: 'Credex Audit — AI Spend Diagnostic Tool',
        description: 'Diagnostic tool that flags redundant AI subscriptions and recommends tier downgrades. Shipped a decoupled Express API (custom rate-limiting, HPP protection) instead of Next.js API routes for clean process control; pivoted to Groq (llama-3.1-8b-instant) to cut response time under 2s with no cold starts.',
        link: 'https://credex-audit.vercel.app/',
        github: 'https://github.com/subhaushsingh',
    },
];

export const contributions = [
  {
    repo: "strapi/strapi",
    pr: "PR #26421 — Merged",
    description: "Guarded a repeatable-field .map() crash on relations in the content-manager package.",
    link: "https://github.com/strapi/strapi/pull/26421",
  },
  {
    repo: "emscripten-core/emscripten",
    pr: "PR #26318 — Merged",
    description: "Fixed a missing $webSockets dependency in emscripten_websocket_new; regression test approved by core maintainers kripken and sbc100.",
    link: "https://github.com/emscripten-core/emscripten/pull/26318",
  },
  {
    repo: "emscripten-core/emscripten",
    pr: "PR #26639 — Merged",
    description: "Allowed overriding -jsD directives from the command line.",
    link: "https://github.com/emscripten-core/emscripten/pull/26639",
  },
  {
    repo: "CollaboraOnline/online",
    pr: "PR #14444 — Merged",
    description: "Rewrote create-l10n-all-js.pl in Python for the localization build pipeline.",
    link: "https://github.com/CollaboraOnline/online/pull/14444",
  },
  {
    repo: "marketcalls/openalgo",
    pr: "PR #898 — Merged",
    description: "Added precise type hints to trading API helper functions, improving type safety and IDE tooling.",
    link: "https://github.com/marketcalls/openalgo/pull/898",
  },
  {
    repo: "nextcloud/server",
    pr: "PR #58370 — Merged",
    description: "Removed a redundant ext-json Composer requirement, since JSON is bundled with PHP 8+.",
    link: "https://github.com/nextcloud/server/pull/58370",
  },
];