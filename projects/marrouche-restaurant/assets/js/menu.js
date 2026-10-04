/* Page carte : recherche, filtre végé, rubriques qui suivent le défilement.
   Filtrer et changer de rubrique arrive des dizaines de fois par visite : aucune animation ici. */
(() => {
  "use strict";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  const { track } = window.MarroucheUI;

  const input = $("[data-search]"), clear = $("[data-search-clear]"), veg = $("[data-veg]");
  const groups = $$("[data-group]"), empty = $("[data-empty]"), results = $("[data-results]");
  const rows = $$("[data-dish]").map((el) => ({ el, text: norm(el.dataset.search), veg: el.dataset.veg === "1" }));
  const cats = $("[data-cats]");
  let searchTimer;

  function apply() {
    const q = norm(input.value), onlyVeg = veg.getAttribute("aria-pressed") === "true";
    const words = q.split(/\s+/).filter(Boolean);
    rows.forEach((r) => { r.el.hidden = (onlyVeg && !r.veg) || !words.every((w) => r.text.includes(w)); });
    let total = 0;
    groups.forEach((g) => {
      const n = $$("[data-dish]:not([hidden])", g).length;
      total += n;
      g.hidden = n === 0;
      const chip = $(`[data-cat="${g.id}"]`, cats);
      chip.hidden = n === 0;
      $("span", chip).textContent = n;
      $("[data-count]", g).textContent = `${n} plat${n > 1 ? "s" : ""}`;
    });
    empty.hidden = total > 0;
    // garder les résultats sous les yeux : si on filtrait depuis le bas de la carte, on remonte au début
    const body = $(".menu-body"), gap = body.getBoundingClientRect().top - $("[data-menu-tools]").getBoundingClientRect().bottom;
    if (gap < 0) scrollBy({ top: gap, behavior: "instant" });
    clear.hidden = !input.value;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      results.textContent = q || onlyVeg ? `${total} plat${total > 1 ? "s" : ""} trouvé${total > 1 ? "s" : ""}` : "";
      if (q) track("menu_recherche", { q, resultats: total });
    }, 600);
  }
  input.addEventListener("input", apply);
  clear.addEventListener("click", () => { input.value = ""; apply(); input.focus(); });
  veg.addEventListener("click", () => {
    veg.setAttribute("aria-pressed", veg.getAttribute("aria-pressed") === "true" ? "false" : "true");
    track("menu_filtre_vege", { actif: veg.getAttribute("aria-pressed") });
    apply();
  });

  // Rubrique active = celle qui occupe le haut de l'écran sous les barres collantes
  const links = new Map($$("a[data-cat]", cats).map((a) => [a.dataset.cat, a]));
  function setCurrent(id) {
    links.forEach((a, key) => (key === id ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current")));
    const a = links.get(id);
    if (a) {
      const left = a.offsetLeft - cats.clientWidth / 2 + a.clientWidth / 2;
      cats.scrollTo({ left, behavior: "instant" });
    }
  }
  // Rubrique courante = la dernière dont le titre est passé sous les barres collantes
  const tools = $("[data-menu-tools]");
  let ticking = false, current = null;
  function spy() {
    ticking = false;
    const line = tools.getBoundingClientRect().bottom + 24;
    let id = null;
    for (const g of groups) { if (!g.hidden && g.getBoundingClientRect().top <= line) id = g.id; }
    id = id || (groups.find((g) => !g.hidden) || {}).id;
    if (id && id !== current) { current = id; setCurrent(id); }
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(spy); } }, { passive: true });
  spy();
  cats.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-cat]");
    if (a) track("menu_rubrique", { rubrique: a.dataset.cat });
  });

  // Mesure : la carte a vraiment été consultée (défilement au-delà de la première rubrique)
  const seen = new IntersectionObserver(([en]) => { if (en.isIntersecting) { track("menu_consulte"); seen.disconnect(); } });
  if (groups[1]) seen.observe(groups[1]);
})();
