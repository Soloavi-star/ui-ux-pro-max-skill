import { test, expect } from "@playwright/test";
import { fcfa, orderMessage, deliveryFee, lastPieces, available } from "../src/lib/shop";
import { parseCsv, toOverrides } from "../src/lib/sheet";
import { countdownParts, dateLabel, dayLabel, formatCountdown, nextWeeklyDrop, parseDropDate } from "../src/lib/drop";
import { askMessage, avisUrl, cleanName, parseAvis, voteMessage } from "../src/lib/avis";

// Pure logic: run once, not per device.
test.describe("logique boutique", () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== "phone", "unit tests run once"));

  test("format FCFA avec espaces normales", () => {
    expect(fcfa(36000)).toBe("36 000 FCFA");
    expect(fcfa(1500)).toBe("1 500 FCFA");
  });

  test("frais de livraison : commune, seuil de gratuité, commune inconnue", () => {
    expect(deliveryFee("Cocody", 30000)).toBe(1500);
    expect(deliveryFee("Bingerville", 30000)).toBe(3000);
    expect(deliveryFee("Cocody", 60000)).toBe(0);
    expect(deliveryFee("Nulle part", 30000)).toBeNull();
  });

  test("stock réel : tailles disponibles et dernière pièce", () => {
    const stock = { S: 0, M: 1, L: 3, XL: 0 };
    expect(available(stock)).toEqual(["M", "L"]);
    expect(lastPieces(stock)).toEqual(["M"]);
  });

  test("message de commande complet", () => {
    const msg = orderMessage({
      lines: [
        { id: "a", name: "Robe bustier corset", size: "M", qty: 1, price: 28000 },
        { id: "b", name: "Ensemble fleuri rouge", size: "S", qty: 2, price: 36000 },
      ],
      name: "Aya Kouassi", zone: "Yopougon", place: "Près de la pharmacie", source: "Instagram",
    });
    expect(msg).toContain("• Robe bustier corset — taille M — 1 × 28 000 FCFA");
    expect(msg).toContain("Sous-total : 100 000 FCFA");
    expect(msg).toContain("Livraison (Yopougon) : offerte");
    expect(msg).toContain("Total à payer à la livraison : 100 000 FCFA");
    expect(msg).toContain("Nom : Aya Kouassi");
    expect(msg).toContain("Commande depuis le site · Instagram");
  });

  test("Google Sheet : CSV avec guillemets, surcharges prix / stock / masquage", () => {
    const csv = 'id,price,S,M,L,XL,hidden\nrobe-a,30000,1,0,,2,\n"robe-b","",3,3,3,3,oui\n';
    const rows = parseCsv(csv);
    expect(rows).toHaveLength(2);
    const o = toOverrides(rows);
    expect(o.get("robe-a")).toEqual({ price: 30000, stock: { S: 1, M: 0, XL: 2 }, hidden: false });
    expect(o.get("robe-b")?.hidden).toBe(true);
    expect(o.get("robe-b")?.price).toBeUndefined();
  });

  test("drop : prochain vendredi 18 h (heure d'Abidjan = UTC)", () => {
    const at = (iso: string) => nextWeeklyDrop(new Date(iso), 5, 18).toISOString();
    expect(at("2026-10-03T10:00:00Z")).toBe("2026-10-09T18:00:00.000Z"); // samedi → vendredi suivant
    expect(at("2026-10-09T17:59:00Z")).toBe("2026-10-09T18:00:00.000Z"); // le jour même, avant l'heure
    expect(at("2026-10-09T18:00:00Z")).toBe("2026-10-16T18:00:00.000Z"); // pile à l'heure : déjà passé
    expect(at("2026-12-31T20:00:00Z")).toBe("2027-01-01T18:00:00.000Z"); // changement d'année
  });

  test("drop : dates saisies dans le Google Sheet", () => {
    const d = (v: string) => parseDropDate(v, 18)?.toISOString();
    expect(d("09/10/2026")).toBe("2026-10-09T18:00:00.000Z");
    expect(d("2026-10-09")).toBe("2026-10-09T18:00:00.000Z");
    expect(d("09/10/2026 20h30")).toBe("2026-10-09T20:30:00.000Z");
    expect(d("9/10/2026 18:00:00")).toBe("2026-10-09T18:00:00.000Z");
    expect(d("2026-10-09T18:00:00Z")).toBe("2026-10-09T18:00:00.000Z");
    expect(d("31/02/2026")).toBeUndefined();
    expect(d("vendredi")).toBeUndefined();
    expect(d("09/10/2026 25h")).toBeUndefined();
  });

  test("drop : compte à rebours et libellés", () => {
    expect(countdownParts(90_061_000)).toEqual({ d: 1, h: 1, m: 1, s: 1 });
    expect(countdownParts(400)).toEqual({ d: 0, h: 0, m: 0, s: 1 }); // une fraction de seconde reste « 1 s »
    expect(formatCountdown(5 * 86_400_000 + 3 * 3_600_000)).toBe("5 j 3 h");
    expect(formatCountdown(2 * 3_600_000 + 7 * 60_000)).toBe("2 h 07 min");
    expect(formatCountdown(65_000)).toBe("1 min 05 s");
    const fri = new Date("2026-10-09T18:00:00Z");
    expect(dateLabel(fri)).toBe("vendredi 9 octobre à 18 h");
    expect(dayLabel(fri, new Date("2026-10-03T12:00:00Z"))).toBe("Vendredi");
    expect(dayLabel(fri, new Date("2026-09-30T12:00:00Z"))).toBe("Vendredi 9 octobre");
  });

  test("Google Sheet : colonne drop (date, « non », vide)", () => {
    const o = toOverrides(parseCsv("id,drop\na,09/10/2026\nb,non\nc,\n"));
    expect(o.get("a")?.drop?.toISOString()).toBe("2026-10-09T18:00:00.000Z");
    expect(o.get("b")?.drop).toBeNull();
    expect(o.get("c")?.drop).toBeUndefined();
  });

  test("Elle me va ? : lien, lecture du lien, prénom nettoyé", () => {
    const url = avisUrl("https://sweetmoodee.com", ["robe-a", "robe-b"], "  Aïcha  ");
    expect(url).toBe("https://sweetmoodee.com/avis?p=robe-a,robe-b&de=A%C3%AFcha&utm_source=amie");
    const known = new Set(["robe-a", "robe-b", "robe-c", "robe-d"]);
    const r = parseAvis("?p=robe-a,inconnue,robe-a,robe-b,robe-c,robe-d&de=%3Cimg%20src%3Dx%3EAya", (id) => known.has(id));
    expect(r.ids).toEqual(["robe-a", "robe-b", "robe-c"]); // inconnues et doublons retirés, 3 maximum
    expect(r.name).toBe("img src=xAya"); // pas de balise possible
    expect(cleanName("Une très très longue phrase de prénom")).toHaveLength(24);
    expect(parseAvis("", (id) => known.has(id))).toEqual({ ids: [], name: "" });
  });

  test("Elle me va ? : messages WhatsApp", () => {
    expect(askMessage(2, "U")).toBe("Coucou ! J'hésite entre 2 tenues pour samedi 👀 Tu m'aides à choisir ?\nU");
    expect(askMessage(1, "U")).toContain("Elle me va, celle-là ?");
    expect(voteMessage({ name: "Robe A", url: "P" }, 2, "S")).toBe("Mon choix : Robe A 😍 Fonce pour samedi !\nP");
    expect(voteMessage({ name: "Robe A", url: "P" }, 1, "S")).toContain("Oui, fonce");
    expect(voteMessage(null, 1, "S")).toContain("Bof");
  });
});
