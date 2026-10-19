import './style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { createScene } from './scene.js';
import { me, skills, marquee, projects, timeline, contact } from './content.js';
import { icon, bindIcons, playIcon } from './icons.js';
import { createSound } from './audio.js';

gsap.registerPlugin(ScrollTrigger);
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

document.body.classList.add('is-loading');

/* ── render content ─────────────────────────────────────────── */
$('#status').textContent = me.status;
$('#intro').textContent = me.intro;
$('#heroTitle').innerHTML = `<span class="l1">${me.first}</span><span class="l2">${me.name.replace(me.first, '').trim()}</span>`;
$('#aboutText').innerHTML = me.about.map((p) => `<p>${p}</p>`).join('');
$('#facts').innerHTML = me.facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
$('#skills').innerHTML = skills.map(([k, v]) => `<li><b>${k}</b><span>${v}</span></li>`).join('');
$('#marquee').innerHTML = [...marquee, ...marquee, ...marquee, ...marquee].map((m) => `<span>${m}</span>`).join('');
$('#projects').innerHTML = projects
  .map((p, i) => {
    const tag = p.link ? 'a' : 'div';
    const href = p.link ? ` href="${p.link}" target="_blank" rel="noopener"` : '';
    return `<li><${tag} class="project"${href} data-icon-host data-i="${i}" data-cursor="${p.link ? 'Open' : 'View'}">
      <span class="project__no">0${i + 1}</span>
      <h3 class="project__title">${p.title}</h3>
      <div class="project__meta"><p>${p.blurb}</p><div class="tags">${p.stack.map((s) => `<i>${s}</i>`).join('')}</div></div>
      <span class="project__year">${p.year}${p.link ? icon('arrow', 16) : ''}</span></${tag}></li>`;
  })
  .join('');
$('#timeline').innerHTML = timeline
  .map((t) => `<li><span class="when">${t.when}</span><div class="what">${t.what}<span class="where">${t.where}</span></div><p class="note">${t.note}</p></li>`)
  .join('');
$('#contactLede').textContent = contact.lede;
$('#resume').innerHTML = `${icon('download', 18)}<span>Résumé</span>`;
$('#resume').href = me.resume;
$('#resume').setAttribute('download', '');
$('#formNote').textContent = `Reply ${me.reply.toLowerCase()}`;
$('#topics').innerHTML = contact.topics
  .map((t, i) => `<label class="chip"><input type="radio" name="topic" value="${t}"${i === 0 ? ' checked' : ''} /><span>${t}</span></label>`)
  .join('');
$('#steps').innerHTML = contact.steps.map(([n, h, d]) => `<li><span class="mono">${n}</span><div><b>${h}</b><p>${d}</p></div></li>`).join('');
$('#channels').innerHTML = [
  `<li data-icon-host><a href="mailto:${me.email}" class="channel__main" data-cursor="Write">${icon('mail', 20)}<span><small class="mono">Email</small>${me.email}</span></a>
     <button type="button" class="copy" id="copyMail" aria-label="Copy email address" data-icon-host>${icon('copy', 16)}</button></li>`,
  `<li class="channel" data-icon-host>${icon('pin', 20)}<span><small class="mono">Based in</small>${me.location}</span></li>`,
  `<li class="channel" data-icon-host>${icon('clock', 20)}<span><small class="mono">Reply time</small>${me.reply} · ${me.timezone}</span></li>`,
  ...me.socials.map(([n, u, ic]) => `<li data-icon-host><a href="${u}" target="_blank" rel="noopener" class="channel__main">${icon(ic, 20)}<span><small class="mono">Find me on</small>${n}</span>${icon('arrow', 16)}</a></li>`),
].join('');
$('#year').textContent = `© ${new Date().getFullYear()} ${me.name}`;

// wrap words in masks for the reveal animations
$$('.about__text p').forEach((p) => {
  // keep it simple: wrap words only for plain-text paragraphs
  p.innerHTML = p.textContent.split(' ').map((w) => `<span class="w"><span>${w}</span></span>`).join(' ');
});
$$('.l1, .l2').forEach((el) => {
  el.innerHTML = `<span class="w"><span>${el.textContent}</span></span>`;
});

/* ── smooth scroll ──────────────────────────────────────────── */
const lenis = new Lenis({ lerp: 0.085, smoothWheel: !reduced });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
lenis.stop();
$$('a[href^="#"]').forEach((a) =>
  a.addEventListener('click', (e) => {
    e.preventDefault();
    lenis.scrollTo(a.getAttribute('href'), { offset: 0, duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) });
  })
);
$('#toTop').addEventListener('click', () => lenis.scrollTo(0, { duration: 2 }));

/* ── WebGL ──────────────────────────────────────────────────── */
let world = null;
try {
  world = createScene($('#scene'));
} catch (err) {
  console.warn('WebGL unavailable, falling back to flat background.', err);
  $('#scene').remove();
}

/* ── cursor ─────────────────────────────────────────────────── */
if (fine) {
  document.body.classList.add('has-cursor');
  const ring = $('#cursor'), dot = $('#cursorDot'), label = $('.cursor__label');
  const rx = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' });
  const ry = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });
  const dx = gsap.quickTo(dot, 'x', { duration: 0.08 });
  const dy = gsap.quickTo(dot, 'y', { duration: 0.08 });
  window.addEventListener('pointermove', (e) => { rx(e.clientX); ry(e.clientY); dx(e.clientX); dy(e.clientY); });
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest('[data-cursor]');
    const l = e.target.closest('a, button, [data-magnetic]');
    ring.classList.toggle('is-label', !!t);
    ring.classList.toggle('is-link', !!l && !t);
    label.textContent = t ? t.dataset.cursor : '';
  });
  document.addEventListener('pointerdown', () => gsap.to(ring, { scale: 0.8, duration: 0.2 }));
  document.addEventListener('pointerup', () => gsap.to(ring, { scale: 1, duration: 0.3, ease: 'back.out(3)' }));

  // magnetic elements
  $$('[data-magnetic]').forEach((el) => {
    const mx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.5)' });
    const my = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.5)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      mx((e.clientX - (r.left + r.width / 2)) * 0.35);
      my((e.clientY - (r.top + r.height / 2)) * 0.35);
    });
    el.addEventListener('pointerleave', () => { mx(0); my(0); });
  });

  // project hover preview follows the cursor
  const prev = $('#preview'), art = $('.preview__art'), tag = $('.preview__tag');
  const px = gsap.quickTo(prev, 'x', { duration: 0.6, ease: 'power3' });
  const py = gsap.quickTo(prev, 'y', { duration: 0.6, ease: 'power3' });
  const rot = gsap.quickTo(prev, 'rotation', { duration: 0.6, ease: 'power3' });
  let lastX = 0;
  window.addEventListener('pointermove', (e) => {
    px(e.clientX + 40); py(e.clientY);
    rot(Math.max(-12, Math.min(12, (e.clientX - lastX) * 0.6))); lastX = e.clientX;
  });
  $$('.project').forEach((el) => {
    const p = projects[+el.dataset.i];
    el.addEventListener('pointerenter', () => {
      art.style.background = `
        radial-gradient(circle at 30% 30%, ${p.accent} 0 18%, transparent 19%),
        repeating-linear-gradient(135deg, ${p.accent}22 0 10px, transparent 10px 20px), #151410`;
      tag.textContent = `${p.title} — ${p.type}`;
      gsap.to(prev, { opacity: 1, scale: 1, duration: 0.4, ease: 'power3.out', overwrite: 'auto' });
    });
    el.addEventListener('pointerleave', () => gsap.to(prev, { opacity: 0, scale: 0.8, duration: 0.3, overwrite: 'auto' }));
  });
}

/* ── clock ──────────────────────────────────────────────────── */
const clock = $('#clock');
const tick = () => (clock.textContent = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' IST');
tick(); setInterval(tick, 15000);

/* ── scroll animations ──────────────────────────────────────── */
function scrollAnimations() {
  gsap.to('#marquee', { xPercent: -25, ease: 'none', scrollTrigger: { trigger: '.marquee', start: 'top bottom', end: 'bottom top', scrub: 0.6 } });
  gsap.to('.hero__title', { yPercent: -18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  $$('.about__text .w > span').forEach((s) =>
    gsap.from(s, { yPercent: 110, duration: 1, ease: 'power4.out', scrollTrigger: { trigger: s, start: 'top 92%' } })
  );
  $$('.eyebrow, .facts div, .skills li, .projects li, .timeline li, .contact__side > *, .form').forEach((el) =>
    gsap.from(el, { y: 40, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%' } })
  );
  gsap.from('.contact__title', { y: 80, opacity: 0, duration: 1.2, ease: 'power4.out', scrollTrigger: { trigger: '.contact__title', start: 'top 85%' } });
}

/* ── motion + sound controls ────────────────────────────────── */
const sound = createSound();
const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};
function setMotion(paused) {
  document.body.classList.toggle('is-paused', paused);
  $('#motionBtn').setAttribute('aria-pressed', String(paused));
  $('#motionLabel').textContent = paused ? 'Motion off' : 'Motion on';
  if (world) world.paused = paused;
  if (lenis.options) lenis.options.smoothWheel = !paused && !reduced; // paused = plain native scrolling
  store.set('motion', paused ? 'off' : 'on');
}
// respect the OS setting unless the visitor chose otherwise before
setMotion((store.get('motion') ?? (reduced ? 'off' : 'on')) === 'off');
$('#motionBtn').addEventListener('click', () => setMotion(!document.body.classList.contains('is-paused')));

sound.onChange((on) => {
  $('#soundBtn').setAttribute('aria-pressed', String(on));
  $('#soundLabel').textContent = on ? 'Sound on' : 'Sound off';
});
$('#soundBtn').addEventListener('click', () => sound.toggle());

const SFX_TARGET = 'a, button, [data-cursor], [data-magnetic], .chip, .project, .skills li';
let lastSfx = null;
document.addEventListener('pointerover', (e) => {
  if (e.pointerType === 'touch') return;
  const t = e.target.closest(SFX_TARGET);
  if (t && t !== lastSfx) sound.hover();
  lastSfx = t;
});
document.addEventListener('pointerdown', (e) => e.target.closest(SFX_TARGET) && sound.click());

/* ── contact form ───────────────────────────────────────────── */
const form = $('#form'), statusEl = $('#formStatus'), sendBtn = $('.btn--send'), sendLabel = $('#sendLabel');
sendBtn.insertAdjacentHTML('beforeend', icon('send', 18));
bindIcons();

$('#copyMail').addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  try { await navigator.clipboard.writeText(me.email); } catch { return; }
  btn.innerHTML = icon('check', 16);
  playIcon(btn.firstElementChild);
  btn.classList.add('is-done');
  setTimeout(() => { btn.innerHTML = icon('copy', 16); btn.classList.remove('is-done'); }, 1800);
});

const rules = {
  name: (v) => (v.trim().length < 2 ? 'Please tell me your name.' : ''),
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'That email doesn’t look right.'),
  message: (v) => (v.trim().length < 10 ? 'A few more words, please (10+ characters).' : ''),
};
const check = (el) => {
  const msg = rules[el.name]?.(el.value) ?? '';
  el.closest('.field').classList.toggle('has-error', !!msg);
  el.setAttribute('aria-invalid', msg ? 'true' : 'false');
  el.closest('.field').querySelector('.err').textContent = msg;
  return !msg;
};
$$('input[name=name], input[name=email], textarea', form).forEach((el) => {
  el.addEventListener('blur', () => check(el));
  el.addEventListener('input', () => el.closest('.field').classList.contains('has-error') && check(el));
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fields = $$('input[name=name], input[name=email], textarea', form);
  const bad = fields.filter((el) => !check(el));
  if (bad.length) { bad[0].focus(); return; }
  if (form.company.value) return; // honeypot

  const data = Object.fromEntries(new FormData(form));
  const topic = data.topic || 'Hello';
  sendBtn.disabled = true; sendLabel.textContent = 'Sending…'; statusEl.textContent = '';

  try {
    if (me.formEndpoint) {
      const res = await fetch(me.formEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error(res.status);
    } else {
      // no backend configured: hand off to the visitor's mail app with everything prefilled
      const body = `${data.message}\n\n— ${data.name} (${data.email})`;
      location.href = `mailto:${me.email}?subject=${encodeURIComponent(`[Portfolio] ${topic}`)}&body=${encodeURIComponent(body)}`;
    }
    form.reset();
    statusEl.innerHTML = `${icon('check', 18)}<span>${me.formEndpoint ? 'Sent — thank you, I’ll be in touch soon.' : 'Opening your mail app — just hit send.'}</span>`;
    playIcon(statusEl.querySelector('svg'));
    statusEl.classList.add('is-ok');
  } catch {
    statusEl.classList.remove('is-ok');
    statusEl.textContent = `Couldn’t send. Please email ${me.email} directly.`;
  } finally {
    sendBtn.disabled = false; sendLabel.textContent = 'Send message';
  }
});

/* ── intro: counter → reveal ────────────────────────────────── */
const counter = { v: 0 };
const countEl = $('#loaderCount');
const tl = gsap.timeline({ delay: 0.2 });
tl.to(counter, {
  v: 100, duration: reduced ? 0.3 : 1.8, ease: 'power2.inOut',
  onUpdate: () => (countEl.textContent = String(Math.round(counter.v)).padStart(3, '0')),
})
  .to('#loader', { yPercent: -100, duration: 1, ease: 'power4.inOut' })
  .add(() => {
    document.body.classList.remove('is-loading');
    lenis.start();
    scrollAnimations();
  }, '-=0.5')
  .add(() => world && gsap.to(world, { intro: 1, duration: 2.2, ease: 'power3.out' }), '-=0.9')
  .from('.hero .w > span', { yPercent: 115, duration: 1.4, ease: 'power4.out', stagger: 0.12 }, '-=0.9')
  .from('.hero__status, .hero__intro, .scrollcue, .nav > *', { y: 20, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.08 }, '-=0.8')
  .set('#loader', { display: 'none' });

// refresh trigger positions once fonts settle (layout shifts otherwise)
document.fonts?.ready.then(() => { ScrollTrigger.refresh(); world?.measure(); });
