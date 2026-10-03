# Sweet Moodee — architecture

Site e-commerce mobile-first pour une boutique de mode à Abidjan. Les commandes passent par WhatsApp, avec paiement à la livraison.

## Contraintes qui guident les choix

| Contrainte | Conséquence |
|---|---|
| Clientes sur Android d'entrée de gamme, en 3G/4G, venant d'Instagram | Pages statiques, très peu de JavaScript, images optimisées, pas de WebGL |
| Ventes par WhatsApp, paiement à la livraison | Pas de paiement en ligne ni de comptes : un panier local qui compose un message WhatsApp |
| Budget de 200 000 à 250 000 FCFA, et la gérante doit gérer seule | Hébergement gratuit, stock et prix éditables depuis un Google Sheet |
| Acquisition par le partage et Google | Une vraie page par produit (URL propre), métadonnées, JSON-LD, sitemap |

## Décisions

1. **Astro 5, sortie 100 % statique.** HTML pré-rendu, zéro JavaScript par défaut, interactivité par îlots. Hébergement gratuit (Netlify, Vercel ou Cloudflare Pages).
2. **Îlots Preact** (~4 Ko) uniquement pour le panier et le choix de taille. L'histoire au scroll est en JavaScript natif, sans librairie.
3. **Les données produit** sont validées par un schéma à la compilation (collections de contenu Astro).
   - Source par défaut : `src/data/products.json`.
   - Si `SHEET_CSV_URL` est défini, le catalogue est lu depuis le Google Sheet publié en CSV. La gérante modifie le Sheet ; une recompilation planifiée (GitHub Actions, toutes les heures) ou un lien de déploiement met le site à jour.
4. **Commande** : le panier est stocké dans `localStorage`. La commande devient un message WhatsApp pré-rempli (`wa.me`) : articles, tailles, commune, frais de livraison, total, origine de la visite.
5. **Motion** : propriétés `transform`, `opacity` et `clip-path` uniquement, courbes `ease-out` maison, et `prefers-reduced-motion` respecté partout.
6. **Qualité, vérifiée à chaque changement** (`npm run verify`) :
   - typage (`astro check`) ;
   - tests de bout en bout Playwright, en format téléphone (390 px) et ordinateur ;
   - accessibilité (axe-core, aucune violation sérieuse ou critique) ;
   - budget de poids : JavaScript ≤ 40 Ko compressé sur l'accueil, ≤ 25 Ko sur une fiche produit.

## Arborescence

```
src/
  config.ts             contacts, zones de livraison, réglages boutique
  content.config.ts     schéma produit (zod)
  data/products.json    catalogue par défaut
  lib/                  format FCFA, message WhatsApp, source Google Sheet
  layouts/Base.astro    <head>, SEO, police, jetons de design
  components/           Story, ProductCard, SizePicker (îlot), Cart (îlot)…
  pages/                index, boutique, produit/[slug], legal…
  styles/tokens.css     palette et typographie de la direction artistique « Samedi soir »
tests/                  Playwright (parcours, accessibilité, budget de poids)
```

## Ce qui reste hors périmètre (options)

Paiement mobile money en ligne, back-office complet, relances SMS.
