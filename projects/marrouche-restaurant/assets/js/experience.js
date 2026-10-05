/* =====================================================================
   Marrouche — expérience de la page d'accueil.
   GSAP + ScrollTrigger (2 sections épinglées maximum, règle ui-ux-pro-max),
   braises en canvas, configurateur de table, recommande, réservation express.
   Tout reste utilisable sans JS et avec « réduire les animations ».
   ===================================================================== */
(() => {
  "use strict";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const UI = window.MarroucheUI, CART = window.MarroucheCart;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const G = window.gsap, ST = window.ScrollTrigger;
  const motion = !reduce && G && ST;
  const nf = (n, d = 0) => n.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });

  /* =========================================================
     Braises : particules qui montent, poussées par le pointeur
     ========================================================= */
  class Embers {
    constructor(canvas, soft) {
      this.c = canvas; this.x = canvas.getContext("2d"); this.soft = soft;
      this.p = []; this.mouse = { x: -1e4, y: -1e4 }; this.running = false; this.alpha = 1;
      this.resize = this.resize.bind(this); this.tick = this.tick.bind(this);
      addEventListener("resize", this.resize, { passive: true }); this.resize();
      if (finePointer) canvas.parentElement.addEventListener("pointermove", (e) => {
        const r = canvas.getBoundingClientRect(); this.mouse.x = e.clientX - r.left; this.mouse.y = e.clientY - r.top;
      }, { passive: true });
      new IntersectionObserver(([en]) => (en.isIntersecting ? this.start() : this.stop())).observe(canvas);
      document.addEventListener("visibilitychange", () => (document.hidden ? this.stop() : this.start()));
    }
    resize() {
      const dpr = Math.min(devicePixelRatio || 1, 2), w = this.c.clientWidth, h = this.c.clientHeight;
      this.w = w; this.h = h; this.c.width = w * dpr; this.c.height = h * dpr; this.x.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(110, (w * h) / (this.soft ? 22000 : 12000)));
      while (this.p.length < n) this.p.push(this.spawn(true));
      this.p.length = n;
    }
    spawn(anywhere) {
      return { x: Math.random() * this.w, y: anywhere ? Math.random() * this.h : this.h + 10,
        r: 0.6 + Math.random() * 1.8, vy: 0.25 + Math.random() * 0.75, vx: 0, ph: Math.random() * 6.28,
        life: 0.4 + Math.random() * 0.6, hue: Math.random() < 0.18 ? 8 : 34 };
    }
    start() { if (!this.running) { this.running = true; requestAnimationFrame(this.tick); } }
    stop() { this.running = false; }
    tick(t) {
      if (!this.running) return;
      const { x: ctx, w, h, mouse } = this;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      for (const q of this.p) {
        const dx = q.x - mouse.x, dy = q.y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < 14000) { const f = (14000 - d2) / 14000; q.vx += (dx / 120) * f; q.vy += 0.04 * f; }
        q.vx *= 0.95; q.x += q.vx + Math.sin(t / 900 + q.ph) * 0.25; q.y -= q.vy;
        const a = Math.max(0, Math.min(1, q.y / h)) * q.life * this.alpha;
        if (q.y < -10 || a <= 0.01) Object.assign(q, this.spawn(false));
        const g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, q.r * 4);
        g.addColorStop(0, `hsla(${q.hue}, 95%, 66%, ${a})`); g.addColorStop(1, `hsla(${q.hue}, 95%, 50%, 0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q.x, q.y, q.r * 4, 0, 6.283); ctx.fill();
      }
      requestAnimationFrame(this.tick);
    }
  }
  const embers = reduce ? [] : $$("[data-embers]").map((c) => new Embers(c, c.classList.contains("embers--soft")));

  /* =========================================================
     Configurateur de table (moteur de conversion)
     ========================================================= */
  const composer = $("[data-composer]");
  if (composer) {
    const data = JSON.parse($("[data-composer-data]").textContent);
    const platesEl = $("[data-plates]"), out = $("[data-guests-out]");
    const totalEl = $("[data-composer-total]"), ppEl = $("[data-composer-pp]"), book = $("[data-composer-book]");
    let guests = 4, plan = [];

    const take = (pool, count, start = 0) => {
      const res = new Map();
      for (let i = 0; i < count; i++) { const it = pool[(start + i) % pool.length]; res.set(it.id, { ...it, q: (res.get(it.id)?.q || 0) + 1 }); }
      return [...res.values()];
    };
    function compose(n, mood) {
      const half = Math.ceil(n / 2), third = Math.ceil(n / 3);
      if (mood === "leger") return [...take(data.mezze, Math.min(n + 2, 14)), ...take(data.salade, Math.ceil(n / 4)), ...take(data.dessert, third, 1)];
      if (mood === "festin") return [...take(data.mezze, Math.min(n + 3, 16)), ...take(data.grill, n), ...take(data.dessert, half)];
      return [...take(data.mezze, Math.min(half + 2, 10)), ...take(data.grill, Math.max(1, Math.round(n * 0.75))), ...take(data.dessert, third, 1)];
    }
    function plateHTML(it) {
      const img = it.img ? `<img src="${it.img}" alt="" width="104" height="104" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : `<span>${it.name[0]}</span>`;
      return `<li class="plate" data-plate="${it.id}"><div class="plate__dish">${img}<b class="plate__qty" data-plate-qty>${it.q}</b></div><span class="plate__name">${it.name}</span></li>`;
    }
    function render(animate) {
      const mood = $('input[name="mood"]:checked', composer).value;
      plan = compose(guests, mood);
      out.value = guests; out.textContent = guests;
      $$("[data-guests]", composer).forEach((b) => (b.disabled = (+b.dataset.guests < 0 && guests <= 1) || (+b.dataset.guests > 0 && guests >= 12)));
      const total = plan.reduce((s, it) => s + it.price * it.q, 0);
      totalEl.textContent = nf(total) + " FCFA";
      ppEl.textContent = "≈ " + nf(Math.round(total / guests / 100) * 100) + " FCFA";
      book.href = `reserver.html?pax=${guests}`;
      book.textContent = `Réserver pour ${guests}`;
      // Plats : on garde ceux qui restent, on retire les autres, on fait entrer les nouveaux (indication d'état)
      const keep = new Set(plan.map((p) => p.id));
      const gone = $$("[data-plate]", platesEl).filter((li) => !keep.has(li.dataset.plate));
      const add = () => {
        gone.forEach((li) => li.remove());
        const fresh = [];
        plan.forEach((it, i) => {
          let li = $(`[data-plate="${it.id}"]`, platesEl);
          if (!li) { platesEl.insertAdjacentHTML("beforeend", plateHTML(it)); li = platesEl.lastElementChild; fresh.push(li); }
          else $("[data-plate-qty]", li).textContent = it.q;
          platesEl.appendChild(li); // ordre du plan
        });
        if (animate && motion && fresh.length) G.from(fresh, { opacity: 0, scale: 0.9, y: 10, duration: 0.32, ease: "power3.out", stagger: 0.035, clearProps: "all" });
      };
      if (animate && motion && gone.length) G.to(gone, { opacity: 0, scale: 0.94, duration: 0.14, ease: "power2.out", onComplete: add });
      else add();
    }
    composer.addEventListener("click", (e) => {
      const b = e.target.closest("[data-guests]");
      if (!b) return;
      guests = Math.max(1, Math.min(12, guests + +b.dataset.guests));
      render(true); UI.track("composer_convives", { convives: guests });
    });
    $$('input[name="mood"]', composer).forEach((r) => r.addEventListener("change", () => { render(true); UI.track("composer_envie", { envie: r.value }); }));
    $("[data-composer-order]").addEventListener("click", () => {
      plan.forEach((it) => CART.add(it.id, it.q, "composer"));
      const total = plan.reduce((s, it) => s + it.price * it.q, 0);
      UI.track("composer_commande", { convives: guests, valeur: total, envie: $('input[name="mood"]:checked', composer).value });
      CART.open();
    });
    book.addEventListener("click", () => UI.track("composer_reserver", { convives: guests }));
    render(false);
  }

  /* =========================================================
     Recommander (rétention)
     ========================================================= */
  const again = $("[data-reorder]"), last = CART && CART.lastOrder();
  if (again && last) {
    const MENU = window.MARROUCHE_MENU;
    const items = last.items.filter(([id]) => MENU[id]);
    $("[data-reorder-summary]").textContent =
      items.slice(0, 3).map(([id, q]) => `${q} × ${MENU[id][0]}`).join(", ") + (items.length > 3 ? "…" : "") +
      " · le " + new Date(last.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
    again.hidden = false;
    $("[data-reorder-btn]").addEventListener("click", () => { CART.replace(items); UI.track("recommande_clic"); CART.open(); });
  }

  /* =========================================================
     Réservation express
     ========================================================= */
  const qb = $("[data-quickbook]");
  if (qb) {
    const now = new Date(), days = [];
    for (let i = 0; i < 7 && days.length < 4; i++) {
      const d = new Date(now); d.setDate(now.getDate() + i);
      const wd = d.getDay();
      if (i < 2 || wd === 5 || wd === 6) days.push({ d, label: i === 0 ? "Ce soir" : i === 1 ? "Demain" : d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric" }) });
    }
    const times = ["12:30", "13:30", "19:30", "20:00", "20:30", "21:30"];
    $("[data-qb-days]").innerHTML = days.map((x, i) => `<label><input type="radio" name="qb-day" value="${i}" ${i === 0 ? "checked" : ""}><span>${x.label.replace(/^./, (c) => c.toUpperCase())}</span></label>`).join("");
    function renderTimes() {
      const dayIdx = +$('input[name="qb-day"]:checked', qb).value, isToday = dayIdx === 0;
      const prev = $('input[name="qb-time"]:checked', qb)?.value;
      const ok = times.filter((t) => !isToday || +t.slice(0, 2) * 60 + +t.slice(3) > now.getHours() * 60 + now.getMinutes() + 30);
      const list = ok.length ? ok : times;
      const pick = list.includes(prev) ? prev : list.includes("20:00") ? "20:00" : list[0];
      $("[data-qb-times]").innerHTML = list.map((t) => `<label><input type="radio" name="qb-time" value="${t}" ${t === pick ? "checked" : ""}><span>${t.replace(":", " h ")}</span></label>`).join("");
    }
    renderTimes();
    qb.addEventListener("change", (e) => { if (e.target.name === "qb-day") renderTimes(); });
    let pax = 2;
    qb.addEventListener("click", (e) => {
      const b = e.target.closest("[data-qb-pax]"); if (!b) return;
      pax = Math.max(1, Math.min(20, pax + +b.dataset.qbPax)); $("[data-qb-pax-out]").textContent = pax;
    });
    qb.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = $("#qb-name"), err = $("#qb-err");
      if (name.value.trim().length < 2) {
        err.innerHTML = '<svg class="icon"><use href="#i-alert"/></svg>Indiquez votre nom pour la réservation.';
        name.setAttribute("aria-invalid", "true"); name.focus(); return;
      }
      err.textContent = ""; name.removeAttribute("aria-invalid");
      const day = days[+$('input[name="qb-day"]:checked', qb).value], time = $('input[name="qb-time"]:checked', qb).value;
      const when = day.d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
      const msg = `Bonjour Marrouche, je souhaite réserver une table :\n• ${when} à ${time}\n• ${pax} personne${pax > 1 ? "s" : ""}\n• Nom : ${name.value.trim()}\n\nMerci de me confirmer.`;
      UI.track("reservation_express", { personnes: pax });
      window.open(UI.waUrl(msg), "_blank", "noopener");
      UI.toast("Votre demande est prête dans WhatsApp : il ne reste qu'à l'envoyer.");
    });
  }

  /* =========================================================
     Mise en scène (GSAP) — seulement si le mouvement est permis
     ========================================================= */
  const mezze = $(".xp-mezze");
  if (!motion) { if (mezze) mezze.classList.add("no-pin"); return; }
  G.registerPlugin(ST);
  const EASE_OUT = "power4.out"; // proche de --ease-out (0.23, 1, 0.32, 1)

  // Titres découpés en caractères (rideau)
  $$("[data-split-chars]").forEach((el) => { el.innerHTML = [...el.textContent].map((c) => `<span class="ch">${c}</span>`).join(""); });

  /* ---------- 01 · Entrée du hero ---------- */
  const words = $$(".xp-hero__title .word"), copy = $("[data-hero-copy]");
  const heroIn = G.timeline({ paused: true, defaults: { ease: EASE_OUT } })
    .from(words, { yPercent: 115, duration: 1.1, stagger: 0.07 })
    .from([$(".eyebrow", copy), $(".xp-hero__ctas", copy)], { opacity: 0, y: 16, duration: 0.8, stagger: 0.1 }, 0.35)
    .from("[data-hero-window] img", { scale: 1.18, duration: 1.8, ease: "power3.out" }, 0)
    .from(".xp-hero [data-embers]", { opacity: 0, duration: 1.6, ease: "none" }, 0.2)
    .from("[data-scroll-cue]", { opacity: 0, duration: 0.6 }, 1);

  /* ---------- Rideau d'ouverture (une fois par session, passable) ---------- */
  const curtain = $("[data-curtain]");
  let seen = false;
  try { seen = sessionStorage.getItem("marrouche-intro") === "1"; sessionStorage.setItem("marrouche-intro", "1"); } catch (_) {}
  if (curtain && !seen) {
    curtain.hidden = false;
    document.documentElement.style.overflow = "hidden";
    const intro = G.timeline({ onComplete: done })
      .fromTo(".curtain__ar", { clipPath: "inset(0% 0% 0% 100%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1, ease: "power2.inOut" }) // s'écrit de droite à gauche
      .from(".curtain__word .ch", { yPercent: 100, opacity: 0, duration: 0.6, stagger: 0.035, ease: EASE_OUT }, 0.45)
      .to(".curtain__mark", { opacity: 0, y: -12, duration: 0.35, ease: "power2.in" }, 1.55)
      .to(".curtain__half--top", { yPercent: -100, duration: 0.9, ease: "power4.inOut" }, 1.65)
      .to(".curtain__half--bottom", { yPercent: 100, duration: 0.9, ease: "power4.inOut" }, 1.65)
      .add(() => heroIn.play(), 1.85);
    const skip = () => { if (intro.progress() < 0.82) intro.seek(1.65); };
    ["pointerdown", "keydown", "wheel", "touchstart"].forEach((t) => addEventListener(t, skip, { once: true, passive: true }));
    function done() { curtain.remove(); document.documentElement.style.overflow = ""; ST.refresh(); }
  } else {
    if (curtain) curtain.remove();
    heroIn.play();
  }

  /* ---------- 01 · Le hero s'ouvre au défilement (épinglé n°1) ---------- */
  const mm = G.matchMedia();
  mm.add({ desktop: "(min-width: 1024px)", mobile: "(max-width: 1023px)" }, (ctx) => {
    // inset haut, droite, bas, gauche (%) puis rayons ; on calcule la forme nous-mêmes à chaque image
    // (le navigateur abrège la syntaxe de clip-path, ce qui fausse une interpolation de chaîne).
    const win = $("[data-hero-window]");
    const A = ctx.conditions.desktop ? [15, 8, 8, 58, 999, 24] : [48, 9, 3, 9, 999, 18];
    const shape = (p) => {
      const k = 1 - p, r = A[4] * k, rb = A[5] * k;
      return `inset(${A[0] * k}% ${A[1] * k}% ${A[2] * k}% ${A[3] * k}% round ${r}px ${r}px ${rb}px ${rb}px)`;
    };
    const s = { p: 0 };
    win.style.clipPath = shape(0);
    G.timeline({ scrollTrigger: { trigger: ".xp-hero", start: "top top", end: "+=110%", pin: "[data-hero-stage]", scrub: 0.6, anticipatePin: 1 } })
      .to(s, { p: 1, ease: "power2.inOut", duration: 1, onUpdate: () => (win.style.clipPath = shape(s.p)) }, 0)
      .to(copy, { y: -60, opacity: 0, ease: "power1.in", duration: 0.35 }, 0)
      .to("[data-hero-shade]", { opacity: 1, ease: "none", duration: 0.5 }, 0.35)
      .to("[data-scroll-cue]", { opacity: 0, duration: 0.2 }, 0)
      .to(".xp-hero [data-embers]", { opacity: 0.45, duration: 1 }, 0)
      .fromTo("[data-hero-after]", { opacity: 0, y: 40 }, { opacity: 1, y: 0, ease: "power2.out", duration: 0.35 }, 0.65);
    return () => { win.style.clipPath = ""; };
  });

  /* ---------- 02 · Mezzé horizontal (épinglé n°2) ---------- */
  const track = $("[data-htrack]"), bar = $("[data-hprogress]");
  const dist = () => Math.max(0, track.scrollWidth - innerWidth);
  const hTween = G.to(track, {
    x: () => -dist(), ease: "none",
    scrollTrigger: { trigger: "[data-hscroll]", start: "top top", end: () => "+=" + dist(), pin: true, scrub: 0.8, invalidateOnRefresh: true,
      onUpdate: (self) => { bar.style.transform = `scaleX(${self.progress})`; } },
  });
  $$(".panel__media img", track).forEach((img) => G.fromTo(img, { xPercent: -6 }, { xPercent: 6, ease: "none",
    scrollTrigger: { trigger: img, containerAnimation: hTween, start: "left right", end: "right left", scrub: true } }));
  $$(".panel--dish", track).forEach((p) => G.from(p, { scale: 0.93, ease: "power2.out",
    scrollTrigger: { trigger: p, containerAnimation: hTween, start: "left 95%", end: "left 60%", scrub: true } }));

  /* ---------- 03 · Cartes empilées : la précédente recule quand la suivante arrive ---------- */
  const cards = $$("[data-stack-card]");
  cards.forEach((card, i) => {
    const next = cards[i + 1]; if (!next) return;
    G.to(card, { scale: 0.92, "--dim": 0.55, ease: "none",
      scrollTrigger: { trigger: next, start: "top bottom", end: "top 20%", scrub: true } });
  });
  G.from(".xp-grill__head > *", { opacity: 0, y: 24, duration: 0.9, stagger: 0.08, ease: EASE_OUT, scrollTrigger: { trigger: ".xp-grill__head", start: "top 80%" } });

  /* ---------- 04 · Broche : le mot défile avec la page ---------- */
  G.fromTo("[data-kinetic]", { xPercent: 0 }, { xPercent: -28, ease: "none", scrollTrigger: { trigger: ".xp-broche", start: "top bottom", end: "bottom top", scrub: 0.5 } });
  G.fromTo(".xp-broche__media img", { yPercent: -6 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: ".xp-broche__media", start: "top bottom", end: "bottom top", scrub: true } });
  G.from(".xp-broche__copy > *", { opacity: 0, y: 24, duration: 0.9, stagger: 0.08, ease: EASE_OUT, scrollTrigger: { trigger: ".xp-broche__copy", start: "top 75%" } });

  /* ---------- Titres de section ---------- */
  $$(".xp-table__head, .xp-back__grid > div:first-child, .xp-finale__grid > div:first-child, .panel--intro").forEach((el) =>
    G.from(el.children, { opacity: 0, y: 28, duration: 0.9, stagger: 0.08, ease: EASE_OUT, scrollTrigger: { trigger: el, start: "top 82%" } }));

  /* ---------- Chiffres qui comptent (une fois) ---------- */
  $$("[data-count-to]").forEach((el) => {
    const to = +el.dataset.countTo, dec = +(el.dataset.countDec || 0), o = { v: 0 };
    el.textContent = nf(0, dec);
    ST.create({ trigger: el, start: "top 88%", once: true, onEnter: () =>
      G.to(o, { v: to, duration: 1.6, ease: "power2.out", onUpdate: () => (el.textContent = nf(o.v, dec)) }) });
  });

  /* ---------- Rail des chapitres ---------- */
  const rail = $("[data-chapters]");
  if (rail) {
    ST.create({ trigger: "#mezze", start: "top 60%", endTrigger: ".xp-table", end: "bottom 40%", onToggle: (s) => rail.classList.toggle("is-visible", s.isActive) });
    $$("[data-chapter]").forEach((sec) => ST.create({ trigger: sec, start: "top 50%", end: "bottom 50%", onToggle: (s) => {
      if (!s.isActive) return;
      $$("a", rail).forEach((a) => (a.dataset.chapterLink === sec.dataset.chapter ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current")));
      UI.track("chapitre_vu", { chapitre: sec.dataset.chapter });
    } }));
  }

  /* ---------- Boutons magnétiques (pointeur fin : décoratif, page marketing) ---------- */
  // ressort amorti sur la propriété CSS `translate` : n'écrase pas le `scale(0.97)` de l'appui
  if (finePointer) $$(".magnetic").forEach((el) => {
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
    const loop = () => {
      x += (tx - x) * 0.18; y += (ty - y) * 0.18;
      el.style.translate = `${x.toFixed(2)}px ${y.toFixed(2)}px`;
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.05 ? requestAnimationFrame(loop) : 0;
    };
    const go = () => { if (!raf) raf = requestAnimationFrame(loop); };
    el.addEventListener("pointermove", (e) => { const r = el.getBoundingClientRect(); tx = (e.clientX - r.left - r.width / 2) * 0.22; ty = (e.clientY - r.top - r.height / 2) * 0.3; go(); });
    el.addEventListener("pointerleave", () => { tx = 0; ty = 0; go(); });
  });

  addEventListener("load", () => ST.refresh());
})();
