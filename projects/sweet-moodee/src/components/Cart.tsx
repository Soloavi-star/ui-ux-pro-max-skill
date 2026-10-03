import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { SHOP, ZONES } from "../config";
import { deliveryFee, fcfa, orderMessage, takePending, waLink, type Line } from "../lib/shop";

const KEY = "sm-cart", INFO = "sm-info", SRC = "sm-source";
type Info = { name: string; zone: string; place: string };

const read = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d; } catch { return d; } };
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked */ } };

/** First-touch acquisition channel, written once (utm_source, then referrer). */
function captureSource() {
  try {
    if (localStorage.getItem(SRC)) return;
    const q = new URLSearchParams(location.search).get("utm_source");
    const r = document.referrer.toLowerCase();
    const s = q ?? (/instagram/.test(r) ? "Instagram" : /snapchat/.test(r) ? "Snapchat" : /tiktok/.test(r) ? "TikTok" : /facebook/.test(r) ? "Facebook" : /whatsapp/.test(r) ? "WhatsApp" : /google/.test(r) ? "Google" : "Site");
    localStorage.setItem(SRC, JSON.stringify(s));
  } catch { /* storage blocked */ }
}

export default function Cart() {
  const [lines, setLines] = useState<Line[]>([]);
  const [info, setInfo] = useState<Info>({ name: "", zone: "", place: "" });
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"cart" | "details">("cart");
  const [tried, setTried] = useState(false);
  const [toast, setToast] = useState("");
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const ready = useRef(false);

  // Hydrate from storage, wire page events
  useEffect(() => {
    setLines(read<Line[]>(KEY, []));
    setInfo(read<Info>(INFO, { name: "", zone: "", place: "" }));
    ready.current = true;
    captureSource();
    const add = (l: Line) => {
      setLines((cur) => {
        const i = cur.findIndex((x) => x.id === l.id && x.size === l.size);
        return i >= 0 ? cur.map((x, j) => (j === i ? { ...x, qty: Math.min(9, x.qty + 1) } : x)) : [...cur, l];
      });
      setToast(`${l.name} (${l.size}) ajouté au panier`);
    };
    const onClick = (e: MouseEvent) => {
      const t = (e.target as Element).closest?.("[data-open-cart]");
      if (t) { opener.current = t as HTMLElement; setStep("cart"); setTried(false); setOpen(true); }
    };
    const onAdd = (e: Event) => add((e as CustomEvent<Line>).detail);
    addEventListener("sm:add", onAdd);
    takePending().forEach(add); // taps that happened before this island hydrated
    const w = window as Window & { smEarlyCart?: HTMLElement };
    if (w.smEarlyCart) { opener.current = w.smEarlyCart; w.smEarlyCart = undefined; setOpen(true); }
    document.addEventListener("click", onClick);
    return () => { removeEventListener("sm:add", onAdd); document.removeEventListener("click", onClick); };
  }, []);

  useEffect(() => { if (ready.current) write(KEY, lines); }, [lines]);
  useEffect(() => { if (ready.current) write(INFO, info); }, [info]);

  // Header badge lives outside the island
  const count = lines.reduce((a, l) => a + l.qty, 0);
  useEffect(() => {
    document.querySelectorAll<HTMLElement>("[data-cart-count]").forEach((b) => { b.textContent = String(count); b.hidden = count === 0; });
    document.querySelectorAll<HTMLElement>("[data-open-cart]").forEach((b) => b.setAttribute("aria-label", `Ouvrir le panier, ${count} article${count > 1 ? "s" : ""}`));
  }, [count]);

  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(""), 3200); return () => clearTimeout(t); }, [toast]);

  // Dialog behaviour: focus, Escape, scroll lock, focus return
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => panel.current?.querySelector<HTMLElement>("[data-first]")?.focus());
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; removeEventListener("keydown", onKey); opener.current?.focus(); };
  }, [open]);

  const subtotal = lines.reduce((a, l) => a + l.price * l.qty, 0);
  const fee = deliveryFee(info.zone, subtotal);
  const left = Math.max(0, SHOP.freeDeliveryFrom - subtotal);
  const errors = { name: !info.name.trim(), zone: !ZONES.some((z) => z.name === info.zone) };
  const valid = !errors.name && !errors.zone;
  const source = read<string>(SRC, "Site");
  const message = useMemo(() => orderMessage({ lines, name: info.name, zone: info.zone, place: info.place, source }), [lines, info, source]);
  const setQty = (i: number, q: number) => setLines((cur) => (q <= 0 ? cur.filter((_, j) => j !== i) : cur.map((x, j) => (j === i ? { ...x, qty: Math.min(9, q) } : x))));

  return (
    <>
      <div class={`cart-scrim${open ? " on" : ""}`} onClick={() => setOpen(false)} aria-hidden="true" />
      <div ref={panel} class={`cart${open ? " on" : ""}`} role="dialog" aria-modal="true" aria-labelledby="cart-title" aria-hidden={!open} inert={!open}>
        <div class="cart-h">
          {step === "details"
            ? <button type="button" class="link" onClick={() => setStep("cart")} data-first>← Retour au panier</button>
            : <h2 id="cart-title">Ton panier {count > 0 && <span class="muted">({count})</span>}</h2>}
          <button type="button" class="x" aria-label="Fermer le panier" onClick={() => setOpen(false)} data-first={step === "cart" ? true : undefined}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>

        {count > 0 && (
          <div class="ship">
            <p>{left === 0 ? <><b>Livraison offerte</b> sur ta commande.</> : <>Plus que <b>{fcfa(left)}</b> pour la livraison offerte.</>}</p>
            <div class="bar"><i style={{ transform: `scaleX(${Math.min(1, subtotal / SHOP.freeDeliveryFrom)})` }} /></div>
          </div>
        )}

        {step === "cart" ? (
          <>
            <div class="cart-body">
              {lines.length === 0 ? (
                <div class="empty">
                  <p>Ton panier est vide.</p>
                  <a class="btn btn-dark" href="/boutique">Voir la boutique</a>
                </div>
              ) : lines.map((l, i) => (
                <div class="line" key={`${l.id}-${l.size}`}>
                  <div class="l-info">
                    <a href={`/produit/${l.id}`}><b>{l.name}</b></a>
                    <span class="muted">Taille {l.size} · {fcfa(l.price)}</span>
                  </div>
                  <div class="qty" role="group" aria-label={`Quantité pour ${l.name}`}>
                    <button type="button" onClick={() => setQty(i, l.qty - 1)} aria-label="Retirer un">−</button>
                    <output>{l.qty}</output>
                    <button type="button" onClick={() => setQty(i, l.qty + 1)} aria-label="Ajouter un">+</button>
                  </div>
                </div>
              ))}
            </div>
            <div class="cart-f">
              <div class="sum"><span>Sous-total</span><span>{fcfa(subtotal)}</span></div>
              <p class="muted small">Paiement à la livraison. Frais selon ta commune.</p>
              <button type="button" class="btn btn-main" disabled={!count} onClick={() => setStep("details")}>Continuer</button>
            </div>
          </>
        ) : (
          <form class="details" onSubmit={(e) => e.preventDefault()} noValidate>
            <div class="cart-body">
              <label class="field" for="co-name">
                <span>Ton prénom et nom</span>
                <input id="co-name" autoComplete="name" value={info.name} aria-invalid={tried && errors.name} onInput={(e) => setInfo({ ...info, name: (e.target as HTMLInputElement).value })} />
                {tried && errors.name && <em>Indique ton nom pour la livraison.</em>}
              </label>
              <label class="field" for="co-zone">
                <span>Commune de livraison</span>
                <select id="co-zone" value={info.zone} aria-invalid={tried && errors.zone} onChange={(e) => setInfo({ ...info, zone: (e.target as HTMLSelectElement).value })}>
                  <option value="">Choisir…</option>
                  {ZONES.map((z) => <option value={z.name} key={z.name}>{z.name} — {subtotal >= SHOP.freeDeliveryFrom ? "offerte" : fcfa(z.fee)}</option>)}
                </select>
                {tried && errors.zone && <em>Choisis ta commune.</em>}
              </label>
              <label class="field" for="co-place">
                <span>Repère ou adresse <small>(facultatif)</small></span>
                <input id="co-place" autoComplete="street-address" placeholder="Ex. : près de la pharmacie…" value={info.place} onInput={(e) => setInfo({ ...info, place: (e.target as HTMLInputElement).value })} />
              </label>
              <div class="recap">
                <div><span>Sous-total</span><span>{fcfa(subtotal)}</span></div>
                <div><span>Livraison</span><span>{fee === null ? "—" : fee === 0 ? "Offerte" : fcfa(fee)}</span></div>
                <div class="grand"><span>À payer à la livraison</span><span>{fcfa(subtotal + (fee ?? 0))}</span></div>
              </div>
            </div>
            <div class="cart-f">
              <a class="btn btn-wa" href={valid ? waLink(message) : "#co-name"} target={valid ? "_blank" : undefined} rel="noopener" data-order
                onClick={(e) => { if (!valid) { e.preventDefault(); setTried(true); } else setToast("WhatsApp s'ouvre avec ta commande. Ton panier reste enregistré ici."); }}>
                Envoyer la commande sur WhatsApp
              </a>
              <p class="muted small">Il ne reste qu'à appuyer sur Envoyer dans WhatsApp. Contact : {SHOP.whatsappDisplay}</p>
            </div>
          </form>
        )}
      </div>
      <div class={`toast${toast ? " on" : ""}`} role="status" aria-live="polite">
        {toast}
        {toast && !open && count > 0 && <button type="button" data-open-cart>Voir le panier</button>}
      </div>
    </>
  );
}
