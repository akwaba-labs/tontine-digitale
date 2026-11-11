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

**Le plus simple — une seule commande :**

```bash
npm start
```

Elle démarre les émulateurs **et** l'application ensemble ; `Ctrl+C` arrête tout.

**Ou en deux terminaux** (pratique pour redémarrer l'app sans relancer les émulateurs). Dans un
premier terminal :

```bash
npm run emulators
```

- Interface des émulateurs : http://127.0.0.1:4000
- Auth : 9099 · Firestore : 8080 · Functions : 5001 · Storage : 9199 · Hosting : 5050 (sert le dossier `dist/`)

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

| Variable                             | Rôle                                              |
| ------------------------------------ | ------------------------------------------------- |
| `VITE_FIREBASE_API_KEY`              | Clé Web du projet                                 |
| `VITE_FIREBASE_AUTH_DOMAIN`          | Domaine d'authentification                        |
| `VITE_FIREBASE_PROJECT_ID`           | Identifiant du projet                             |
| `VITE_FIREBASE_STORAGE_BUCKET`       | Bucket Storage (preuves de paiement)              |
| `VITE_FIREBASE_MESSAGING_SENDER_ID`  | Expéditeur (notifications push, phase ultérieure) |
| `VITE_FIREBASE_APP_ID`               | Identifiant de l'application Web                  |
| `VITE_USE_EMULATORS`                 | `true` pour utiliser les émulateurs locaux        |
| `VITE_EMULATOR_HOST`                 | Hôte des émulateurs (`127.0.0.1` par défaut)      |
| `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY` | Clé de site App Check (production, voir plus bas) |
| `VITE_APPCHECK_DEBUG_TOKEN`          | Jeton de débogage App Check (développement)       |

## Scripts

| Commande                  | Effet                                                         |
| ------------------------- | ------------------------------------------------------------- |
| `npm start`               | Émulateurs + application en une seule commande                |
| `npm run start:demo`      | Idem, avec les données de démonstration déjà chargées         |
| `npm run seed`            | Charge les données de démonstration (émulateurs lancés)       |
| `npm run dev`             | Serveur de développement (vrai projet, lit `.env`)            |
| `npm run dev:emulators`   | Serveur de développement branché sur les émulateurs           |
| `npm run emulators`       | Démarre les émulateurs Firebase                               |
| `npm run build`           | Build de production dans `dist/`                              |
| `npm run preview`         | Sert le build localement                                      |
| `npm run lint`            | ESLint                                                        |
| `npm run format`          | Formate le code avec Prettier (`format:check` pour vérifier)  |
| `npm test`                | Lance les tests une fois (`npm run test:watch` en continu)    |
| `npm run test:rules`      | Tests des règles de sécurité (démarre ses propres émulateurs) |
| `npm run deploy`          | Lint + tests + build, puis déploie tout sur Firebase          |
| `npm run deploy:hosting`  | Build puis déploie uniquement l'application                   |
| `npm run deploy:rules`    | Déploie uniquement les règles et index Firestore/Storage      |
| `npm run build:functions` | Assemble les Cloud Functions dans `functions/lib/`            |

## Données de démonstration

Avec les émulateurs lancés, `npm run seed` crée trois comptes (mot de passe `demo1234`) :

| Compte            | Rôle                                             |
| ----------------- | ------------------------------------------------ |
| `aminata@demo.ci` | Organise « Tontine des commerçantes » (en cours) |
| `bakary@demo.ci`  | Organise « Tontine du bureau » (en préparation)  |
| `chantal@demo.ci` | Membre, avec des paiements à différents statuts  |

Le script refuse de tourner sur un projet qui ne commence pas par `demo-`.

## Membres sans compte

L'organisateur peut ajouter une personne qui n'utilisera pas l'application (onglet **Membres** →
« Ajouter sans compte »). Il enregistre ensuite ses paiements (« Paiement reçu ») et confirme pour
elle la remise du pot. Son téléphone est visible des membres ; son e-mail, facultatif, reste visible
par l'organisateur seul et sert uniquement à lui envoyer les e-mails.

## E-mails

À **chaque événement** d'une tontine (paiement déclaré, confirmé, rejeté, nouveau membre, tirage
au sort, versement du pot…), la Cloud Function `emailMembersOnEvent` envoie un e-mail à tous les
membres actifs, sauf l'auteur de l'action. Le texte est la même phrase que dans l'onglet
Historique. Chaque utilisateur peut couper ces e-mails dans **Paramètres**.

- **En local** : `npm start` lance aussi la fonction ; sans serveur SMTP, les e-mails sont
  **simulés** et visibles dans l'interface des émulateurs (http://127.0.0.1:4000 → Firestore →
  collection `mailLog`).
- **En production** : les Cloud Functions demandent le **forfait Blaze** (paiement à l'usage ; le
  quota gratuit couvre largement une petite application). Il faut un service d'envoi SMTP, par
  exemple Brevo (300 e-mails/jour gratuits) :
  1. Copier `functions/.env.example` en `functions/.env.<id-du-projet>` et le remplir (`APP_URL`,
     `MAIL_FROM`, `SMTP_HOST`, `SMTP_USER`, et `FUNCTIONS_REGION` = région de la base Firestore).
  2. Enregistrer le mot de passe SMTP comme secret : `npx firebase functions:secrets:set SMTP_PASS`.
  3. `npm run deploy` (les fonctions sont assemblées automatiquement avant l'envoi).
- L'adresse d'expédition doit appartenir à un domaine vérifié chez le fournisseur SMTP, sinon les
  e-mails finissent en spam.

## Application installable et hors ligne

- L'application est une **PWA** : sur mobile, « Ajouter à l'écran d'accueil » l'installe comme une
  application. Les mises à jour s'appliquent automatiquement au rechargement suivant.
- Les données déjà consultées restent en **cache local** (IndexedDB) : elles s'affichent hors ligne
  et instantanément sur les connexions lentes. Un bandeau signale l'absence de réseau ; les actions
  faites hors ligne sont envoyées au retour de la connexion.
- Les preuves de paiement (photos) nécessitent une connexion pour être envoyées.

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
- [x] Phase 2 — Modèle de données Firestore, règles de sécurité et leurs tests
- [x] Phase 3 — Authentification et profil
- [x] Phases 4 à 7 — Tontines, membres, tours, cotisations, tableau de bord, notifications
- [x] Phase 8 — PWA, mode hors ligne, données de démonstration, finitions mobiles
- [x] Phase 9 — Déploiement (Hosting, en-têtes, App Check)

## Déploiement

Prérequis : avoir suivi « Brancher un vrai projet Firebase » ci-dessus (`.env` rempli,
`.firebaserc` pointant sur le vrai projet), puis se connecter une fois :

```bash
npx firebase login
```

1. **Règles et index** (à faire avant la première mise en ligne, puis à chaque modification) :
   `npm run deploy:rules`.
2. **Application** : `npm run deploy` (vérifie lint et tests, construit `dist/`, déploie tout).
   L'URL publique s'affiche à la fin (`https://<projet>.web.app`).
3. **Domaine d'authentification** : dans la console, Authentication → Paramètres → Domaines
   autorisés, ajouter le domaine personnalisé s'il y en a un.

### App Check (recommandé en production)

App Check garantit que seules les requêtes venant de l'application atteignent Firestore et
Storage.

1. Console Google Cloud : activer l'API **reCAPTCHA Enterprise** et créer une clé de site « Web »
   pour le domaine de l'application.
2. Console Firebase → App Check : enregistrer l'application Web avec le fournisseur reCAPTCHA
   Enterprise et cette clé.
3. Mettre la clé dans `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY` (fichier `.env`), puis redéployer.
4. Observer les métriques App Check quelques jours, puis cliquer **Appliquer** (enforce) pour
   Firestore et Storage.

Pour développer contre le vrai projet avec App Check appliqué : lancer l'app une fois, copier le
jeton de débogage affiché dans la console du navigateur, l'enregistrer dans App Check → Gérer les
jetons de débogage, et le mettre dans `VITE_APPCHECK_DEBUG_TOKEN`. Les émulateurs n'utilisent
jamais App Check.

### En-têtes servis

`firebase.json` configure : cache d'un an pour `/assets/**` (fichiers versionnés), `no-cache`
pour les pages, `sw.js` et le manifeste (les mises à jour arrivent tout de suite), et des en-têtes
de sécurité (`nosniff`, `Referrer-Policy`, `X-Frame-Options`).
