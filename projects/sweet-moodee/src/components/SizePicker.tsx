import { useState } from "preact/hooks";
import { SIZES, fcfa, waLink, waShare, type Size, type Stock } from "../lib/shop";

type Props = { id: string; name: string; price: number; stock: Stock; url: string };

export default function SizePicker({ id, name, price, stock, url }: Props) {
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
    dispatchEvent(new CustomEvent("sm:add", { detail: { id, name, price, size, qty: 1 } }));
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
      <a class="sp-share" href={waShare(`Regarde cette pièce chez Sweet Moodee : ${name} — ${fcfa(price)}\n${url}`)} target="_blank" rel="noopener">
        Envoyer à une amie
      </a>
    </div>
  );
}
