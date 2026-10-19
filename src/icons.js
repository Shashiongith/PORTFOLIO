// Animated icons — vanilla/GSAP ports of https://github.com/pqoqubbw/icons (Lucide Animated).
// The originals are React + motion; geometry and animation values are copied, the runtime is GSAP.
//
//   icon('send')                      -> SVG markup string
//   bindIcons(root)                   -> hover/focus animation for every [data-icon-host] in root
//   playIcon(svgEl)                   -> run one icon's animation manually (e.g. after a click)
import gsap from 'gsap';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// `data-draw` shapes get pathLength=1 so stroke-dashoffset can draw them.
const SHAPES = {
  send: `<g data-p="plane"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/></g>`,
  mail: `<path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/><path data-draw d="m16 19 2 2 4-4"/>`,
  github: `<path data-draw data-p="body" d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path data-p="tail" d="M9 18c-4.51 2-5-2-7-2"/>`,
  linkedin: `<path data-draw d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect data-draw x="2" y="9" width="4" height="12"/><circle data-draw cx="4" cy="4" r="2"/>`,
  arrow: `<g data-p="arrow"><path d="M7 7H17"/><path d="M17 7V17"/><path d="M7 17L17 7"/></g>`,
  download: `<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><g data-p="arrow"><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></g>`,
  clock: `<circle cx="12" cy="12" r="10"/><line data-p="hour" x1="12" x2="12" y1="12" y2="6"/><line data-p="min" x1="12" x2="16" y1="12" y2="12"/>`,
  pin: `<g data-p="pin"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle data-draw data-p="dot" cx="12" cy="10" r="3"/></g>`,
  copy: `<rect data-p="front" x="8" y="8" width="14" height="14" rx="2" ry="2"/><path data-p="back" d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>`,
  check: `<circle cx="12" cy="12" r="10"/><path data-draw d="m9 12 2 2 4-4"/>`,
};

export function icon(name, size = 20) {
  return `<svg class="ico" data-icon="${name}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" style="overflow:visible">${SHAPES[name]}</svg>`;
}

const q = (svg, s) => svg.querySelector(`[data-p="${s}"]`);
const draws = (svg) => [...svg.querySelectorAll('[data-draw]')];

// pathLength="1" lets every drawn shape share the same dash maths
const prep = (svg) => {
  if (svg._ready) return;
  svg._ready = true;
  draws(svg).forEach((p) => { p.setAttribute('pathLength', '1'); p.style.strokeDasharray = '1 1'; });
};
const drawIn = (els, d = 0.4, delay = 0) =>
  gsap.fromTo(els, { strokeDashoffset: 1, opacity: 0 }, { strokeDashoffset: 0, opacity: 1, duration: d, delay, ease: 'power1.inOut', overwrite: true });

// name -> { enter(svg), leave(svg) }. Values mirror each icon's `animate` variant upstream.
const ANIM = {
  send: {
    enter: (s) => gsap.to(q(s, 'plane'), { x: 3, y: -3, scale: 0.8, duration: 0.5, transformOrigin: '50% 50%', overwrite: true }),
    leave: (s) => gsap.to(q(s, 'plane'), { x: 0, y: 0, scale: 1, duration: 0.3, overwrite: true }),
  },
  mail: { enter: (s) => drawIn(draws(s), 0.4), leave: (s) => gsap.set(draws(s), { strokeDashoffset: 0, opacity: 1 }) },
  github: {
    enter: (s) => {
      gsap.fromTo(q(s, 'body'), { strokeDashoffset: 1, opacity: 0, scale: 0.9 }, { strokeDashoffset: 0, opacity: 1, scale: 1, duration: 0.4, transformOrigin: '50% 50%', overwrite: true });
      gsap.fromTo(q(s, 'tail'), { rotate: 0 }, { keyframes: { rotate: [0, -15, 15, -10, 10, -5, 5, 0] }, duration: 1.2, ease: 'sine.inOut', transformOrigin: '9px 18px', overwrite: true });
    },
    leave: (s) => { gsap.to(q(s, 'tail'), { rotate: 0, duration: 0.3, overwrite: true }); gsap.set(q(s, 'body'), { strokeDashoffset: 0, opacity: 1, scale: 1 }); },
  },
  linkedin: {
    enter: (s) => gsap.fromTo(draws(s), { strokeDashoffset: 1, opacity: 0 }, { strokeDashoffset: 0, opacity: 1, duration: 0.6, ease: 'none', overwrite: true }),
    leave: (s) => gsap.set(draws(s), { strokeDashoffset: 0, opacity: 1 }),
  },
  arrow: {
    enter: (s) => gsap.fromTo(q(s, 'arrow'), { x: 0, y: 0, scale: 1 }, { keyframes: { x: [0, -4, 0], y: [0, 4, 0], scale: [1, 0.85, 1] }, duration: 0.5, ease: 'sine.inOut', transformOrigin: '100% 0%', overwrite: true }),
    leave: (s) => gsap.set(q(s, 'arrow'), { x: 0, y: 0, scale: 1 }),
  },
  download: {
    enter: (s) => gsap.to(q(s, 'arrow'), { y: 2, duration: 0.6, ease: 'elastic.out(1, 0.4)', overwrite: true }),
    leave: (s) => gsap.to(q(s, 'arrow'), { y: 0, duration: 0.3, overwrite: true }),
  },
  clock: {
    enter: (s) => {
      gsap.to(q(s, 'hour'), { rotate: 360, duration: 0.6, ease: 'power2.inOut', transformOrigin: '12px 12px', overwrite: true });
      gsap.to(q(s, 'min'), { rotate: 45, duration: 0.5, ease: 'sine.inOut', transformOrigin: '12px 12px', overwrite: true });
    },
    leave: (s) => { gsap.set(q(s, 'hour'), { rotate: 0 }); gsap.to(q(s, 'min'), { rotate: 0, duration: 0.3, transformOrigin: '12px 12px', overwrite: true }); },
  },
  pin: {
    enter: (s) => {
      gsap.to(q(s, 'pin'), { keyframes: { y: [0, -5, -3] }, duration: 0.5, overwrite: true });
      gsap.fromTo(q(s, 'dot'), { strokeDashoffset: 1, opacity: 0 }, { strokeDashoffset: 0, opacity: 1, duration: 0.5, delay: 0.3, overwrite: true });
    },
    leave: (s) => { gsap.to(q(s, 'pin'), { y: 0, duration: 0.3, overwrite: true }); gsap.set(q(s, 'dot'), { strokeDashoffset: 0, opacity: 1 }); },
  },
  copy: {
    enter: (s) => { gsap.to(q(s, 'front'), { x: -3, y: -3, duration: 0.3, overwrite: true }); gsap.to(q(s, 'back'), { x: 3, y: 3, duration: 0.3, overwrite: true }); },
    leave: (s) => { gsap.to(q(s, 'front'), { x: 0, y: 0, duration: 0.3, overwrite: true }); gsap.to(q(s, 'back'), { x: 0, y: 0, duration: 0.3, overwrite: true }); },
  },
  check: { enter: (s) => drawIn(draws(s), 0.4), leave: (s) => gsap.set(draws(s), { strokeDashoffset: 0, opacity: 1 }) },
};

export function playIcon(svg) {
  if (reduced || !svg) return;
  prep(svg);
  ANIM[svg.dataset.icon]?.enter(svg);
}
const stopIcon = (svg) => {
  if (reduced || !svg) return;
  prep(svg);
  ANIM[svg.dataset.icon]?.leave(svg);
};

// Anything with data-icon-host animates its icons on hover and keyboard focus.
export function bindIcons(root = document) {
  root.querySelectorAll('[data-icon-host]').forEach((host) => {
    if (host._iconBound) return;
    host._iconBound = true;
    const svgs = () => host.querySelectorAll('svg[data-icon]');
    const on = () => svgs().forEach(playIcon);
    const off = () => svgs().forEach(stopIcon);
    host.addEventListener('pointerenter', on);
    host.addEventListener('pointerleave', off);
    host.addEventListener('focusin', on);
    host.addEventListener('focusout', off);
  });
}
