/* =====================================================================
   Marrouche — comportements communs à toutes les pages.
   Sans dépendance. Panier conservé dans localStorage (confort uniquement).
   ===================================================================== */
(() => {
  "use strict";
  const CONFIG = window.MARROUCHE_CONFIG;
  const MENU = window.MARROUCHE_MENU || {};
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const fcfa = (n) => (n === 0 ? "Offert" : n.toLocaleString("fr-FR") + "\u202fFCFA");
  const waUrl = (msg) => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(CONFIG.mapsQuery)}`;

  /* ---------- Mesure : chaque action à forte valeur pousse un événement (GA4 / GTM) ---------- */
  window.dataLayer = window.dataLayer || [];
  const track = (event, params = {}) => window.dataLayer.push({ event, page: document.body.dataset.page, ...params });
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-track]");
    if (el) track(el.dataset.track, { source: el.dataset.src || "" });
  });

  /* ---------- Liens d'action ---------- */
  const external = (a, href) => { a.href = href; a.target = "_blank"; a.rel = "noopener"; };
  $$(".js-call").forEach((a) => (a.href = "tel:" + CONFIG.phoneTel));
  $$(".js-wa").forEach((a) => external(a, waUrl(a.dataset.msg || "Bonjour Marrouche,")));
  $$(".js-directions").forEach((a) => external(a, mapsUrl));
  $$("a.js-reviews").forEach((a) => { if (a.getAttribute("href") === "#") external(a, CONFIG.reviewsUrl); });
  $$("[data-phone-text]").forEach((el) => (el.textContent = CONFIG.phoneDisplay));
  $$("[data-updated]").forEach((el) => {
    el.dateTime = CONFIG.updated;
    el.textContent = new Date(CONFIG.updated + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  });

  /* ---------- Horaires ---------- */
  (function hours() {
    const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
    const today = new Date().getDay();
    const pending = '<span class="tbc">à confirmer</span>';
    $$("[data-hours-summary]").forEach((el) => {
      const h = CONFIG.hours && CONFIG.hours[today];
      el.innerHTML = CONFIG.hours ? (h ? `Aujourd'hui : ${h[0]} – ${h[1]}` : "Fermé aujourd'hui") : `Salle, cuisine et livraison ${pending}`;
    });
    $$("[data-hours] tbody").forEach((tb) => {
      if (!CONFIG.hours) { tb.innerHTML = `<tr><th scope="row">Salle, cuisine, livraison</th><td>${pending}</td></tr>`; return; }
      tb.innerHTML = [1, 2, 3, 4, 5, 6, 0].map((d) => {
        const h = CONFIG.hours[d];
        return `<tr class="${d === today ? "is-today" : ""}"><th scope="row">${days[d]}</th><td>${h ? h.join(" – ") : "Fermé"}</td></tr>`;
      }).join("");
    });
    $$("[data-hours-note]").forEach((el) => {
      el.textContent = CONFIG.hours ? "" : "Google indique « ouvert 24 h/24 » : les horaires officiels seront publiés ici puis synchronisés avec Google.";
    });
  })();

  /* ---------- En-tête : se matérialise dès qu'on quitte le haut de page ---------- */
  const header = $("[data-header]");
  if (header) {
    const sentinel = document.createElement("div");
    sentinel.style.cssText = "position:absolute;top:0;left:0;width:1px;height:72px;pointer-events:none";
    document.body.prepend(sentinel);
    new IntersectionObserver(([en]) => header.classList.toggle("is-solid", !en.isIntersecting)).observe(sentinel);
  }

  /* ---------- Piège de focus pour les surfaces modales ---------- */
  const focusables = (root) => $$('a[href], button:not([disabled]), input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])', root)
    .filter((el) => el.offsetParent !== null || el === document.activeElement);
  const trap = (root) => (e) => {
    if (e.key !== "Tab") return;
    const f = focusables(root); if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  /* ---------- Navigation mobile plein écran ---------- */
  const mnav = $("#mnav"), navOpen = $("[data-nav-open]");
  if (mnav && navOpen) {
    const onKey = (e) => { if (e.key === "Escape") closeNav(); else trapNav(e); };
    const trapNav = trap(mnav);
    function openNav() {
      mnav.hidden = false;
      requestAnimationFrame(() => mnav.classList.add("is-open"));
      navOpen.setAttribute("aria-expanded", "true");
      document.documentElement.style.overflow = "hidden";
      document.addEventListener("keydown", onKey);
      $("[data-nav-close]", mnav).focus({ preventScroll: true });
    }
    function closeNav() {
      mnav.classList.remove("is-open");
      navOpen.setAttribute("aria-expanded", "false");
      document.documentElement.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      setTimeout(() => { if (!mnav.classList.contains("is-open")) mnav.hidden = true; }, 220);
      navOpen.focus({ preventScroll: true });
    }
    navOpen.addEventListener("click", openNav);
    $("[data-nav-close]", mnav).addEventListener("click", closeNav);
    $$(".mnav__links a", mnav).forEach((a) => a.addEventListener("click", () => { if (a.hash) closeNav(); }));
  }

  /* ---------- Révélations au défilement (une seule fois) ---------- */
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
    }), { rootMargin: "0px 0px -12% 0px" });
    $$(".reveal, .reveal-clip").forEach((el) => io.observe(el));
  } else {
    $$(".reveal, .reveal-clip").forEach((el) => el.classList.add("is-in"));
  }

  /* ---------- Vignettes de la carte : repli sur l'initiale si l'image ne charge pas ---------- */
  document.addEventListener("error", (e) => {
    if (e.target.matches && e.target.matches("img[data-thumb]")) e.target.parentElement.classList.add("is-broken");
  }, true);

  /* ---------- Toast ---------- */
  const toastEl = $("[data-toast]");
  let toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    $("span", toastEl).textContent = msg;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-visible"), 4000);
  }
  window.MarroucheUI = { toast, track, waUrl, fcfa };

  /* ---------- Carte Google : chargée seulement à la demande (perf réseau mobile) ---------- */
  $$("[data-map-load]").forEach((btn) => btn.addEventListener("click", () => {
    const map = btn.closest("[data-map]");
    map.innerHTML = `<iframe title="Carte : Marrouche, Zone 4, Marcory" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent(CONFIG.mapsQuery)}&output=embed"></iframe>`;
    track("carte_affichee");
  }));

  /* =====================================================================
     PANIER
     ===================================================================== */
  const KEY = "marrouche-cart-v1";
  const cart = new Map();
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "[]");
    saved.forEach(([id, q]) => { if (MENU[id] && q > 0) cart.set(id, Math.min(q, 99)); });
  } catch (_) { /* stockage indisponible : panier en mémoire */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify([...cart])); } catch (_) {} };

  const pill = $("[data-cart-pill]"), sheet = $("[data-sheet]"), scrim = $("[data-scrim]");
  const linesEl = $("[data-cart-lines]");

  function addMarkup(id) {
    const name = MENU[id][0].replace(/"/g, "&quot;");
    return `<div class="add" data-add="${id}"><button class="add__btn" type="button" data-add-btn aria-label="Ajouter ${name} à la commande"><svg class="icon"><use href="#i-plus"/></svg><span>Ajouter</span></button><div class="add__step"><button type="button" data-dec aria-label="Retirer un ${name}"><svg class="icon"><use href="#i-minus"/></svg></button><output data-qty>0</output><button type="button" data-inc aria-label="Ajouter un autre ${name}"><svg class="icon"><use href="#i-plus"/></svg></button></div></div>`;
  }

  function totals() {
    let count = 0, sum = 0;
    cart.forEach((q, id) => { count += q; sum += q * MENU[id][1]; });
    return { count, sum };
  }

  function render() {
    // Contrôles « Ajouter » présents dans la page
    $$("[data-add]").forEach((el) => {
      const q = cart.get(el.dataset.add) || 0;
      el.classList.toggle("has-qty", q > 0);
      const out = $("[data-qty]", el); if (out) out.textContent = q;
    });
    const { count, sum } = totals();
    if (pill) {
      $("[data-cart-count]", pill).textContent = count;
      $("[data-cart-total-pill]", pill).textContent = count ? fcfa(sum) : "";
      pill.setAttribute("aria-label", `Ma commande : ${count} article${count > 1 ? "s" : ""}, ${fcfa(sum)}`);
      if (count && pill.hidden) { pill.hidden = false; requestAnimationFrame(() => requestAnimationFrame(() => pill.classList.add("is-visible"))); }
      if (!count) { pill.classList.remove("is-visible"); setTimeout(() => { if (!totals().count) pill.hidden = true; }, 480); }
    }
    const t = $("[data-cart-total]"); if (t) t.textContent = fcfa(sum);
  }

  function renderLines() {
    if (!linesEl) return;
    linesEl.innerHTML = [...cart].map(([id, q]) => `<div class="cart-line"><b>${MENU[id][0]}</b><span class="price">${fcfa(MENU[id][1] * q)}</span>${addMarkup(id)}</div>`).join("");
  }

  function setQty(id, q, source) {
    if (!MENU[id]) return;
    const before = cart.get(id) || 0;
    q = Math.max(0, Math.min(99, q));
    q ? cart.set(id, q) : cart.delete(id);
    save();
    if (q > before) track("ajout_panier", { plat: MENU[id][0], source });
    if (document.body.classList.contains("sheet-open")) {
      // mise à jour en place pour ne pas perdre le focus
      $$(".cart-line", linesEl).forEach((line) => {
        const lid = $("[data-add]", line).dataset.add;
        if (cart.has(lid)) { $(".price", line).textContent = fcfa(MENU[lid][1] * cart.get(lid)); return; }
        if (line.contains(document.activeElement)) $("[data-sheet-close]", sheet).focus({ preventScroll: true });
        line.remove();
      });
      if (!cart.size) closeSheet();
    }
    render();
  }

  document.addEventListener("click", (e) => {
    const ctrl = e.target.closest("[data-add]");
    if (!ctrl) return;
    const id = ctrl.dataset.add, q = cart.get(id) || 0;
    if (e.target.closest("[data-add-btn]")) {
      setQty(id, 1, ctrl.closest("[data-sheet]") ? "panier" : document.body.dataset.page);
      // le focus suit le contrôle qui vient d'apparaître
      requestAnimationFrame(() => $("[data-inc]", ctrl).focus({ preventScroll: true }));
    } else if (e.target.closest("[data-inc]")) setQty(id, q + 1, "stepper");
    else if (e.target.closest("[data-dec]")) {
      setQty(id, q - 1, "stepper");
      if (q - 1 === 0 && !ctrl.closest("[data-sheet]")) requestAnimationFrame(() => $("[data-add-btn]", ctrl).focus({ preventScroll: true }));
    }
  });

  /* ---------- Bottom sheet : ouverture, fermeture, glisser pour fermer ---------- */
  let lastFocus = null;
  const trapSheet = sheet ? trap(sheet) : null;
  const onSheetKey = (e) => { if (e.key === "Escape") closeSheet(); else trapSheet(e); };

  function openSheet() {
    if (!sheet || !cart.size) return;
    renderLines(); render();
    lastFocus = document.activeElement;
    document.body.classList.add("sheet-open");
    document.documentElement.style.overflow = "hidden";
    document.addEventListener("keydown", onSheetKey);
    $("[data-sheet-close]", sheet).focus({ preventScroll: true });
    track("panier_ouvert", { articles: totals().count });
  }
  function closeSheet() {
    if (!document.body.classList.contains("sheet-open")) return;
    sheet.style.transform = "";
    document.body.classList.remove("sheet-open");
    document.documentElement.style.overflow = "";
    document.removeEventListener("keydown", onSheetKey);
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
    else if (pill && !pill.hidden) pill.focus({ preventScroll: true });
  }
  if (pill) pill.addEventListener("click", openSheet);
  if (scrim) scrim.addEventListener("click", closeSheet);
  if (sheet) $("[data-sheet-close]", sheet).addEventListener("click", closeSheet);

  // Glisser vers le bas pour fermer (apple-design : suivi 1:1, élastique au-delà du haut, décision à la vitesse)
  const handle = $("[data-sheet-handle]");
  if (handle && sheet) {
    let drag = null;
    const rubber = (x, dim) => (x * dim * 0.55) / (dim + 0.55 * x);
    handle.addEventListener("pointerdown", (e) => {
      if (drag || e.button > 0 || e.target.closest("button")) return; // un seul doigt, pas sur le bouton fermer
      drag = { y0: e.clientY, t0: performance.now(), dy: 0, h: sheet.offsetHeight, id: e.pointerId, lastY: e.clientY, lastT: performance.now(), v: 0 };
      handle.setPointerCapture(e.pointerId);
      sheet.classList.add("is-dragging");
    });
    handle.addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const raw = e.clientY - drag.y0;
      drag.dy = raw >= 0 ? raw : -rubber(-raw, drag.h);
      const now = performance.now();
      drag.v = (e.clientY - drag.lastY) / Math.max(1, now - drag.lastT); // px/ms, vitesse instantanée
      drag.lastY = e.clientY; drag.lastT = now;
      sheet.style.transform = `translateY(${drag.dy}px)`;
    });
    const end = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const { dy, h, v } = drag;
      drag = null;
      sheet.classList.remove("is-dragging");
      if (dy > h * 0.3 || (dy > 8 && v > 0.11)) { track("panier_glisse_ferme"); closeSheet(); }
      else sheet.style.transform = "";
    };
    handle.addEventListener("pointerup", end);
    handle.addEventListener("pointercancel", end);
  }

  /* ---------- Envoi de la commande ---------- */
  const addrField = $("[data-addr-field]");
  const modeInputs = $$('input[name="cart-mode"]');
  modeInputs.forEach((r) => r.addEventListener("change", () => {
    addrField.hidden = $('input[name="cart-mode"]:checked').value !== "Livraison";
  }));
  const addr = $("#cart-addr"), addrErr = $("#cart-addr-err");
  if (addr) addr.addEventListener("input", () => { addrErr.textContent = ""; addrField.classList.remove("is-invalid"); addr.removeAttribute("aria-invalid"); });

  const sendBtn = $("[data-cart-send]");
  if (sendBtn) sendBtn.addEventListener("click", () => {
    const mode = $('input[name="cart-mode"]:checked').value;
    if (mode === "Livraison" && !addr.value.trim()) {
      addrErr.innerHTML = '<svg class="icon"><use href="#i-alert"/></svg>Indiquez un quartier ou un repère pour la livraison.';
      addrField.classList.add("is-invalid"); addr.setAttribute("aria-invalid", "true"); addr.focus();
      return;
    }
    const { sum, count } = totals();
    const lines = [...cart].map(([id, q]) => `• ${q} × ${MENU[id][0]} — ${fcfa(MENU[id][1] * q)}`);
    const name = $("#cart-name").value.trim();
    const msg = ["Bonjour Marrouche, je souhaite commander :", "", ...lines, "", `Total des plats : ${fcfa(sum)}`,
      `Mode : ${mode}`, mode === "Livraison" ? `Adresse : ${addr.value.trim()}` : null, name ? `Nom : ${name}` : null]
      .filter((l) => l !== null).join("\n");
    track("commande_whatsapp_envoyee", { valeur: sum, articles: count, mode });
    try { localStorage.setItem("marrouche-last-order", JSON.stringify({ items: [...cart], date: Date.now() })); } catch (_) {}
    window.open(waUrl(msg), "_blank", "noopener");
    toast("Votre commande est prête dans WhatsApp : il ne reste qu'à l'envoyer.");
  });

  // API pour les autres scripts (configurateur de table, recommander)
  window.MarroucheCart = {
    add(id, q = 1, source = "api") { setQty(id, (cart.get(id) || 0) + q, source); },
    replace(entries) { cart.clear(); entries.forEach(([id, q]) => { if (MENU[id] && q > 0) cart.set(id, Math.min(99, q)); }); save(); render(); },
    open: openSheet,
    lastOrder() { try { const o = JSON.parse(localStorage.getItem("marrouche-last-order") || "null"); return o && o.items.filter(([id]) => MENU[id]).length ? o : null; } catch (_) { return null; } },
  };

  render();
})();
