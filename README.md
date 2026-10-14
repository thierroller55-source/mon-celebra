# MON CELEBRA

> « Chaque moment mérite d'être célébré. »

Plateforme web de création, personnalisation et partage d'événements (mariage, anniversaire, baptême) : page publique unique, QR Code, géolocalisation, RSVP et livre d'or.

## Stack

- **Frontend** : React 18 + Vite + Tailwind CSS
- **Backend** : Node.js + Express (API REST)
- **Base de données** : MongoDB + Mongoose
- **Auth** : JWT (cookie httpOnly) + bcrypt
- **Cartes** : Leaflet + OpenStreetMap + Nominatim
- **QR Code** : librairie `qrcode`

## Structure

```
mon-celebra/
├── backend/     API REST (Express + Mongoose)
├── frontend/    Application React (Vite)
├── docs/        Documentation technique
└── package.json
```

## Prérequis

- Node.js >= 18
- npm >= 9
- Une base MongoDB (locale ou MongoDB Atlas)

## Installation

```bash
npm install
```

Copier les fichiers d'environnement :

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Renseigner au minimum `MONGO_URI` et `JWT_SECRET` dans `backend/.env`.

## Lancement en développement

```bash
npm run dev
```

- Backend : http://localhost:5000
- Frontend : http://localhost:5173

## Documentation

Voir [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) pour l'architecture complète, l'arborescence et le schéma de base de données.
