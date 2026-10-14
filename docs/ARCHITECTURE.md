# MON CELEBRA — Architecture technique

> « Chaque moment mérite d'être célébré. »
>
> Document maître de référence — Version 1.0 — Étape 1 (Architecture avant implémentation)
> Statut : **en attente de validation**

---

## 0. Décisions techniques et justifications

| Sujet | Décision | Pourquoi | Alternative écartée |
|---|---|---|---|
| Frontend | **React 18 + Vite + React Router v6** | Rapidité, écosystème, SPA simple à héberger, build léger | Next.js (SSR) : plus lourd à prendre en main, mais meilleur SEO public — voir note ci-dessous |
| Style | **Tailwind CSS + lucide-react** | Mobile-first, design system rapide, poids final faible | CSS modules / styled-components |
| Langage | **JavaScript (ESM) + JSX** | Public cible débutant/intermédiaire, pas de compilation de types à gérer | TypeScript (plus sûr mais courbe d'apprentissage + config) |
| Backend | **Node.js + Express** | API REST demandée par le prompt maître, très documenté | Next API routes (moins explicite pour un backend séparé) |
| Base de données | **MongoDB + Mongoose** | Schémas documentés, flexible pour catégories évolutives, geo index natif | PostgreSQL (plus rigide, mais relationnel solide) |
| Auth | **JWT (courte durée) + refresh token en cookie httpOnly + bcrypt** | Sécurité standard, découplage front/back | Sessions serveur (plus simple mais scaling/stateless moins souple) |
| Validation | **Zod** (backend et frontend) | Un seul langage de validation, messages clairs | Joi / express-validator |
| Images | **Multer (mémoire) + Sharp (compression/redimensionnement) + stockage abstrait** | Local par défaut, prêt pour Cloudinary/S3 plus tard | Upload direct Cloudinary (moins de contrôle serveur) |
| Cartes | **Leaflet + OpenStreetMap + Nominatim** | 100 % gratuit, sans clé API | Google Maps (payant au-delà du quota) |
| QR Code | **bibliothèque `qrcode` (npm)** | Gratuit, génération serveur PNG/SVG | Service externe |
| Email | **Nodemailer (SMTP) ou Resend/Brevo** — optionnel | Mot de passe oublié + notifications | Service payant |

**Note SEO (point d'attention importante) :** une SPA React classique rend son contenu côté client. Les moteurs de recherche et l'aperçu de lien **WhatsApp/Facebook** lisent surtout les balises HTML initiales. Or le prompt exige des **balises Open Graph dynamiques par événement** (titre, description, image). Solution retenue sans changer de framework : le backend expose une petite route `/e/:slug` qui renvoie un **HTML avec métadonnées Open Graph injectées** puis redirige vers la SPA. Alternative plus propre à terme : migrer le rendu public vers **Next.js**. Décision à valider à l'étape « Page publique / SEO ».

---

## 1. Architecture globale

```text
                      +-------------------------------------+
                      |        INVIE (mobile / desktop)      |
                      |  scan QR  /  clic lien / WhatsApp    |
                      +------------------+------------------+
                                         |
                       HTTPS             v
        +--------------------------------+---------------------------------+
        |                                                                   |
        |   FRONTEND (React + Vite + Tailwind)  — PWA-ready                 |
        |   - Espace public (page evenement /e/:slug)                       |
        |   - Espace organisateur (dashboard)                               |
        |   - Espace admin (/admin)                                         |
        +--------------------------------+---------------------------------+
                                         |  REST (JSON) + cookies httpOnly
                                         v
        +--------------------------------+---------------------------------+
        |   BACKEND (Node + Express)                                        |
        |   routes -> controllers -> services -> models                     |
        |   middleware: auth, role, validation(Zod), rate-limit,            |
        |               sanitize, upload, errorHandler                     |
        +----+---------------------+----------------------+---------------+
             |                     |                      |
             v                     v                      v
      +-------------+      +---------------+      +----------------------+
      | MongoDB     |      | Storage       |      | Services externes    |
      | (Atlas)     |      | local uploads/|      | Nominatim (geocode)  |
      | Mongoose    |      | ou Cloudinary |      | OSM tiles (Leaflet)  |
      +-------------+      +---------------+      | SMTP / Resend (opt)  |
                                                  +----------------------+
```

**Principe clé :** toute la logique sensible (autorisation, confidentialité, validation, modération) vit côté **backend**. Le frontend n'est jamais une source de vérité pour les droits.

---

## 2. Arborescence complète des dossiers

```text
mon-celebra/
├── docs/
│   ├── ARCHITECTURE.md              # ce document
│   ├── API.md                       # reference des routes (etape API)
│   └── DEPLOYMENT.md                # guide de deploiement (etape finale)
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.js               # chargement + validation des variables d'env
│   │   │   ├── db.js                # connexion Mongoose
│   │   │   └── constants.js         # categories, types de lieux, statuts, enums
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Event.js
│   │   │   ├── Rsvp.js
│   │   │   ├── GuestbookMessage.js
│   │   │   ├── Template.js
│   │   │   ├── Category.js
│   │   │   ├── Report.js
│   │   │   └── Notification.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── user.controller.js
│   │   │   ├── event.controller.js
│   │   │   ├── photo.controller.js
│   │   │   ├── public.controller.js
│   │   │   ├── rsvp.controller.js
│   │   │   ├── guestbook.controller.js
│   │   │   ├── template.controller.js
│   │   │   ├── category.controller.js
│   │   │   ├── qrcode.controller.js
│   │   │   ├── report.controller.js
│   │   │   └── admin.controller.js
│   │   ├── routes/
│   │   │   ├── index.js             # agrege les routeurs sous /api
│   │   │   ├── auth.routes.js
│   │   │   ├── user.routes.js
│   │   │   ├── event.routes.js
│   │   │   ├── public.routes.js
│   │   │   ├── template.routes.js
│   │   │   ├── category.routes.js
│   │   │   ├── report.routes.js
│   │   │   └── admin.routes.js
│   │   ├── middleware/
│   │   │   ├── auth.js              # verifyToken, requireAuth
│   │   │   ├── role.js              # requireRole('admin'|'user')
│   │   │   ├── ownership.js         # verifie ownerId -> anti-IDOR
│   │   │   ├── validate.js          # validation Zod generique
│   │   │   ├── upload.js            # Multer memoire + filtres MIME/taille
│   │   │   ├── rateLimiter.js       # limiteurs globaux et sensibles
│   │   │   ├── notFound.js
│   │   │   └── errorHandler.js      # erreurs normalisees, jamais de stack au client
│   │   ├── services/
│   │   │   ├── auth.service.js      # hash, tokens, reset
│   │   │   ├── event.service.js     # regles metier evenement
│   │   │   ├── image.service.js     # Sharp: resize/compress/EXIF strip
│   │   │   ├── storage.service.js   # abstraction local <-> cloud
│   │   │   ├── geocode.service.js   # Nominatim + cache memoire/disque
│   │   │   ├── qrcode.service.js
│   │   │   ├── slug.service.js      # generation + unicite des slugs
│   │   │   ├── mail.service.js      # emails (optionnel)
│   │   │   └── notification.service.js
│   │   ├── validators/
│   │   │   ├── auth.schema.js
│   │   │   ├── event.schema.js
│   │   │   ├── rsvp.schema.js
│   │   │   ├── guestbook.schema.js
│   │   │   └── template.schema.js
│   │   ├── utils/
│   │   │   ├── ApiError.js           # classe d'erreur metier
│   │   │   ├── asyncHandler.js
│   │   │   ├── slugify.js
│   │   │   └── logger.js
│   │   ├── app.js                   # configuration Express (sans listen)
│   │   └── server.js                # point d'entree: db + app.listen
│   ├── seed/
│   │   ├── categories.seed.js
│   │   ├── templates.seed.js
│   │   └── demo.seed.js             # donnees de DEMONSTRATION (marquees comme telles)
│   ├── tests/
│   │   ├── auth.test.js
│   │   ├── event.test.js
│   │   └── rsvp.test.js
│   ├── uploads/                     # stockage local (gitignore)
│   │   └── .gitkeep
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   ├── favicon.ico
│   │   └── manifest.webmanifest     # PWA
│   ├── src/
│   │   ├── assets/
│   │   │   ├── images/
│   │   │   └── fonts/
│   │   ├── components/
│   │   │   ├── common/              # Button, Input, Modal, Loader, Toast, EmptyState
│   │   │   ├── layout/              # Header, Footer, DashboardSidebar, AdminSidebar
│   │   │   ├── event/               # EventCard, EventForm, ProgramEditor, GalleryUploader
│   │   │   ├── public/              # Countdown, MapEmbed, RsvpForm, GuestbookForm, ShareBar
│   │   │   └── admin/               # UsersTable, EventsTable, StatsCards
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── auth/                # Login, Register, ForgotPassword, ResetPassword
│   │   │   ├── dashboard/           # Dashboard, EventList, EventEditor, RsvpList, GuestbookModeration
│   │   │   ├── create/              # CreateWizard (etapes), choisir categorie/template
│   │   │   ├── public/              # PublicEvent, WeddingStory, NotFound
│   │   │   └── admin/               # AdminHome, AdminUsers, AdminEvents, AdminCategories, AdminTemplates, AdminReports
│   │   ├── layouts/
│   │   │   ├── PublicLayout.jsx
│   │   │   ├── DashboardLayout.jsx
│   │   │   └── AdminLayout.jsx
│   │   ├── templates/               # systeme de templates d'affiche/page
│   │   │   ├── registry.js
│   │   │   ├── wedding/             # Elegant, Romantic, Luxury, Modern, Minimal, Traditional
│   │   │   ├── birthday/            # Fun, Party, Elegant, Modern, Kids
│   │   │   └── baptism/             # Baby, Elegant, Minimal, Floral
│   │   ├── services/                # couche appels API
│   │   │   ├── api.js               # instance Axios + intercepteurs
│   │   │   ├── auth.service.js
│   │   │   ├── event.service.js
│   │   │   ├── public.service.js
│   │   │   ├── rsvp.service.js
│   │   │   ├── guestbook.service.js
│   │   │   ├── template.service.js
│   │   │   └── admin.service.js
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useCountdown.js
│   │   │   ├── useDebounce.js
│   │   │   ├── useGeolocation.js
│   │   │   └── useToast.js
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ToastContext.jsx
│   │   ├── utils/
│   │   │   ├── formatDate.js
│   │   │   ├── buildShareLinks.js
│   │   │   ├── constants.js
│   │   │   └── validators.js
│   │   ├── styles/
│   │   │   └── index.css            # directives Tailwind + theme
│   │   ├── router/
│   │   │   ├── AppRouter.jsx
│   │   │   ├── PrivateRoute.jsx
│   │   │   └── AdminRoute.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vite.config.js
│   ├── .env.example
│   └── package.json
│
├── .gitignore
├── README.md
└── package.json                     # scripts racine (workspaces ou orchestration)
```

---

## 3. Architecture frontend

**Principe :** séparation stricte `pages` (assemblage) / `components` (UI réutilisable) / `services` (accès données) / `hooks` (logique réutilisable) / `templates` (rendu visuel des affiches).

- **Routing** : `react-router-dom`. Trois zones :
  - publique : `/`, `/e/:slug`, `/e/:slug/histoire`, `/connexion`, `/inscription`
  - privée organisateur : `/dashboard/*` (protégée par `PrivateRoute`)
  - admin : `/admin/*` (protégée par `AdminRoute`, rôle `admin`)
- **État global** : `AuthContext` (utilisateur + token en mémoire). Les données serveur sont récupérées via les `services/` (Axios) + hooks dédiés. Pas de Redux (complexité inutile ici).
- **Gestion d'erreurs UI** : intercepteur Axios → `ToastContext` avec messages compréhensibles.
- **Design system** : primitives Tailwind + variables de thème. Les templates appliquent une couche de style pilotée par `event.design` (couleurs, polices).
- **Responsive** : mobile-first, breakpoints Tailwind (`sm 640`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1536`). Aucun débordement horizontal.
- **Templates** : un `registry.js` associe `categorie -> liste de templates`. Chaque template est un composant recevant les mêmes props normalisées (`event`, `design`), ce qui permet de **changer de template sans perdre les données**.
- **Accessibilité** : labels de formulaire, `alt` sur images, focus visible, navigation clavier, `aria-*` sur composants interactifs.

---

## 4. Architecture backend

Flux d'une requête :

```text
Request -> helmet/cors -> json -> rate-limit -> routes -> [auth, role, ownership,
validate, upload] -> controller -> service -> model (Mongoose) -> response JSON
                                                              \-> errorHandler
```

- **Controllers** : orchestrent lecture requête / appel service / réponse. Aucune logique métier lourde.
- **Services** : logique métier (slugs, images, geocodage, QR, auth, notifications) réutilisable et testable.
- **Models** : schémas Mongoose + index + hooks (hash du mot de passe, pre-save).
- **Sécurité centrale** : `ownership.js` refuse toute modification si `event.ownerId !== req.user.id` (anti-IDOR). `role.js` protège `/api/admin/*`.
- **Réponses normalisées** :
  - succès : `{ success: true, data: ... }`
  - erreur : `{ success: false, message: "...", code: "..." }` (jamais de stack technique).

---

## 5. Modèle de base de données (MongoDB / Mongoose)

### 5.1 Collections

`users`, `events`, `rsvps`, `guestbookmessages`, `templates`, `categories`, `reports`, `notifications`.

### 5.2 `users`

```js
{
  _id,
  firstName: String,            // requis
  lastName:  String,            // requis
  email:     String,            // requis, unique, lowercase, index
  passwordHash: String,         // requis (jamais renvoyé)
  phone:     String,
  role:      String,            // enum: ['user','admin'], defaut 'user'
  language:  String,            // enum: ['fr','en'], defaut 'fr'
  avatar:    { url, publicId },
  isActive:  Boolean,           // defaut true (blocage admin)
  emailVerified: Boolean,       // defaut false
  resetTokenHash: String,       // reset mot de passe
  resetTokenExpiresAt: Date,
  lastLoginAt: Date,
  createdAt / updatedAt
}
```

### 5.3 `categories` (extensible sans refonte)

```js
{
  _id,
  name:  String,                // "Mariage"
  slug:  String,                // "mariage" (unique)
  icon:  String,                // cle d'icone (ex: "heart")
  description: String,
  fieldsSchema: Object,         // description des champs specifiques (JSON)
  isActive: Boolean,            // defaut true
  order: Number
}
```

Ajouter une catégorie = insérer un document + décrire ses champs dans `fieldsSchema`. Aucune réécriture du code.

### 5.4 `events`

```js
{
  _id,
  ownerId: ObjectId,            // ref users, index
  category: String,             // slug categorie ("mariage")  [extensible]
  slug:     String,             // unique, index  -> /e/marie-et-fatou
  title:    String,             // requis
  tagline:  String,
  description: String,
  date:     Date,               // date de l'evenement
  startTime: String,            // "16:00"
  endTime:   String,
  timezone:  String,            // defaut "Africa/Dakar"

  location: {                   // lieu principal
    label:     String,          // "Ceremonie religieuse"
    type:      String,          // enum placeType (voir 5.10)
    name:      String,          // "Mosquee Al-Falah"
    address:   String,
    latitude:  Number,
    longitude: Number,
    geo: { type: { type: String, enum: ['Point'], default: 'Point' },
           coordinates: [Number] }  // [lon, lat]  index 2dsphere
  },
  locations: [ /* meme structure, pour mariage: mairie/ceremonie/reception */ ],

  mainImage: { url, publicId },
  gallery:  [ { url, publicId, order, caption } ],

  templateId: ObjectId,         // ref templates
  design: {
    primaryColor:   String,
    secondaryColor: String,
    fontHeading:    String,
    fontBody:       String,
    background:     String,
    coverImage:     { url, publicId },
    customTexts:    { headline, subtitle }
  },

  program: [ { time: String, title: String, description: String } ],
  details: Object,              // donnees specifiques a la categorie (voir 5.5)

  visibility: String,           // enum: ['public','private','password']
  accessCodeHash: String,       // si visibility === 'password'

  status: String,               // enum: ['draft','published','unpublished','archived']
  publishedAt: Date,

  settings: {
    rsvpEnabled:        Boolean, // defaut true
    guestbookEnabled:   Boolean, // defaut true
    guestbookModeration:Boolean, // defaut true (validation avant affichage)
    countdownEnabled:   Boolean, // defaut true
    musicUrl:           String
  },

  stats: { views: Number, rsvpYes: Number, rsvpNo: Number, rsvpMaybe: Number },

  createdAt / updatedAt
}
```

**Index :** `slug` (unique), `ownerId`, `category`, `status`, `location.geo` (2dsphere).

### 5.5 `details` selon la catégorie

```js
// mariage
details = {
  groomName, brideName,
  timeline: [ { date, title, description, photo: { url, publicId } } ],
  weddingProgram: [ { time, title, description } ],
  dressCode, practicalInfo,
  giftList: [ String ]
}

// anniversaire
details = {
  celebrantName, age,
  theme, celebrantPhoto: { url, publicId },
  wishlist: [ String ],
  isSurprise: Boolean
}

// bapteme
details = {
  babyName, nameMeaning,
  birthDate, baptismDate,
  babyPhoto: { url, publicId },
  parents:   [ String ],
  godparents:[ String ],
  parentsMessage: String
}
```

### 5.6 `rsvps`

```js
{
  _id,
  eventId: ObjectId,          // ref events, index
  name:    String,            // requis
  phone:   String,
  guestsCount: Number,        // defaut 1
  response: String,           // enum: ['yes','no','maybe']
  message: String,
  ipHash:  String,            // anti-spam / anti-doublon (IP hashee)
  createdAt
}
```

### 5.7 `guestbookmessages`

```js
{
  _id,
  eventId: ObjectId,          // ref events, index
  authorName: String,
  message:    String,         // requis, longueur limitee
  photo:      { url, publicId },
  status:     String,         // enum: ['pending','approved','rejected'], defaut 'pending'
  ipHash:     String,         // anti-spam
  createdAt
}
```

### 5.8 `templates`

```js
{
  _id,
  name:        String,        // "Elegance doree"
  categorySlug:String,        // "mariage"
  componentKey:String,        // cle dans frontend/src/templates/registry.js
  thumbnail:   String,
  layout:      Object,        // config par defaut (couleurs, polices)
  isPremium:   Boolean,       // defaut false
  isActive:    Boolean,       // defaut true
  order:       Number
}
```

### 5.9 `reports` / `notifications`

```js
// reports
{ _id, eventId, reporterEmail, reason, status: 'open'|'closed', createdAt }
// notifications
{ _id, userId, type, title, message, link, read: Boolean, createdAt }
```

### 5.10 Enum `placeType`

`mosquee`, `eglise`, `salle_reception`, `hotel`, `domicile`, `restaurant`, `exterieur`, `entreprise`, `ecole_universite`, `autre`.

---

## 6. Routes API (principales)

### Auth & profil

| Méthode | Route | Accès |
|---|---|---|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/logout` | Connecté |
| POST | `/api/auth/forgot-password` | Public |
| POST | `/api/auth/reset-password/:token` | Public |
| GET | `/api/users/me` | Connecté |
| PUT | `/api/users/me` | Connecté |

### Événements (organisateur)

| Méthode | Route | Accès |
|---|---|---|
| GET | `/api/events` | Propriétaire |
| POST | `/api/events` | Propriétaire |
| GET | `/api/events/:id` | Propriétaire |
| PUT | `/api/events/:id` | Propriétaire |
| DELETE | `/api/events/:id` | Propriétaire |
| POST | `/api/events/:id/publish` | Propriétaire |
| POST | `/api/events/:id/unpublish` | Propriétaire |
| POST | `/api/events/:id/photos` | Propriétaire |
| DELETE | `/api/events/:id/photos/:photoId` | Propriétaire |
| GET | `/api/events/:id/qrcode` | Propriétaire |
| GET | `/api/events/:id/rsvp` | Propriétaire |
| GET | `/api/events/:id/rsvp/export` | Propriétaire |
| GET | `/api/events/:id/guestbook` | Propriétaire |
| PATCH | `/api/events/:id/guestbook/:msgId` | Propriétaire |

### Public (invités)

| Méthode | Route | Accès |
|---|---|---|
| GET | `/api/public/events/:slug` | Public (code si protégé) |
| POST | `/api/public/events/:slug/rsvp` | Public + rate-limit |
| POST | `/api/public/events/:slug/guestbook` | Public + rate-limit |
| GET | `/api/public/events/:slug/calendar.ics` | Public |
| GET | `/api/templates?category=wedding` | Public |
| GET | `/api/categories` | Public |
| GET | `/api/geo/search?q=...` | Public (proxy Nominatim + cache) |
| POST | `/api/reports` | Public |

### Admin

| Méthode | Route | Accès |
|---|---|---|
| GET | `/api/admin/stats` | Admin |
| GET | `/api/admin/users` | Admin |
| PATCH | `/api/admin/users/:id/block` | Admin |
| PATCH | `/api/admin/users/:id/unblock` | Admin |
| DELETE | `/api/admin/users/:id` | Admin |
| GET | `/api/admin/events` | Admin |
| DELETE | `/api/admin/events/:id` | Admin |
| POST/PUT/DELETE | `/api/admin/categories(/:id)` | Admin |
| POST/PUT/DELETE | `/api/admin/templates(/:id)` | Admin |
| GET/PATCH | `/api/admin/reports(/:id)` | Admin |

---

## 7. Parcours utilisateur cible

```text
Inscription -> Connexion -> Dashboard
   -> Creer un evenement
      -> Choisir categorie (mariage / anniversaire / bapteme)
      -> Choisir template
      -> Renseigner infos (noms, date, heure, textes)
      -> Ajouter photos (galerie + principale)
      -> Choisir type de lieu + adresse -> geocodage -> epingle GPS
      -> Options specifiques (histoire/timeline, programme, etc.)
      -> Personnaliser (couleurs, polices)
      -> Previsualisation affiche + page publique
      -> Publier
         -> URL unique  /e/marie-et-fatou
         -> QR Code (telechargeable)
         -> Partage (WhatsApp, Facebook, copier lien)
   -> Suivi dashboard : RSVP, Livre d'or (moderation), stats, depublier/archiver
```

Parcours invité : reçoit le lien/QR → page publique → histoire → galerie → itinéraire → RSVP → livre d'or.

---

## 8. Système d'authentification

- Inscription : validation (email, mot de passe confirmé, robustesse), email unique sinon refus.
- Hash : `bcrypt` (coût ≥ 10 ou 12).
- Tokens : `accessToken` JWT courte durée (ex. 15 min), `refreshToken` en **cookie httpOnly + secure + sameSite=strict**.
- Autorisation : middleware `verifyToken` puis `requireRole`.
- Mot de passe oublié : token à usage unique, stocké **hashé** en base, avec expiration.
- Déconnexion : suppression du cookie refresh + (option) invalidation.
- Protection : rate-limit sur `login` / `register` / `forgot-password`.

---

## 9. Système de gestion des événements

- Cycle de vie : `draft -> published <-> unpublished -> archived`, plus suppression.
- Un `draft` n'est **jamais** exposé par `/api/public/*`.
- Slug généré automatiquement (slugify des noms), **unicité vérifiée**, suffixe numérique si collision.
- Chaque mutation vérifie `ownerId` (anti-IDOR).
- Duplication : copie de l'événement (nouveau slug, statut `draft`).

---

## 10. Système de templates

- Templates identifiés par `componentKey` côté base, résolus dans `frontend/src/templates/registry.js`.
- Props normalisées → **changer de template ne perd aucune donnée**.
- Templates de base : Mariage (Elegant, Romantic, Luxury, Modern, Minimal, Traditional) ; Anniversaire (Fun, Party, Elegant, Modern, Kids) ; Baptême (Baby, Elegant, Minimal, Floral).
- Admin : activation/désactivation et ajout de templates.
- `isPremium` préparé pour la phase 4 (sans logique de paiement en phase 1).

---

## 11. Système de géolocalisation

- Recherche d'adresse via backend `GET /api/geo/search` → **Nominatim** (1 req/s, User-Agent identifiant, **cache** pour respecter la politique d'usage).
- Sélection d'un lieu → enregistrement `latitude`, `longitude`, `address`, `type`.
- Carte : **Leaflet + tuiles OpenStreetMap**, marqueur déplaçable.
- Page publique : affichage carte + adresse + bouton **« Voir l'itinéraire »** (`https://www.google.com/maps/dir/?api=1&destination=lat,lon` et lien Waze).
- Disponible pour **toutes les catégories**.
- Index `2dsphere` pour usages futurs (recherche par proximité).

---

## 12. Système de QR Code

- Génération automatique à la publication : QR pointant vers `https://moncelebra.com/e/:slug`.
- Généré **côté serveur** (lib `qrcode`) → PNG haute résolution téléchargeable, + intégré à l'affiche.
- Contenu testable après scan sur téléphone (redirection correcte).

---

## 13. Système RSVP

- Formulaire public : nom, téléphone (optionnel), nombre d'accompagnants, réponse (`yes|no|maybe`), message.
- Enregistrement en base, mise à jour des compteurs `stats`.
- Rate-limit + `ipHash` pour limiter les abus/doublons.
- Dashboard : totaux (présents / absents / peut-être) + liste + **export CSV**.
- Notification à l'organisateur (voir §17).

---

## 14. Système Livre d'or

- Formulaire public : nom, message, photo (optionnelle).
- Modération : `pending -> approved|rejected` par l'organisateur ; **seuls les `approved` sont publics**.
- Anti-spam : rate-limit + `ipHash` + longueur limitée.
- Actions organisateur : accepter, refuser, supprimer.

---

## 15. Système de confidentialité

| Niveau | Accès | Indexation |
|---|---|---|
| `public` | tout le monde | indexable |
| `private` | uniquement via le lien direct | `noindex` |
| `password` | lien + mot de passe d'accès | `noindex` |

- Le contrôle est **toujours serveur** : `/api/public/events/:slug` exige le code si `password`.
- Le mot de passe d'accès est **haché** (`accessCodeHash`).
- **Baptême : confidentialité `private` par défaut** (protection des photos d'enfants).

---

## 16. Dashboards

### Utilisateur (`/dashboard`)
- Liste des événements (nom, catégorie, date, statut, photo).
- Actions : voir, modifier, prévisualiser, publier/dépublier, dupliquer, archiver, supprimer.
- Copier le lien, QR Code, suivi RSVP, modération livre d'or, statistiques de vues.

### Administrateur (`/admin`)
- Utilisateurs : liste, recherche, consultation, blocage/déblocage, suppression.
- Événements : liste, recherche, filtrage, consultation, suppression.
- Signalements : traitement.
- Catégories : ajouter / modifier / activer / désactiver.
- Templates : ajouter / modifier / supprimer / activer / désactiver.
- Statistiques : utilisateurs, événements (par catégorie), visiteurs, RSVP.

---

## 17. Notifications (architecture prévue)

`Notification` en base + `notification.service.js` + hook applicatif. Types : nouveau RSVP, nouveau message livre d'or, publication, modification importante. Livraison email optionnelle (Resend/Brevo). Prêt pour in-app et temps réel ultérieur.

---

## 18. Sécurité et performance (rappel des engagements)

- Hashage bcrypt ; contrôle d'accès strict `ownerId` (anti-IDOR) ; rôles vérifiés.
- Validation **frontend ET backend** (Zod) ; sanitisation anti-injection NoSQL/XSS (`express-mongo-sanitize`, `helmet`).
- Rate limiting global + renforcé (`login`, `rsvp`, `guestbook`).
- Uploads : MIME + extension vérifiés, taille max (3 Mo avant compression), **nettoyage EXIF** (dont GPS), compression WebP largeur max 1600 px (Sharp).
- Erreurs vers le client toujours génériques (« Une erreur est survenue… »).
- SEO public : title unique, meta description, URL propre, Open Graph par événement (cf. note §0).
- Performance : lazy loading, pagination, cache géocodage, images optimisées, requêtes minimales.
- Quotas gratuits : 3 événements actifs/utilisateur, 20 photos/événement, 3 Mo/photo avant compression.

---

## 19. Roadmap

| Phase | Contenu | Statut |
|---|---|---|
| **1 — MVP** | Accueil, inscription, connexion, dashboard, création événement, mariage/anniversaire/baptême, templates, photos, lieu, géolocalisation, page publique, URL unique, QR, partage, responsive | À venir |
| **2 — v1.0** | RSVP, livre d'or, compte à rebours, confidentialité (3 niveaux), dashboard admin, gestion catégories/templates, SEO/Open Graph, statistiques | À venir |
| **3 — Catégories** | Graduation, fiançailles, soirée, baby shower, inauguration, événement pro, commémoration, autres | À venir |
| **4 — Premium** | Paiement, abonnements, templates premium, domaine personnalisé, SMS, invitations email, stats avancées | À venir |

---

## 20. Décisions validées

| Point | Décision |
|---|---|
| Stack | **React 18 + Vite + Tailwind / Node + Express / MongoDB + Mongoose** (MERN) |
| Langage | **JavaScript + JSX** |
| Périmètre Phase 1 | **MVP strict** du prompt maître (RSVP, livre d'or et compte à rebours en Phase 2) |
| Stockage images | **Local `backend/uploads/`** avec couche d'abstraction pour Cloudinary/S3 plus tard |
| Langue | Français au démarrage ; champ `language` prévu pour l'anglais |
| Domaine | `moncelebra.com` (à confirmer au déploiement) |

> Note SEO Open Graph dynamique : solution provisoire prévue (route HTML OG côté backend), à confirmer lors de l'étape « Page publique ».
