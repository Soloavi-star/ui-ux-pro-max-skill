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
2. **Îlots Preact** (~4 Ko) uniquement pour le panier, le choix de taille et « Elle me va ? ». L'histoire au scroll et le drop sont en JavaScript natif, sans librairie.
   - Les îlots se chargent après la page. Un ajout au panier fait avant que le panier soit prêt est mis en file d'attente (`addToCart`), et un appui sur le panier ou sur « Elle me va ? » est rejoué dès que l'îlot démarre : aucun geste n'est perdu sur un téléphone lent.
3. **Les données produit** sont validées par un schéma à la compilation (collections de contenu Astro).
   - Source par défaut : `src/data/products.json`.
   - Si `SHEET_CSV_URL` est défini, le catalogue est lu depuis le Google Sheet publié en CSV. La gérante modifie le Sheet ; une recompilation planifiée (GitHub Actions, toutes les heures) ou un lien de déploiement met le site à jour.
4. **Commande** : le panier est stocké dans `localStorage`. La commande devient un message WhatsApp pré-rempli (`wa.me`) : articles, tailles, commune, frais de livraison, total, origine de la visite.
5. **Le drop du vendredi** (rétention). Une pièce peut avoir une date `drop` : dans le catalogue, ou dans la colonne `drop` du Google Sheet (`09/10/2026`, `09/10/2026 18h30`, ou `non` pour publier tout de suite).
   - Avant l'heure, la pièce est absente de la boutique, des suggestions et du sitemap. Sa page existe, verrouillée (`noindex`, bouton « Préviens-moi »).
   - L'accueil montre un compte à rebours et des aperçus flous (image de 24 px). Les vraies fiches sont dans des `<template>` : ni nom ni photo ne sont téléchargés avant l'heure.
   - À l'heure pile, l'ouverture se fait dans le navigateur, sur l'horloge de la visiteuse. La recompilation suivante range ensuite les pièces dans la boutique, avec le badge « Nouveau » pendant 7 jours.
   - Heure d'Abidjan = UTC toute l'année. Réglages dans `DROP` (`src/config.ts`) : jour, heure, lien de la chaîne WhatsApp.
   - Maquette uniquement : `"drop": "prochain"` vise le vendredi suivant la compilation, et `/?demo-drop` répète l'ouverture 10 secondes après le chargement, pour la présentation à la boutique. En production, `"prochain"` fait échouer la compilation : il faut une vraie date.
6. **« Elle me va ? »** (conversion et acquisition). Sur une fiche produit, la cliente choisit jusqu'à 3 pièces (celle-ci, puis ses pièces vues récemment) et envoie à une amie le lien `/avis?p=id1,id2&de=Prénom&utm_source=amie`.
   - L'amie vote sur une page de nuit ; sa réponse repart sur WhatsApp. Elle est enregistrée comme cliente venue par « amie », et ses commandes le diront à la boutique.
   - Tout passe par le lien : pas de serveur, pas de données stockées. Les identifiants inconnus sont ignorés et le prénom est nettoyé puis inséré en texte (`textContent`) : un lien piégé ne peut rien injecter. La page est `noindex`.
7. **Motion** : propriétés `transform`, `opacity` et `clip-path` uniquement, courbes `ease-out` maison, et `prefers-reduced-motion` respecté partout.
8. **Qualité, vérifiée à chaque changement** (`npm run verify`) :
   - typage (`astro check`) ;
   - tests de bout en bout Playwright, en format téléphone (390 px) et ordinateur ;
   - accessibilité (axe-core, aucune violation sérieuse ou critique) ;
   - budget de poids : JavaScript ≤ 40 Ko compressé sur l'accueil, ≤ 25 Ko sur une fiche produit et sur la page de l'amie ;
   - l'ouverture du drop est testée avec une horloge simulée (avant, à l'heure pile, page ouverte après l'heure).

## Arborescence

```
src/
  config.ts             contacts, zones de livraison, réglages boutique
  content.config.ts     schéma produit (zod)
  data/products.json    catalogue par défaut
  lib/                  format FCFA, messages WhatsApp, Google Sheet, dates du drop (drop.ts), liens « Elle me va ? » (avis.ts)
  layouts/Base.astro    <head>, SEO, police, jetons de design
  components/           Story, DropSection, DropBand, ProductCard, SizePicker / Cart / AvisSheet (îlots)…
  scripts/drop.ts       compte à rebours et ouverture du drop dans le navigateur
  pages/                index, boutique, produit/[slug], avis (page de l'amie), pieces.json, legal…
  styles/global.css     palette et typographie de la direction artistique « Samedi soir »
scripts/make-og.mjs     images de partage WhatsApp (public/og.jpg, public/og-avis.jpg)
tests/                  Playwright (parcours, accessibilité, budget de poids)
```

## Ce qui reste hors périmètre (options)

Paiement mobile money en ligne, back-office complet, relances SMS.
