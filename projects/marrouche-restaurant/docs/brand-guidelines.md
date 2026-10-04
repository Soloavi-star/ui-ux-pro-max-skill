# Marrouche — Charte de marque v1.0 (proposition)

> Structure issue du template du skill `brand`. Les couleurs sont relevées sur le logo existant (coq vert à crête rouge) et
> reliées aux tokens de `assets/design-tokens.json`. À valider avec la direction avant mise en ligne.

## Repères rapides

| Élément | Valeur |
| --- | --- |
| Primary Color | #C21F24 |
| Secondary Color | #0A6634 |
| Accent Color | #E19A2C |
| Titres | Playfair Display (500–800, italique pour les accents) |
| Texte | Karla (400–700) |
| Accent arabe | Aref Ruqaa 700 — uniquement « صحتين » (Sahtein) et « أهلاً وسهلاً » |
| Signature | **La table libanaise de Zone 4.** |

## 1. Couleurs

### Primary Colors

| Nom | Hex | Usage |
| --- | --- | --- |
| Grenade (rouge marque) | #C21F24 | Bouton principal « Commander », prix mis en avant, liens |
| Grenade Dark | #A11B1F | Survol et état pressé |
| Rouge logo | #E3262B | Logo et éléments graphiques uniquement (4,05:1 sur fond nuit : pas pour du petit texte) |

### Secondary Colors

| Nom | Hex | Usage |
| --- | --- | --- |
| Cèdre (vert marque) | #0A6634 | Sur-titres, badges « végé », WhatsApp au survol |
| Vert logo | #089B4A | Logo, grands aplats, jamais pour du petit texte sur crème (3,3:1) |
| Vert WhatsApp marque | #077E3D | Boutons WhatsApp (5,2:1 avec du blanc) |

### Accent Colors

| Nom | Hex | Usage |
| --- | --- | --- |
| Braise | #E19A2C | Focus clavier, filets décoratifs |
| Braise Light | #EDB04F | Mots en italique sur fond nuit (9,7:1) |

### Neutral Palette

| Nom | Hex | Usage |
| --- | --- | --- |
| Tahini 100 | #FAF5EC | Fond de page |
| Tahini 50 | #FFFCF7 | Cartes, formulaires |
| Tahini 300 | #E6D8C3 | Filets |
| Charbon 900 | #17120F | Texte, sections « nuit » |
| Charbon 600 | #5A4C42 | Texte secondaire (7,6:1) |

### Accessibility

Toutes les paires texte/fond respectent WCAG AA (vérifié par calcul : texte 17,1:1 ; secondaire 7,6:1 ; blanc sur grenade 6,0:1 ;
blanc sur vert WhatsApp 5,2:1 ; texte crème sur nuit 17,1:1). Le vert et le rouge du logo restent réservés aux grands éléments.

## 2. Typographie

### Font Stack

```css
--font-heading: 'Playfair Display', Georgia, serif;
--font-body: 'Karla', system-ui, sans-serif;
--font-arabic: 'Aref Ruqaa', serif;
```

### Échelle

| Rôle | Police | Taille | Interlignage | Approche |
| --- | --- | --- | --- | --- |
| Hero | Playfair Display 700 | clamp(44px → 100px) | 0,98 | −0,028em |
| Titres de section | Playfair Display 700 | clamp(32px → 56px) | 1,06 | −0,018em |
| Sous-titres | Playfair Display 600 | 22–28px | 1,2 | 0 |
| Texte | Karla 400/500 | 16–17px | 1,6 | 0 |
| Sur-titres / labels | Karla 700 majuscules | 12px | 1,2 | +0,16em |

L'approche se resserre quand la taille grandit et s'ouvre sur les petits labels (principe Apple « tracking by size »).
Les polices sont auto-hébergées en WOFF2 (`assets/fonts/`), avec `font-display: swap`.

## 3. Logo

- **Logo officiel : à fournir en vectoriel (SVG/PDF).** La maquette utilise un logotype typographique provisoire et ne redessine pas le coq :
  on ne devine pas et on ne recolore pas un logo existant.
- Zone de protection : la hauteur de la crête tout autour. Taille minimale : 32px de haut à l'écran.
- À ne pas faire : déformer, ajouter des ombres, placer le coq vert sur un fond vert, ajouter des feuilles de menthe ou du texte autour
  (constaté sur plusieurs photos actuelles de la carte).

## 4. Voix et ton

### Brand Personality

| Trait | Nous sommes | Nous ne sommes pas |
| --- | --- | --- |
| **Généreux** | « Des mezzés à partager, des brochettes grillées à la demande. » | « Une symphonie de saveurs qui explose en bouche. » |
| **Chaleureux** | « Ahlan wa sahlan. Votre table vous attend. » | Distant ou administratif |
| **Direct** | « Commandez sur WhatsApp en 30 secondes. » | « N'hésitez pas à nous contacter pour toute demande. » |
| **Ancré** | « La table libanaise de Zone 4. » | Une adresse générique, sans lieu |

### Ton selon le contexte

| Contexte | Ton | Exemple |
| --- | --- | --- |
| Accueil | Fier, sensoriel | « Mezzés, braise et chawarma à la broche. » |
| Commande | Rapide, rassurant | « Votre commande s'ouvre dans WhatsApp, prête à envoyer. » |
| Réservation | Attentionné | « Anniversaire ? Dites-le-nous, on prépare la tablée. » |
| Erreur | Simple, avec une issue | « Indiquez un numéro pour qu'on puisse vous rappeler. » |

### Prohibited Terms

| Terme banni | Pourquoi |
| --- | --- |
| symphonie | Cliché présent dans toute la carte actuelle |
| explosion de saveurs | Cliché, ne dit rien du plat |
| plongez dans | Formule répétée, impersonnelle |
| expérience culinaire inégalée | Superlatif non vérifiable |
| le meilleur d'Abidjan | Promesse non vérifiable |

Ne jamais affirmer un fait non confirmé par la direction : date de création, labels, origine des produits.

## 5. Images

- **Ambiance :** lumière chaude et rasante, fonds sombres (ardoise, charbon, bois), vapeur et braise, prises de vue de 3/4 ou zénithales.
- **Cadre :** arche libanaise (haut arrondi) pour les visuels clés, en écho aux triples arcades des maisons traditionnelles.
- **Provisoire :** photos d'ambiance Unsplash (licence libre) en attendant le shooting des plats signatures ; photos de plats issues
  de la carte Instalacarte du restaurant pour le menu.
- **À éviter :** fonds colorés différents d'un plat à l'autre, logos incrustés dans les photos, détourages approximatifs.

## 6. Composants

| Composant | Règle |
| --- | --- |
| Boutons | Pilule, 52px de haut, `scale(0.97)` à l'appui, un seul bouton principal par écran |
| Cartes | Rayon 24px, image en tête, prix en chiffres tabulaires |
| Espacement | Échelle de 4 px : 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128 |
| Rayons | 8 · 14 · 24 · 32 · pilule |

## Historique

- v1.0 (4 octobre 2026) — première proposition, issue de l'audit numérique.
