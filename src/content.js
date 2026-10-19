// ─────────────────────────────────────────────────────────────
//  EDIT THIS FILE. Everything on the site is rendered from here.
//  Anything marked TODO is a placeholder — replace with your real info.
// ─────────────────────────────────────────────────────────────

export const me = {
  name: 'Shashikant Nirala',
  first: 'Shashikant',
  role: 'Software developer',
  location: 'India',                       // TODO
  email: 'tohbusiness12@gmail.com',
  status: 'Open to internships — 2026',     // TODO
  intro:
    'I build things for the web and care about the details nobody asks for — the easing, the empty state, the 3 a.m. bug.',
  about: [
    "I'm a student developer who learns by shipping. I like the full stack of a problem: the idea, the data model, the API, and the pixel that finally makes it feel right.", // TODO
    'Lately I have been pitching and prototyping AI-agent products, and building interactive web experiences with WebGL — this site is one of them.',            // TODO
  ],
  facts: [
    ['Based in', 'India'],           // TODO
    ['Studying', 'Your degree · Your college'], // TODO
    ['Focus', 'Full-stack · Interaction'],
    ['Currently', 'Looking for an internship'],
  ],
  reply: 'Within 24 hours',
  timezone: 'IST (UTC+5:30)',
  formEndpoint: '',                  // TODO: paste a Formspree/Basin URL to send straight to your inbox. Empty = opens the visitor's mail app.
  resume: '/resume.pdf',             // TODO: put your PDF in /public/resume.pdf
  socials: [
    ['GitHub', 'https://github.com/', 'github'],       // TODO
    ['LinkedIn', 'https://linkedin.com/in/', 'linkedin'], // TODO
  ],
};

export const contact = {
  lede: 'Hiring for an internship, scoping a project, or just want to talk shop? I read and answer everything myself.',
  topics: ['Internship', 'Project', 'Collaboration', 'Just saying hi'],
  steps: [
    ['01', 'You write', 'Tell me a little about what you have in mind.'],
    ['02', 'I reply', 'A personal answer, usually within a day.'],
    ['03', 'We talk', 'A short call or a thread — whatever suits you.'],
  ],
};

export const skills = [
  ['Languages', 'Java · JavaScript · Python · SQL'],       // TODO adjust
  ['Frontend', 'HTML · CSS · React · Three.js · GSAP'],
  ['Backend', 'Node.js · Express · REST'],
  ['Data', 'MongoDB · MySQL · Supabase'],
  ['Tools', 'Git · Linux · VS Code · Figma'],
];

export const marquee = [
  'Java', 'JavaScript', 'Python', 'React', 'Node.js', 'MongoDB', 'Three.js', 'GSAP', 'SQL', 'Git',
];

// accent = thumbnail colour for the hover preview
export const projects = [
  {
    title: 'AgentDock',
    year: '2026',
    type: 'Ideathon · Product concept',
    blurb:
      'A storefront layer that lets AI agents like Instinct discover and transact with any business — pitched as "the Shopify of the agent economy".',
    stack: ['Product design', 'System design', 'Pitch'],
    link: '',
    accent: '#ff4d1c',
  },
  {
    title: 'SaathChalo',
    year: '2026',
    type: 'Ideathon · Concept',
    blurb: 'Replace with a one-line description of what it does and who it is for.', // TODO
    stack: ['Your', 'Stack', 'Here'],
    link: '',
    accent: '#d9ff3f',
  },
  {
    title: 'Saathi',
    year: '2026',
    type: 'Ideathon · Concept',
    blurb: 'Replace with a one-line description of what it does and who it is for.', // TODO
    stack: ['Your', 'Stack', 'Here'],
    link: '',
    accent: '#7ad7ff',
  },
  {
    title: 'Your next project',
    year: '2026',
    type: 'Web app',
    blurb: 'Add the project you are proudest of. Lead with the problem, not the tech.', // TODO
    stack: ['React', 'Node', 'MongoDB'],
    link: 'https://github.com/',
    accent: '#f2b8ff',
  },
];

export const timeline = [
  { when: '2023 — now', what: 'B.Tech / B.E. — Your branch', where: 'Your college', note: 'Relevant coursework, CGPA, clubs.' }, // TODO
  { when: '2026', what: 'Instinct Ideathon', where: 'Team pitch', note: 'Designed and presented AgentDock.' },
  { when: '2025', what: 'Add a certification / hackathon', where: 'Where', note: 'One line of impact.' }, // TODO
];
