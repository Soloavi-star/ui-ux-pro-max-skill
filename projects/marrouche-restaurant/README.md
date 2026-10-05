# Marrouche — site officiel (proposition v2)

Restaurant libanais, Zone 4, Marcory (Abidjan). Site statique, mobile-first, sans framework, issu de l'audit numérique
du 4 octobre 2026.

| Page | Contenu |
| --- | --- |
| `index.html` | **Expérience** : récit au défilement en 5 chapitres (braise, mezzé, grill, broche, votre table), configurateur de table, recommande, réservation express — GSAP + ScrollTrigger auto-hébergés (`assets/vendor/`) |
| `menu.html` | Carte complète : 207 plats et prix FCFA, recherche, filtre végé, rubriques qui suivent le défilement, panier → WhatsApp |
| `reserver.html` | Réservation de table et devis de groupe → WhatsApp, avec récapitulatif en direct |
| `infos.html` | Livraison, à emporter, horaires, itinéraire, FAQ |

## Mettre à jour

- **Coordonnées, horaires, WhatsApp** : `assets/js/config.js` (champs « À VALIDER »).
- **Plats et prix** : `data/menu.json`, puis `python3 tools/build.py`. Le script régénère les pages, le JSON-LD et `assets/js/menu-data.js`.
- **Textes des pages** : `src/pages/*.html` et `src/partials/*.html`, puis `python3 tools/build.py`.
- **Couleurs, tailles, motion** : `assets/design-tokens.json`, puis
  `node ../../.claude/skills/design-system/scripts/generate-tokens.cjs --config assets/design-tokens.json -o assets/css/tokens.css`.

Les pages HTML à la racine sont générées : on ne les modifie pas à la main.

## Méthode (skills utilisés)

| Skill | Apport |
| --- | --- |
| `ui-ux-pro-max` | Design system (réglages 7/5/3) gardé dans `design-system/marrouche/MASTER.md` avec les décisions retenues ; recherches style, couleurs, typo, landing, UX, GSAP, icônes et guide HTML ; checklist avant livraison |
| `brand` | Couleurs relevées sur le logo existant ; charte `docs/brand-guidelines.md` (voix, termes bannis), validée par `inject-brand-context.cjs` |
| `design-system` | Tokens en 3 couches dans `assets/design-tokens.json`, générés par `generate-tokens.cjs` et contrôlés par `validate-tokens.cjs` (0 couleur en dur) |
| `design` / `ui-styling` | Direction artistique (arche libanaise, sections « nuit », grain) et CSS sans framework |
| `emil-design-eng` / `animate` | Filtre d'animation, courbes, durées, sorties plus rapides que les entrées, `scale(0.97)` à l'appui |
| `apple-design` | Panier à glisser pour fermer (vitesse, effet élastique), matériaux translucides, approche des lettres selon la taille |
| `mobile-native` | Zones sûres, `svh`, pas de surbrillance au toucher, champs en 16 px, `touch-action` |
| `find-animation-opportunities` | Liste de ce qui anime et de ce qui est refusé (voir `docs/AUDIT.md`) |
| `break-ui` | Jeu « pire cas », page `_dev-carte-pire-cas.html`, 5 problèmes corrigés |

## À valider avec la direction avant la mise en ligne

- [ ] Numéro d'appel unique et numéro WhatsApp Business
- [ ] Horaires de salle, de cuisine et de livraison, puis synchronisation avec Google Business Profile
- [ ] Zones, frais et délais de livraison ; moyens de paiement ; délai de confirmation des réservations
- [ ] Prix et disponibilités (relevés sur Instalacarte le 4/10/2026) ; descriptions courtes rédigées pour la maquette
- [ ] Logo officiel en vectoriel (la maquette utilise un logotype typographique provisoire)
- [ ] Shooting photo des plats signatures (les visuels d'ambiance sont des photos Unsplash)
- [ ] Domaine (exemple : `marroucheabidjan.com`) : `canonical`, `og:url`, sitemap et JSON-LD
- [x] Image de partage `assets/img/og-marrouche.jpg` (1200×630, générée depuis `tools/og.html`)
- [ ] Brancher GA4 ou GTM sur `window.dataLayer` (événements déjà envoyés)
- [ ] Supprimer `_dev-carte-pire-cas.html` et `assets/js/menu-data-pire-cas.js` du serveur de production

## Crédits

- Visuels d'ambiance : [Unsplash](https://unsplash.com/license), libres pour un usage commercial. Identifiants : 1748540459503,
  1730082460730, 1621851709622, 1637949385162, 1783696074463, 1771285119408, 1594266063697, 1699728088614, 1593001872095,
  1684864115205, 1692444866957, 1603360946369, 1777716003985.
- Photos des plats de la carte : carte Instalacarte de Marrouche (affichées depuis leur serveur, à remplacer par les fichiers HD du restaurant).
- Polices : Playfair Display, Karla, Aref Ruqaa (SIL Open Font License).
