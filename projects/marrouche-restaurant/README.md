# Marrouche — landing page officielle (phase 1)

Maquette fonctionnelle issue de l'audit numérique du 4 octobre 2026 (Zone 4, Marcory).
Un seul fichier `index.html`, sans dépendance ni build : il peut être hébergé tel quel.

## Ce que la page couvre (audit → fonctionnalité)

| Douleur de l'audit | Réponse dans la page |
| --- | --- |
| Parcours éclaté (Maps, réseaux, Instalacarte, téléphone) | Une seule page : menu, commande, réservation, accès |
| Commande manuelle par téléphone | Panier → message WhatsApp prérempli (plats, quantités, total, mode, adresse) |
| Réservation peu visible | Formulaire court → WhatsApp, plus un formulaire de devis pour les groupes |
| Plusieurs numéros | Un seul `phoneTel` et un seul `whatsapp` dans `CONFIG` |
| Horaires incohérents | Bloc horaires piloté par `CONFIG.hours` (masqué tant que les horaires ne sont pas validés) ; statut « ouvert / fermé » calculé en direct |
| Aucune mesure | Événements `dataLayer` : `click_appel`, `click_whatsapp`, `click_itineraire`, `reservation_envoyee`, `devis_groupe_envoye`, `ajout_panier`, `commande_whatsapp_envoyee`, `menu_consulte`, `menu_recherche`… |
| SEO local | Balises title et description, Open Graph, canonical, JSON-LD `Restaurant` |
| Mobile et réseau lent | Mobile-first, barre d'actions sous le pouce, carte Google chargée seulement au clic, aucun framework |

## À valider avec le gérant avant la mise en ligne

- [ ] Numéro d'appel unique et numéro WhatsApp Business (`CONFIG.phoneTel`, `CONFIG.whatsapp`)
- [ ] Horaires de salle, de cuisine et de livraison (`CONFIG.hours`), puis synchronisation avec Google Business Profile
- [ ] Zones de livraison, frais, minimum de commande et délais (section Livraison, badges « à confirmer »)
- [ ] Prix et disponibilités : le menu `MENU` reprend un extrait de la carte Instalacarte relevée le 4/10/2026
- [ ] Plats signatures (`SIGNATURES`) : remplacer par les meilleures ventes réelles
- [ ] Moyens de paiement (FAQ)
- [ ] Délai de confirmation des réservations
- [ ] Domaine (exemple : `marroucheabidjan.com`) : mettre à jour `canonical`, `og:url` et le JSON-LD
- [ ] Photos des plats : remplacer les cartes « Photo à venir » et le visuel du hero
- [ ] Brancher GA4 ou GTM sur `window.dataLayer`

## Principes de motion appliqués

- Animations uniquement là où elles servent : entrée du hero (une fois), révélation des sections (une fois), panier en bottom sheet.
- Aucune animation sur les actions fréquentes (filtres, recherche, ajout au panier : retour visuel immédiat seulement).
- `scale(0.97)` sur `:active` pour tous les éléments pressables ; survols limités à `(hover: hover) and (pointer: fine)`.
- Courbes personnalisées (`--ease-out`, `--ease-drawer`) ; sortie du panier plus rapide (260 ms) que l'entrée (460 ms).
- Uniquement `transform` et `opacity` ; transitions CSS interruptibles plutôt que keyframes pour le panier.
- `prefers-reduced-motion` : on garde les fondus et on retire tous les déplacements.
