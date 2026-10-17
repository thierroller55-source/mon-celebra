# Traductions à valider

Ce document liste les traductions à faire relire par un locuteur natif (surtout le wolof).

## Statut

- **fr** : langue de référence, complète.
- **en** : première passe, à relire.
- **wo** : **premier jet** (orthographe CLAD), à faire valider par un locuteur natif de Wolof.

Fichiers : `frontend/src/i18n/messages/{fr,en,wo}.json`

## Points à vérifier en priorité (wolof)

- Salutations : `dashboard.greeting` (« Salaamaleekum, {name} ») — alternatives : « Nangadef ».
- Termes métier : `dashboard.*` (evenman, feeñ, denk), `editor.*` (afiis, bérab, kodu QR).
- `editor.locationType` : les types de lieu (`PLACE_TYPES`) restent en français pour l'instant.
- `poster.caption` : phrase affichée sous le QR code, importante (visible sur l'affiche imprimée).
- `errors.*` et messages d'erreur API.
- Unités / nombres : « 20 », « 3 Mo », « 8 Mo » — vérifier la formulation en wolof.

## Éléments non traduits (étape 2)

- Sections RSVP et livre d'or de la page publique (`RsvpSection`, `GuestbookSection`).
- Pages d'authentification (connexion, inscription, mot de passe, vérification email).
- Pages de création par catégorie et libellés des champs de `CategoryForm`.
- Espace admin (`AdminLayout` et pages `admin/*`).
- Pages légales et emails transactionnels (Brevo).
- Libellés des types de lieu (`utils/constants.js` → `PLACE_TYPES`).

## Règles

- Ne jamais afficher une clé brute : toute clé manquante en `wo`/`en` retombe sur `fr`.
- Le test `backend/test/i18n.parity.test.js` échoue si les 3 fichiers n'ont pas exactement les mêmes clés.
- Caractères wolof à contrôler : **ñ, ŋ, ó, é, ë, à** (vérifier leur rendu sur l'affiche canvas et dans l'UI).
