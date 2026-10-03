import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { AVIS_MAX, askMessage, avisUrl, cleanName } from "../lib/avis";
import { fcfa, waShare } from "../lib/shop";
import type { Piece } from "../lib/pieces";

// « Elle me va ? » — bottom sheet that turns hesitation into a question to a friend.
// The visitor picks up to 3 pieces (this one, then what she viewed recently), the link
// carries the rest. Opens from any [data-open-avis] button on the page.

const SEEN = "sm-vus", NAME = "sm-prenom", INFO = "sm-info";
const read = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d; } catch { return d; } };
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked */ } };

type Props = { current: Piece; site: string };
type Drag = { y: number; t: number; id: number; dy: number };

export default function AvisSheet({ current, site }: Props) {
  const [open, setOpen] = useState(false);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [seen, setSeen] = useState<string[]>([]);
  const [picked, setPicked] = useState<string[]>([current.id]);
  const [name, setName] = useState("");
  const [hint, setHint] = useState("");
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const drag = useRef<Drag | null>(null);

  useEffect(() => {
    // Remember this view (most recent first) — the sheet offers these pieces next time.
    const before = read<string[]>(SEEN, []).filter((id) => id !== current.id);
    setSeen(before);
    write(SEEN, [current.id, ...before].slice(0, 8));
    setName(read<string>(NAME, "") || cleanName(read<{ name?: string }>(INFO, {}).name?.split(" ")[0]));
    fetch("/pieces.json").then((r) => (r.ok ? r.json() : [])).then(setPieces).catch(() => { /* offline: this piece only */ });
    const onClick = (e: MouseEvent) => {
      const t = (e.target as Element).closest?.("[data-open-avis]");
      if (t) { opener.current = t as HTMLElement; setHint(""); setOpen(true); }
    };
    document.addEventListener("click", onClick);
    const w = window as Window & { smAvisReady?: boolean; smEarlyAvis?: HTMLElement };
    w.smAvisReady = true;
    if (w.smEarlyAvis) { opener.current = w.smEarlyAvis; w.smEarlyAvis = undefined; setOpen(true); } // tapped before hydration
    return () => document.removeEventListener("click", onClick);
  }, []);

  // Dialog behaviour: focus inside, Escape, Tab kept in the sheet, scroll lock, focus return
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => panel.current?.querySelector<HTMLElement>("[data-first]")?.focus());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key !== "Tab" || !panel.current) return;
      const f = panel.current.querySelectorAll<HTMLElement>("button, a[href], input");
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; removeEventListener("keydown", onKey); opener.current?.focus(); };
  }, [open]);

  // This piece, then the ones she viewed, then the same kind of piece: hesitation is usually robe vs robe.
  const row = useMemo(() => {
    const now = Date.now();
    const ok = pieces.filter((p) => p.id !== current.id && !p.soldOut && !(p.drop && p.drop > now));
    const byId = new Map(ok.map((p) => [p.id, p]));
    const recent = seen.map((id) => byId.get(id)).filter((p): p is Piece => !!p);
    const rest = ok.filter((p) => !seen.includes(p.id)).sort((a, b) => Number(b.cat === current.cat) - Number(a.cat === current.cat));
    return [current, ...recent, ...rest].slice(0, 7);
  }, [pieces, seen]);

  const toggle = (id: string) => {
    if (picked.includes(id)) { setPicked(picked.filter((x) => x !== id)); setHint(""); return; }
    if (picked.length >= AVIS_MAX) { setHint(`${AVIS_MAX} pièces maximum : retire-en une d'abord.`); return; }
    setPicked([...picked, id]);
    setHint("");
  };

  const url = avisUrl(site, picked, name);
  const message = askMessage(picked.length, url);
  const full = picked.length >= AVIS_MAX;

  // Drag the top of the sheet down to close it: follows the finger, flick or 25 % closes.
  const onDown = (e: PointerEvent) => {
    if (drag.current || (e.target as Element).closest("button")) return;
    drag.current = { y: e.clientY, t: performance.now(), id: e.pointerId, dy: 0 };
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    panel.current!.style.transition = "none";
  };
  const onMove = (e: PointerEvent) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    const raw = e.clientY - d.y;
    d.dy = raw > 0 ? raw : -Math.sqrt(-raw) * 2; // friction above the resting position, not a wall
    panel.current!.style.transform = `translateY(${d.dy}px)`;
  };
  const onUp = (e: PointerEvent) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    drag.current = null;
    const el = panel.current!;
    el.style.transition = "";
    el.style.transform = ""; // the class transform takes over from where the finger left it
    const velocity = d.dy / (performance.now() - d.t);
    if (d.dy > el.offsetHeight * 0.25 || (d.dy > 10 && velocity > 0.11)) setOpen(false);
  };

  return (
    <>
      <div class={`sh-scrim${open ? " on" : ""}`} onClick={() => setOpen(false)} aria-hidden="true" />
      <div ref={panel} class={`sh${open ? " on" : ""}`} role="dialog" aria-modal="true" aria-labelledby="avis-title" aria-hidden={!open} inert={!open}>
        <div class="sh-top" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          <span class="sh-grab" aria-hidden="true" />
          <div class="sh-head">
            <h2 id="avis-title">Elle me va ?</h2>
            <button type="button" class="x" aria-label="Fermer" onClick={() => setOpen(false)} data-first>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>
          <p class="sh-sub">Envoie {picked.length > 1 ? "tes pièces" : "la pièce"} à une copine : elle te répond en un geste, sur WhatsApp.</p>
        </div>

        <div class="sh-body">
          <p class="sh-k" id="avis-pick">Tu hésites avec une autre ? <span>{picked.length}/{AVIS_MAX}</span></p>
          <div class="sh-row" role="group" aria-labelledby="avis-pick">
            {row.map((p) => {
              const on = picked.includes(p.id);
              return (
                <button type="button" class="sh-th" key={p.id} aria-pressed={on} aria-disabled={!on && full} onClick={() => toggle(p.id)}>
                  <img src={p.thumb} alt="" width="84" height="112" loading="lazy" decoding="async" />
                  <span class="sh-th-n">{p.name}</span>
                  <span class="sh-th-p">{fcfa(p.price)}</span>
                  <span class="sh-check" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3"><path d="m5 12 5 5 9-10" /></svg>
                  </span>
                </button>
              );
            })}
          </div>
          <p class="sh-hint" aria-live="polite">{hint}</p>

          <label class="field" for="avis-name">
            <span>Ton prénom <small>(facultatif, pour que ta copine le voie)</small></span>
            <input id="avis-name" autoComplete="given-name" maxLength={24} value={name} onInput={(e) => setName((e.target as HTMLInputElement).value)} />
          </label>

          <p class="sh-k">Ce que ta copine reçoit</p>
          <div class="sh-bubble" data-preview>
            <p>{message.slice(0, message.lastIndexOf("\n"))}</p>
            <span>{url}</span>
          </div>
        </div>

        <div class="sh-f">
          <a class="btn btn-wa" href={picked.length ? waShare(message) : "#avis-pick"} target={picked.length ? "_blank" : undefined} rel="noopener"
            onClick={(e) => {
              if (!picked.length) { e.preventDefault(); setHint("Choisis au moins une pièce."); return; }
              write(NAME, cleanName(name));
              setOpen(false);
            }}>
            Envoyer à une copine sur WhatsApp
          </a>
        </div>
      </div>
    </>
  );
}
