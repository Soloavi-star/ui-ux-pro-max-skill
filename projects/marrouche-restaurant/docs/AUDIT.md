# Audit qualité — site Marrouche v2 (4 octobre 2026)

Vérifications faites dans Chromium (Playwright), servi en HTTP local, sur les 4 pages.

## 1. Motion — filtre d'Emil (skills `find-animation-opportunities`, `animate`, `emil-design-eng`)

### Ce qui anime, et pourquoi

| # | Où | Fréquence | But | Recette |
| --- | --- | --- | --- | --- |
| 1 | Entrée de l'accueil (titre, boutons, arche) | Une fois par visite | Délice (budget « rare ») | CSS `@keyframes`, `opacity + translateY(14px)`, 720 ms `--ease-out`, décalage de 60 ms ; l'image se « matérialise » (`scale(1.04)` → 1) en 1 400 ms |
| 2 | Panier (bottom sheet) | Occasionnel | Continuité spatiale | `translateY(100%)` → 0 en 480 ms `--ease-drawer`, sortie en 280 ms ; glisser pour fermer, suivi 1:1, effet élastique au-dessus, fermeture si vitesse > 0,11 px/ms ou 30 % de la hauteur |
| 3 | « Ajouter » → sélecteur − 1 + | Dizaines par visite | Indication d'état | Fondu enchaîné 200 ms avec flou de 2 px pour masquer la superposition |
| 4 | Pastille « Ma commande » | Une fois par commande | Continuité spatiale | Entre par le bas, 480 ms `--ease-drawer` ; pas de rebond quand le nombre change |
| 5 | Révélations au défilement | Une fois par section | Éviter les apparitions brusques | `opacity + 16px`, 720 ms, une seule fois (IntersectionObserver) |
| 6 | Image « au charbon » | Une fois | Explication / délice | Recette Emil « image reveal » : `clip-path: inset(0 0 100% 0)` → `inset(0)`, 1 100 ms `--ease-in-out` |
| 7 | Appui sur tout élément pressable | Dizaines | Retour tactile | `scale(0.97)` en 160 ms (`0.94` sur les petites icônes) |
| 8 | Changement de page | Quelques fois | Continuité | View Transitions natives, fondu enchaîné de 220 ms, en-tête partagé |

### Rejeté volontairement

- **Changement de rubrique, recherche, filtre végé, mise à jour du compteur** : des dizaines de fois par visite, aucune animation.
- **Bandeau défilant de noms de plats en continu** : animation décorative continue, déconseillée par la règle UX « Continuous Animation ».
- **Parallaxe sur le hero** : aucune fonction, risque d'inconfort ; rien n'a été ajouté.
- **Rebond `back.out(1.4)` proposé par le preset GSAP** : pas de rebond sur l'interface.
- **Survols** : uniquement avec `(hover: hover) and (pointer: fine)`, jamais au toucher.

`prefers-reduced-motion` : fondus conservés, tous les déplacements retirés (hero, panier, pastille, toast, révélations, transitions de page).

## 2. Crash-test (skill `break-ui`)

Page de développement : `_dev-carte-pire-cas.html` (interrupteur Démo / Pire cas, `noindex`, à ne pas publier).
Jeu de données : `data/menu.worst.json` (nom de 90 caractères, mot insécable, nom en arabe, prix à 0, plateau à 1 250 000 FCFA, image cassée, quantité 41).

| # | Gravité | Donnée | Ce qui cassait | Correction |
| --- | --- | --- | --- | --- |
| 1 | Cassé | Total à 7 chiffres sur un écran de 320 px | La pastille « Ma commande » sortait de l'écran : impossible de la toucher | Largeur bornée à l'écran, total masqué sous 360 px |
| 2 | Moche | Nom long + sélecteur ouvert à 320 px | Le nom s'empilait un mot par ligne | Sous 520 px, le contrôle passe sous le texte |
| 3 | Cassé | Écran de 320 px | Le bouton « Végé » sortait de la barre | Recherche flexible, bouton réduit à l'icône (avec `aria-label`) |
| 4 | Moche | Prix 0 | « 0 FCFA » | Affiche « Offert » |
| 5 | Fragile | Texte agrandi à 200 % | Débordements horizontaux | Boutons qui passent à la ligne, `min-width: 0` sur les grilles, césure des titres ; reste 14–77 px sur les très grands titres à 390 px |
| — | Tenu | Image introuvable | Repli sur l'initiale du plat | — |
| — | Tenu | Rubrique à 1 plat | « 1 plat » (singulier correct) | — |
| — | Tenu | Nom en arabe | Sens de lecture correct, pas de débordement | — |

## 3. Accessibilité (axe-core 4, WCAG 2.1 A/AA + bonnes pratiques)

**0 violation** sur les 4 pages, à 390 px et à 1440 px, après correction de 4 points :
- contraste de l'heure dans la bulle WhatsApp ;
- contraste des compteurs de rubrique ;
- bandeau « Maquette » placé hors zone repère ;
- rôle `tabpanel` posé sur un `<form>`.

Également en place :
- lien d'évitement et focus visible ;
- piège de focus dans le panier et le menu mobile, fermeture par Échap ;
- labels visibles et erreurs sous le champ (`role="alert"`) ;
- cibles tactiles de 44 px minimum et champs en 16 px (pas de zoom sur iOS).

## 4. Performance (mobile, premier chargement, avant compression gzip)

| Page | Requêtes | Poids | CLS |
| --- | --- | --- | --- |
| Accueil | 18 | 722 Ko (images 479, polices 123, CSS 61, JS 27) | 0,000 |
| Carte | 13 | 542 Ko (HTML 270 dont JSON-LD des 207 plats ; vignettes chargées au défilement) | 0,000 |

En place :
- images WebP en 3 tailles avec `srcset`, image du hero préchargée, `width`/`height` déclarés ;
- polices auto-hébergées, 2 fichiers préchargés ;
- carte Google chargée seulement au clic ;
- zéro bibliothèque JavaScript.

Le HTML, le CSS et le JS se compressent d'environ 75 % une fois servis en gzip ou brotli.

## 5. Mobile natif (skill `mobile-native`)

- `viewport-fit=cover` et `env(safe-area-inset-*)` sur la barre d'actions et le panier ; unité `100svh` pour le hero.
- Pas de surbrillance au toucher, `touch-action: manipulation`, `user-select: none` uniquement sur les contrôles.
- `overscroll-behavior: contain` dans le panier ; carrousel natif avec `scroll-snap` ; champs en 16 px.
- **Reste à tester sur un vrai téléphone** : survol collant, clavier logiciel, encoche, sensation du glisser pour fermer. L'émulation ne les reproduit pas.

## 6. Accueil « expérience » (v3) — storytelling interactif

**Fil narratif :** une soirée chez Marrouche, de la braise à la table. Chaque chapitre se termine par une action.

| Chapitre | Interaction et motion | Action proposée |
| --- | --- | --- |
| Ouverture | Rideau ; « Ahlan wa sahlan » s'écrit de droite à gauche (`clip-path`), puis le rideau s'ouvre. Une fois par session, passable au premier geste, absent en mouvement réduit | — |
| 01 La braise | Braises en canvas poussées par la souris ; titre révélé mot par mot ; **épinglé n°1** : l'arche s'ouvre en plein écran | Composer ma table, Voir la carte |
| 02 Le mezzé | **Épinglé n°2** : galerie horizontale pilotée par le scroll, parallaxe des photos, barre de progression | Ajouter (panier) |
| 03 Le grill | Cartes empilées en `position: sticky` natif ; la précédente recule et s'assombrit (scrub) | Ajouter |
| 04 La broche | Typographie cinétique : le mot « Chawarma » défile avec le scroll ; le prix « dès 3 000 FCFA » se compte | Ajouter chawarma viande ou poulet |
| 05 Votre table | Configurateur selon les convives (1–12) et l'envie (Fraîcheur, Braise, Festin) ; les assiettes entrent et sortent en 140–320 ms | **Commander cette table** (remplit le panier), **Réserver pour N** |
| Preuve | Chiffres qui se comptent une seule fois : 4,1 / 3 256 / 207 / 500 | Lire les avis |
| Rétention | « Recommander » (dernière commande gardée en local), plat du jour par WhatsApp, Instagram | Revenir |
| Finale | Réservation express : jour, heure et personnes en chips, nom | Réserver sur WhatsApp |

**Garde-fous :**
- 2 sections épinglées au maximum, comme le recommande le preset GSAP de `ui-ux-pro-max`. Le grill utilise le `sticky` natif.
- Les gestes fonctionnels (ajouter, stepper, panier) restent instantanés ; le « délice » est réservé aux moments rares.
- Boutons magnétiques uniquement avec un pointeur fin, sur la propriété `translate` : l'appui `scale(0.97)` est préservé.
- Les braises s'arrêtent hors écran et quand l'onglet est caché.
- Mouvement réduit : pas de rideau, pas d'épinglage, pas de braises ; la galerie devient un carrousel natif.
- axe-core : 0 violation (390 px, 1440 px et mouvement réduit).

**Mesure :**
- `chapitre_vu` (profondeur de lecture du récit) ;
- `composer_convives`, `composer_envie`, `composer_commande` (valeur), `composer_reserver` ;
- `recommande_clic`, `optin_plat_du_jour`, `reservation_express`.
