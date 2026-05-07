# BarBeat — Progression du projet

## Stack
- **Frontend** : Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **UI** : shadcn/ui (thème dark)
- **Base de données** : Firebase Firestore (temps réel)
- **Auth** : Firebase Authentication (email/password)
- **Musique** : iTunes Search API (gratuit, sans credentials)
- **Déploiement** : Vercel → https://bar-beat.vercel.app

---

## ✅ Section 1 — Setup & Infrastructure
- Projet Next.js créé avec TypeScript, Tailwind, App Router
- Structure des dossiers : `app/`, `components/`, `lib/`, `types/`, `hooks/`, `store/`
- shadcn/ui installé et configuré (thème dark)
- Composants installés : `button`, `input`, `card`, `badge`, `sonner`, `dialog`, `skeleton`, `separator`
- Projet Firebase créé (`barbeat-61428`)
- Fichier `.env.local` configuré avec toutes les variables
- Firebase CLI installé et configuré

---

## ✅ Section 2 — Firebase / Firestore
- Firebase SDK installé (`npm install firebase`)
- Fichier `/lib/firebase.ts` — initialise `db` et `auth`
- Règles de sécurité Firestore (`firestore.rules`) — déployées et mises à jour :
  - `admins` : chaque user lit son propre doc, écriture admin seulement
  - `venues` : lecture publique, création admin, update admin ou owner
  - `sessions` : lecture publique, écriture DJ authentifié
  - `queueItems` : lecture publique, ajout public avec validation, update/delete DJ
- Index Firestore (`firestore.indexes.json`) :
  - `queueItems` : `venueId + status + requestedAt`
  - `sessions` : `venueId + isActive`
  - `venues` : `djUserIds` (array-contains)
- Document venue créé dans Firebase Console

---

## ✅ Section 3 — Authentification DJ
- Compte DJ créé dans Firebase Console
- Hook `/hooks/useAuth.ts` — `signIn`, `signOut`, `useCurrentUser`
- Middleware `/app/dj/layout.tsx` — redirige vers `/dj/login` si non connecté

---

## ✅ Section 4 — API Musique (iTunes)
- Route API `/app/api/itunes/search/route.ts` — cherche via iTunes API (gratuit)
  - Retourne : `id`, `title`, `artist`, `coverUrl` (300x300), `duration`
- Hook `/hooks/useItunesSearch.ts` — debounce 300ms, minimum 3 caractères
- Note : les variables s'appelaient "spotify" dans le code, tout a été renommé en "itunes"

---

## ✅ Section 5 — Anti-spam & Fingerprint
- FingerprintJS installé
- `/lib/fingerprint.ts` — empreinte navigateur en localStorage
- `/lib/rateLimit.ts` — bloque si demande dans les 5 dernières minutes

---

## ✅ Section 6 — QR Code
- `qrcode.react` installé
- Composant `/components/QRCodeDisplay.tsx` — QR code + téléchargement PNG

---

## ✅ Section 7 — Interface Client (page publique `/bar/[slug]`)
- Types TypeScript (`/types/index.ts`) : `Venue`, `Session`, `QueueItem`
- Composant `NowPlaying` — morceau en cours en temps réel
- Composant `QueueList` — file d'attente temps réel + skeleton
- Composant `SearchBar` — recherche iTunes + anti-spam + toast
- Personnalisation du bar appliquée sur la page :
  - Couleur principale (`primaryColor`) sur le titre
  - Logo (`logoUrl`) affiché à la place de l'emoji 🎧

---

## ✅ Section 8 — Dashboard DJ (`/dj/dashboard`)
- Page login `/app/dj/login/page.tsx`
- Composant `SessionControl` — démarrer/terminer la session
- Composant `QueueItemCard` — ✅ Jouer / ⏭ Skip / 🗑 Supprimer
- Composant `DJQueueList` — file temps réel + bip audio sur nouvelle demande
- `/lib/notification.ts` — bip via Web Audio API
- Query venue mise à jour : `djUserIds` (array) au lieu de `djUserId` (string)

---

## ✅ Section 9 — Dashboard Admin (`/admin`)
- `/app/admin/layout.tsx` — guard : vérifie la collection `admins` dans Firestore
- `/app/admin/page.tsx` — liste tous les bars + stats globales (demandes, sessions, bars)
  - Expand par bar pour voir les stats détaillées
- `/app/admin/venues/new/page.tsx` — formulaire création d'un nouveau bar
  - Champs : nom, slug (auto-généré), couleur, logo URL, UID owner

---

## ✅ Section 10 — Dashboard Owner (`/owner/dashboard`)
- `/app/owner/layout.tsx` — guard : vérifie `ownerUserId` dans Firestore
- `/app/owner/dashboard/page.tsx` :
  - Personnalisation : nom, couleur principale, logo
  - Gestion des DJs : ajouter/retirer par UID
  - Stats du bar

---

## ✅ Section 11 — Statistiques (`VenueStats`)
- Composant `/components/VenueStats.tsx` — réutilisé dans admin + owner
  - Total sessions, demandes, visiteurs uniques
  - Top 5 morceaux les plus demandés
  - Demandes par soirée (top 5)

---

## ✅ Déploiement
- `next.config.ts` configuré avec domaines images iTunes (`is1-ssl.mzstatic.com`, etc.)
- Build validé sans erreurs
- Repo GitHub : https://github.com/Camus10737/BarBeat
- Déployé sur Vercel : https://bar-beat.vercel.app
- Variables d'environnement configurées dans Vercel

---

## 🔧 Bugs corrigés
- Firebase initialisait côté serveur → fix lazy init
- Layout DJ bloquait la page login → fix avec `usePathname()`
- QR code URL hardcodée → fix URL dynamique
- Route Spotify interne → fix avec `spotifyToken.ts` partagé
- `isActive` dans Firebase était une string → corrigé en boolean
- `slug` avait un espace → corrigé dans la console
- Règles Firestore expirées (29 avril) → nouvelles règles déployées
- `admins` collection illisible par le client → rule `uid == request.auth.uid`

---

## ⚠️ Actions manuelles à faire dans Firebase Console

### Activer le dashboard Admin
1. Aller dans **Firestore Database**
2. Créer la collection `admins`
3. Créer un document avec **Document ID = ton UID Firebase**
   - Trouver ton UID : Authentication → ton email
4. Ajouter le champ : `email` = `mohamedcamus94@gmail.com`

### Mettre à jour le document venue existant (si créé avant)
Le modèle a évolué — les champs suivants ont été ajoutés :
- `ownerUserId` (string) — ton UID ou celui du gérant
- `djUserIds` (array) — remplace `djUserId` (string)
- `primaryColor` (string) — ex: `#6366f1`
- `logoUrl` (string) — URL du logo

### Déployer les nouvelles règles
```bash
firebase deploy --only firestore:rules,firestore:indexes
```

---

## 📋 Reste à faire

### Tests
- [ ] Test sur iOS Safari (iPhone)
- [ ] Test sur Android Chrome
- [ ] Test QR code avec différentes apps de scan
- [ ] Vérifier le temps de chargement initial (objectif < 2s)
- [ ] Tester login/logout DJ + les 3 actions (Jouer, Skip, Supprimer)
- [ ] Vérifier la synchro temps réel client ↔ DJ
- [ ] Tester l'anti-spam (2 demandes < 5min → bloqué, même titre → bloqué)

### Lancement pilote
- [ ] Brief DJ (30 min de démonstration + guide 1 page)
- [ ] Préparer un Google Forms pour les retours
- [ ] Suivre manuellement : scans, demandes, suppressions
- [ ] Débriefer avec le DJ après 3 soirées test

### Améliorations futures (post-MVP)
- [ ] Upload de logo directement depuis l'app (Firebase Storage)
- [ ] Barre de progression visuelle sur le morceau en cours (basée sur la durée iTunes)
- [ ] Page d'accueil barbeat.app pour présenter la plateforme
- [ ] Onboarding des bars en self-service (inscription owner)
- [ ] Notifications push pour le DJ (nouvelle demande même onglet fermé)
