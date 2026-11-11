# Tontine Digitale _(nom provisoire)_

Application web de gestion de tontines : membres, calendrier des tours, cotisations, retards et
historique transparent visible par tous les membres.

> L'application **ne déplace pas d'argent** : les versements se font en espèces ou par Mobile Money,
> en dehors de l'app. Elle sert à les **déclarer, confirmer et tracer**.

## Stack

Vite · React 19 (JavaScript, `.jsx`/`.js`) · React-Bootstrap + Bootstrap 5 (thème SCSS) ·
React Router · Lucide React · date-fns · Firebase (Auth, Firestore, Storage, Hosting) ·
ESLint + Prettier · Vitest + React Testing Library.

## Prérequis

- **Node.js ≥ 22.22**
- **Java ≥ 21** (requis par les émulateurs Firestore et Storage)
- Le Firebase CLI est installé avec les dépendances du projet (`firebase-tools`) : pas besoin
  d'installation globale. On l'appelle avec `npx firebase …`.

## Installation

```bash
npm install
```

## Lancer en local avec les émulateurs (sans projet Firebase)

Le projet utilise l'identifiant fictif `demo-tontine-digitale` : le préfixe `demo-` permet de tout
faire tourner en local, sans compte Firebase ni clé.

Dans un premier terminal :

```bash
npm run emulators
```

- Interface des émulateurs : http://127.0.0.1:4000
- Auth : 9099 · Firestore : 8080 · Storage : 9199 · Hosting : 5050 (sert le dossier `dist/`)

Dans un second terminal :

```bash
npm run dev:emulators
```

L'application s'ouvre sur http://localhost:5173. Elle lit `.env.emulators` (commité, sans secret)
et se connecte automatiquement aux émulateurs. Un badge « Mode émulateurs » apparaît en bas à
gauche sur ordinateur.

> Avec Java 24, le démarrage affiche un avertissement `sun.misc.Unsafe` venant de l'émulateur : il
> est sans conséquence.

## Brancher un vrai projet Firebase (plus tard)

1. Créer un projet sur https://console.firebase.google.com.
2. Ajouter une **application Web** et copier sa configuration.
3. Activer **Authentication** (E-mail/Mot de passe), **Cloud Firestore** et **Storage**.
4. Copier `.env.example` en `.env` et remplir les variables `VITE_FIREBASE_*` (le fichier `.env`
   n'est jamais commité).
5. Remplacer `demo-tontine-digitale` par l'ID du projet dans `.firebaserc`.
6. Lancer `npm run dev`.

| Variable                            | Rôle                                              |
| ----------------------------------- | ------------------------------------------------- |
| `VITE_FIREBASE_API_KEY`             | Clé Web du projet                                 |
| `VITE_FIREBASE_AUTH_DOMAIN`         | Domaine d'authentification                        |
| `VITE_FIREBASE_PROJECT_ID`          | Identifiant du projet                             |
| `VITE_FIREBASE_STORAGE_BUCKET`      | Bucket Storage (preuves de paiement)              |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Expéditeur (notifications push, phase ultérieure) |
| `VITE_FIREBASE_APP_ID`              | Identifiant de l'application Web                  |
| `VITE_USE_EMULATORS`                | `true` pour utiliser les émulateurs locaux        |
| `VITE_EMULATOR_HOST`                | Hôte des émulateurs (`127.0.0.1` par défaut)      |

## Scripts

| Commande                | Effet                                                        |
| ----------------------- | ------------------------------------------------------------ |
| `npm run dev`           | Serveur de développement (vrai projet, lit `.env`)           |
| `npm run dev:emulators` | Serveur de développement branché sur les émulateurs          |
| `npm run emulators`     | Démarre les émulateurs Firebase                              |
| `npm run build`         | Build de production dans `dist/`                             |
| `npm run preview`       | Sert le build localement                                     |
| `npm run lint`          | ESLint                                                       |
| `npm run format`        | Formate le code avec Prettier (`format:check` pour vérifier) |
| `npm test`              | Lance les tests une fois (`npm run test:watch` en continu)   |

## Structure

```
src/
├── app/            # App.jsx, routes, navigation, providers (Toast ; Auth en phase 3)
├── config/         # app.js (nom, fuseau, devise), firebase.js, firebaseConfig.js
├── features/       # un dossier par fonctionnalité : pages/, components/, hooks/, services/
│   └── home/ auth/ tontines/ members/ rounds/ contributions/ dashboard/ notifications/
├── shared/
│   ├── components/ # Layout, AppNavbar, BottomNav, PageHeader, AmountDisplay, StatusBadge,
│   │               # EmptyState, Loader, ConfirmModal
│   ├── hooks/      # useToast
│   └── utils/      # formatAmount, formatDate, formatPhone, statusLabels
├── styles/         # _variables.scss (thème), custom.scss
└── main.jsx
```

Règles d'architecture : aucun appel Firestore dans un composant (tout passe par `services/` et des
hooks) ; la logique métier est écrite en fonctions pures testées.

## Pages

| URL                              | Page                  |
| -------------------------------- | --------------------- |
| `/`                              | Accueil (publique)    |
| `/connexion`                     | Connexion             |
| `/inscription`                   | Inscription           |
| `/mot-de-passe-oublie`           | Mot de passe oublié   |
| `/rejoindre`, `/rejoindre/:code` | Rejoindre une tontine |
| `/tableau-de-bord`               | Tableau de bord       |
| `/tontines`                      | Mes tontines          |
| `/tontines/nouvelle`             | Créer une tontine     |
| `/tontines/:id`                  | Détail (onglets)      |
| `/tontines/:id/declarer`         | Déclarer un paiement  |
| `/notifications`                 | Notifications         |
| `/profil`, `/parametres`         | Profil, Paramètres    |

## Conventions

- Code, variables et commits en **anglais** ; interface et documentation en **français**.
- Montants en FCFA stockés en **entiers** ; affichage `25 000 FCFA`.
- Dates affichées en français, fuseau `Africa/Abidjan`.
- Téléphones stockés au format `+2250707070707`, affichés `+225 07 07 07 07 07`.

## Avancement

- [x] Phase 1 — Initialisation, thème, structure, Firebase + émulateurs, ESLint/Prettier, layout
- [ ] Phase 2 — Modèle de données Firestore, règles de sécurité et leurs tests
- [ ] Phase 3 — Authentification et profil
- [ ] Phases 4 à 9 — voir le cahier des charges

## Déploiement

Décrit en phase 9 (Firebase Hosting, App Check).
