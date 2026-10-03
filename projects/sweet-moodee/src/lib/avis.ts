/**
 * « Elle me va ? » — a visitor asks a friend which piece to take. Pure helpers
 * (no DOM), shared by the share sheet, the friend's page and the unit tests.
 * Everything travels in the link itself: no server, no account, no stored data.
 */

export const AVIS_MAX = 3;
/** First-touch source recorded for visitors who arrive through a friend. */
export const AVIS_SOURCE = "amie";

/** A first name as typed by the visitor: no control characters, no markup, 24 characters max. */
export function cleanName(v: string | null | undefined): string {
  return (v ?? "").replace(/[\u0000-\u001f\u007f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 24).trim();
}

/** The link the friend receives: /avis?p=id1,id2&de=Aya&utm_source=amie */
export function avisUrl(site: string | URL, ids: string[], name?: string): string {
  const n = cleanName(name);
  const p = ids.slice(0, AVIS_MAX).map(encodeURIComponent).join(",");
  return new URL(`/avis?p=${p}${n ? `&de=${encodeURIComponent(n)}` : ""}&utm_source=${AVIS_SOURCE}`, site).href;
}

/** Read a friend link. Unknown ids are dropped, duplicates removed, 3 pieces max. */
export function parseAvis(search: string, isKnown: (id: string) => boolean): { ids: string[]; name: string } {
  const q = new URLSearchParams(search);
  const ids = [...new Set((q.get("p") ?? "").split(",").map((s) => s.trim()))].filter((id) => id && isKnown(id)).slice(0, AVIS_MAX);
  return { ids, name: cleanName(q.get("de")) };
}

/** The message the visitor sends from her own WhatsApp (so the friend already knows who asks). */
export function askMessage(count: number, url: string): string {
  return count > 1
    ? `Coucou ! J'hésite entre ${count} tenues pour samedi 👀 Tu m'aides à choisir ?\n${url}`
    : `Coucou ! Elle me va, celle-là ? 👀 Dis-moi franchement.\n${url}`;
}

/** The friend's answer. `vote` is the chosen piece, or null for "not this one" on a single piece. */
export function voteMessage(vote: { name: string; url: string } | null, count: number, shopUrl: string): string {
  if (!vote) return `Bof 🤔 Pas fan de celle-là. Regarde plutôt les nouveautés :\n${shopUrl}`;
  return count > 1
    ? `Mon choix : ${vote.name} 😍 Fonce pour samedi !\n${vote.url}`
    : `Oui, fonce 😍 ${vote.name}, c'est validé pour samedi !\n${vote.url}`;
}
