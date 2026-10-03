import { test, expect } from "@playwright/test";
import { fcfa, orderMessage, deliveryFee, lastPieces, available } from "../src/lib/shop";
import { parseCsv, toOverrides } from "../src/lib/sheet";

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
});
