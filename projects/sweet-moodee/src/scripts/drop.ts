// Le drop du vendredi, in the browser. Every [data-drop] element (home section, boutique band)
// counts down to its data-drop-at time, then switches to .is-live: the pieces built into
// <template>s are revealed on the minute, on the visitor's clock — no rebuild needed at 18:00.
import { DROP, SHOP } from "../config";
import { countdownParts, formatCountdown, nextWeeklyDrop } from "../lib/drop";

const DEMO_KEY = "sm-demo-drop";
// Mockup only: "?demo-drop" rehearses the reveal 10 seconds after the page opens.
const demo = SHOP.isMockup && new URLSearchParams(location.search).has("demo-drop");
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

for (const el of document.querySelectorAll<HTMLElement>("[data-drop]")) setup(el);

function setup(el: HTMLElement) {
  const tiles = Array.from(el.querySelectorAll<HTMLElement>("[data-tile]"));
  const reminder = tiles.length === 0 && el.dataset.pieces === "0";
  let at = Date.parse(el.dataset.dropAt!);
  if (reminder) at = nextWeeklyDrop(new Date(), DROP.weekday, DROP.hour).getTime(); // the visitor's week, not the build's
  const skew = demo && !reminder ? at - Date.now() - 10_000 : 0;
  const now = () => Date.now() + skew;
  const status = el.querySelector<HTMLElement>("[data-drop-status]");
  let timer = 0;
  let mounted = false;

  // Real cards go into the page a minute early so their photos are loaded at the reveal.
  const mount = () => {
    if (mounted) return;
    mounted = true;
    for (const tile of tiles) {
      const slot = tile.querySelector<HTMLElement>("[data-real]")!;
      slot.append((tile.querySelector("template") as HTMLTemplateElement).content.cloneNode(true));
      slot.querySelectorAll("img").forEach((img) => (img.loading = "eager"));
    }
  };

  const goLive = (instant: boolean) => {
    mount();
    if (demo) try { sessionStorage.setItem(DEMO_KEY, "1"); } catch { /* storage blocked */ }
    const reveal = () => {
      el.classList.add("is-live");
      for (const tile of tiles) {
        tile.querySelector("[data-real]")!.removeAttribute("inert");
        tile.querySelector("[data-teaser]")!.setAttribute("aria-hidden", "true");
      }
      if (status) status.textContent = `C'est l'heure : ${tiles.length} nouvelles pièces sont en ligne.`;
    };
    if (instant || calm) {
      el.classList.add("is-instant");
      reveal();
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove("is-instant")));
    } else {
      // Two frames: the freshly mounted cards must be painted at opacity 0 before they transition.
      requestAnimationFrame(() => requestAnimationFrame(reveal));
    }
  };

  const paint = (left: number) => {
    const p = countdownParts(left);
    const two = (n: number) => String(n).padStart(2, "0");
    el.querySelectorAll<HTMLElement>("[data-cd]").forEach((b) => {
      const k = b.dataset.cd as keyof typeof p;
      b.textContent = k === "d" ? String(p.d) : two(p[k]);
    });
    el.querySelectorAll<HTMLElement>("[data-cd-unit='d']").forEach((u) => (u.textContent = p.d > 1 ? "jours" : "jour"));
    el.querySelectorAll<HTMLElement>("[data-cd-text]").forEach((t) => (t.textContent = formatCountdown(left)));
  };

  let first = true;
  const tick = () => {
    clearTimeout(timer);
    let left = at - now();
    if (left <= 0 && reminder) { at = nextWeeklyDrop(new Date(now()), DROP.weekday, DROP.hour).getTime(); left = at - now(); }
    if (left <= 0) { paint(0); goLive(first); return; }
    first = false;
    paint(left);
    if (left <= 60_000 && tiles.length) mount();
    timer = window.setTimeout(tick, 1000 - (now() % 1000) + 10); // on the second, recomputed each time
  };
  tick();
  // Background tabs throttle timers: catch up the moment the visitor comes back.
  document.addEventListener("visibilitychange", () => { if (!document.hidden && !el.classList.contains("is-live")) tick(); });
}
