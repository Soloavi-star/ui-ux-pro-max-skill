import { useEffect, useState } from "preact/hooks";
import { SHOP } from "../config";
import { formatCountdown } from "../lib/drop";
import { SIZES, addToCart, fcfa, waLink, type Size, type Stock } from "../lib/shop";

type Props = {
  id: string; name: string; price: number; stock: Stock; url: string;
  /** Pieces waiting for the Friday drop: locked until this time (ms), with a reminder link. */
  drop?: { at: number; label: string; notify: string };
};

/** The mockup's "?demo-drop" rehearsal unlocks drop pieces for the rest of the visit. */
const demoUnlocked = () => { try { return SHOP.isMockup && sessionStorage.getItem("sm-demo-drop") === "1"; } catch { return false; } };

export default function SizePicker({ id, name, price, stock, url, drop }: Props) {
  // Server render = locked (built before the drop); the browser decides with its own clock.
  const [left, setLeft] = useState<number | null>(drop ? null : 0);
  useEffect(() => {
    if (!drop) return;
    let t = 0;
    const tick = () => {
      const ms = demoUnlocked() ? 0 : drop.at - Date.now();
      setLeft(Math.max(0, ms));
      if (ms > 0) t = window.setTimeout(tick, 1000 - (Date.now() % 1000) + 10);
    };
    tick();
    return () => clearTimeout(t);
  }, []);
  const locked = left === null || left > 0;
  if (drop && locked) {
    return (
      <div class="sp sp-lock">
        <p class="sp-label">Le drop du vendredi</p>
        <p class="sp-lock-t">Disponible {drop.label}.</p>
        <p class="sp-lock-c" role="timer">{left === null ? "\u00a0" : `Encore ${formatCountdown(left)}`}</p>
        <a class="btn btn-wa sp-full" href={drop.notify} target="_blank" rel="noopener">Préviens-moi à l'ouverture</a>
      </div>
    );
  }
  return <Picker id={id} name={name} price={price} stock={stock} url={url} />;
}

function Picker({ id, name, price, stock, url }: Omit<Props, "drop">) {
  const avail = SIZES.filter((s) => (stock[s] ?? 0) > 0);
  const [size, setSize] = useState<Size | null>(avail.length === 1 ? avail[0] : null);
  const [hint, setHint] = useState("");
  const [added, setAdded] = useState(false);

  const requireSize = () => {
    if (size) return false;
    setHint("Choisis ta taille.");
    document.getElementById("sizes")?.animate(
      [{ transform: "translateX(0)" }, { transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "translateX(-3px)" }, { transform: "translateX(0)" }],
      { duration: 320, easing: "ease-out" },
    );
    return true;
  };

  const add = () => {
    if (added || requireSize()) return;
    addToCart({ id, name, price, size: size!, qty: 1 });
    try { navigator.vibrate?.(12); } catch { /* not supported */ }
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  const direct = size
    ? waLink(`Bonjour Sweet Moodee ! Je voudrais commander :\n• ${name} — taille ${size} — ${fcfa(price)}\n${url}\n\nPaiement à la livraison. Ma commune : …`)
    : undefined;
  const restock = (s: Size) => waLink(`Bonjour Sweet Moodee ! Pouvez-vous me prévenir quand « ${name} » sera de nouveau disponible en taille ${s} ?\n${url}`);
  const soldOut = avail.length === 0;

  return (
    <div class="sp">
      <div class="sp-head">
        <span class="sp-label">Taille{size ? ` · ${size}` : ""}</span>
        <a href="#guide-tailles" class="sp-guide">Guide des tailles</a>
      </div>
      <div class="sp-sizes" id="sizes" role="radiogroup" aria-label="Taille">
        {SIZES.map((s) => {
          const n = stock[s] ?? 0;
          return n > 0 ? (
            <button type="button" role="radio" aria-checked={size === s} class="sz" onClick={() => { setSize(s); setHint(""); }}>
              {s}
              {n === 1 && <span class="sz-last" aria-label="dernière pièce" />}
            </button>
          ) : (
            <a class="sz off" href={restock(s)} target="_blank" rel="noopener" aria-label={`Taille ${s} épuisée : être prévenue du retour`}>{s}</a>
          );
        })}
      </div>
      <p class="sp-hint" aria-live="polite">
        {hint || (size && stock[size] === 1 ? "Dernière pièce dans cette taille." : avail.length < SIZES.length ? "Taille épuisée ? Touche-la pour être prévenue de son retour." : "")}
      </p>

      {soldOut ? (
        <a class="btn btn-wa sp-full" href={waLink(`Bonjour Sweet Moodee ! « ${name} » est épuisé : pouvez-vous me prévenir s'il revient ?\n${url}`)} target="_blank" rel="noopener">Me prévenir du retour</a>
      ) : (
        <div class="sp-actions">
          <button type="button" class={`btn btn-dark sp-full morph${added ? " done" : ""}`} onClick={add}>
            <span class="m-a">Ajouter au panier</span>
            <span class="m-b" aria-hidden={!added}>Ajouté ✓</span>
          </button>
          <a class="btn btn-wa sp-full" href={direct ?? "#sizes"} target={direct ? "_blank" : undefined} rel="noopener"
            onClick={(e) => { if (requireSize()) e.preventDefault(); }}>
            Commander en 1 message WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}
