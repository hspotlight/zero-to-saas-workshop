---
name: firebase-webapp-scaffold
description: Scaffold a new webapp/SaaS project using plain HTML/CSS/JS + Firebase (Auth, Firestore, Hosting) + Jest testing + GitHub Actions CI/CD. Use this skill whenever the user wants to create a new web app, SaaS product, or website project that uses Firebase, or when they mention starting a new project with authentication, database, hosting, and deployment pipeline. Also triggers when users say "new project", "scaffold", "bootstrap", "starter template", or want to build something similar to an existing Firebase project.
---

# Firebase Webapp Scaffold

Create a complete, production-ready webapp/SaaS project with this stack:
- **Frontend**: Plain HTML/CSS/JS (no framework, Firebase SDK from CDN)
- **Auth**: Firebase Authentication (email/password)
- **Database**: Cloud Firestore
- **Hosting**: Firebase Hosting
- **Testing**: Jest with jsdom
- **CI/CD**: GitHub Actions with OIDC (Workload Identity Federation) deploying to Firebase

## How This Skill Works

This is a two-phase skill: **interview first, then scaffold**. Never jump straight to generating code. The user's app could be anything — a task manager, a booking system, an invoice tool, a social platform. You need to understand what they're building before you write a single file.

---

## Phase 1: Interview the User

Ask questions **one at a time**. For each question, provide your recommended answer based on what you've learned so far. Resolve dependencies between decisions before moving on.

### Required Information

Gather these, in roughly this order (but adapt based on conversation flow):

1. **App name and purpose**
   - What is this app called?
   - What problem does it solve? Who is the target user?
   - One-sentence elevator pitch

2. **Core features (MVP scope)**
   - What are the 2-4 key things a user can DO in this app?
   - What's the primary entity? (e.g., todos, bookings, invoices, posts)
   - Does the user create/read/update/delete these entities, or is the interaction different?
   - Any features beyond basic CRUD? (search, filtering, sorting, status workflows)

3. **Data model**
   - What fields does the primary entity have? (name, type, required/optional)
   - Are there secondary entities? How do they relate?
   - Does any data need to be shared between users, or is everything private per-user?
   - This directly shapes Firestore collections, security rules, and the JS helpers

4. **Auth requirements**
   - Email/password is the default. Do they also need Google sign-in, or other providers?
   - Any role-based access? (admin vs regular user)
   - What happens for unauthenticated users? (redirect to login, or public landing page?)

5. **Pages and navigation**
   - What pages does the app need? (login, dashboard, detail view, settings?)
   - What's the main page the user lands on after login?
   - Any public-facing pages (landing page, pricing)?

6. **Styling and design**
   - Do they have a design preference? (dark mode, light mode, specific color palette?)
   - Minimal and clean, or rich and detailed?
   - Any brand colors, fonts, or existing design assets?
   - If the user wants high-quality, distinctive design: tell them you can use the `frontend-design` skill for the styling phase, and ask if they'd like that. If yes, defer all CSS/styling work to that skill after scaffolding the structure.

7. **Environment setup**
   - Do they already have Firebase projects created? (they'll need two: test and prod)
   - Do they have a GitHub repo ready?
   - Have they set up Workload Identity Federation for OIDC, or do they need guidance?

### Interview Tips

- If something can be answered by exploring an existing codebase, do that instead of asking.
- Push back on scope creep — help the user focus on MVP. "That's a great v2 feature. For the initial scaffold, let's focus on X."
- When the data model gets complex, sketch it out in text before confirming: "So the Firestore structure would look like: `users/{userId}/invoices/{invoiceId}` with fields: ..."
- Don't move to Phase 2 until you have a clear picture of: app name, core entities with fields, pages needed, and auth flow.

---

## Phase 2: Scaffold the Project

Once you have clarity from the interview, generate the full project. Adapt every file to the user's specific app — this is NOT a generic template with placeholders for business logic.

### Project Structure

```
{app-name}/
├── public/
│   ├── {page}.html              # One HTML file per page
│   ├── style.css                # All styling
│   ├── utils.js                 # Firebase init + Firestore helpers
│   ├── login.js                 # Auth logic
│   ├── {feature}.js             # One JS file per major feature/page
│   ├── firebase-config.js       # Active config (gitignored, generated at build)
│   └── config/
│       ├── firebase-test.js     # Test project config (placeholder)
│       └── firebase-prod.js     # Prod project config (placeholder)
├── __tests__/
│   ├── setup.js                 # Jest setup with Firebase mocks
│   └── {feature}.test.js        # Tests per feature
├── .github/workflows/
│   ├── deploy-test.yml          # Deploy to test on PR
│   └── deploy-prod.yml          # Deploy to prod on push to main
├── package.json
├── jest.config.js
├── firebase.json
├── .firebaserc
├── firestore.rules
├── firestore.indexes.json
├── .gitignore
└── CLAUDE.md                    # Project instructions for Claude Code
```

### File-by-File Generation Guide

Generate files in this order. Each section describes what to include and how to adapt it to the user's app.

#### 1. package.json

```json
{
  "name": "{app-name}",
  "version": "1.0.0",
  "description": "{user's elevator pitch}",
  "scripts": {
    "dev:setup": "cp public/config/firebase-test.js public/firebase-config.js",
    "serve": "pnpm dev:setup && python3 -m http.server 3000 --directory public",
    "test": "jest",
    "test:watch": "jest --watch",
    "deploy": "firebase deploy"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0"
  }
}
```

#### 2. jest.config.js

```javascript
module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.test.js'],
  testPathIgnorePatterns: ['__tests__/setup.js'],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  collectCoverageFrom: [
    'public/**/*.js',
    '!public/**/*.html',
  ],
};
```

#### 3. Firebase config files

**firebase.json:**
```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "hosting": {
    "public": "public",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"]
  }
}
```

**.firebaserc** — use placeholder project IDs:
```json
{
  "projects": {
    "test": "{app-name}-test",
    "prod": "{app-name}-prod"
  }
}
```

**firestore.indexes.json:**
```json
{
  "indexes": [],
  "fieldOverrides": []
}
```

#### 4. Firebase environment configs (placeholders)

Both `public/config/firebase-test.js` and `public/config/firebase-prod.js` should have this structure with clear placeholder values:

```javascript
// TODO: Replace with your Firebase project config from Firebase Console
// Go to: Firebase Console → Project Settings → Your apps → Config
window.firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID",
};
```

#### 5. firestore.rules

Adapt security rules to the user's data model. The core pattern is always user-isolation:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;

      // Adapt subcollections to the user's entities
      match /{entity}/{entityId} {
        allow read, write: if request.auth.uid == userId;
      }
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

If the user needs shared data (e.g., public profiles, shared workspaces), add specific rules for those collections. Always default-deny everything else.

#### 6. .gitignore

```
node_modules/
.env
.env.local
.firebase/
firebase-debug.log*
public/firebase-config.js
*.log
.vscode/
.idea/
*.swp
*.swo
.DS_Store
Thumbs.db
```

#### 7. public/utils.js — Firebase init + Firestore helpers

This is the most important file to customize. It must include:

- `initializeFirebase()` — reads `window.firebaseConfig`, calls `firebase.initializeApp()`
- Global `auth` and `db` variables
- CRUD helper functions for each entity the user described
- Each helper should validate inputs, use proper Firestore paths, and return consistent data

**Pattern for CRUD helpers:**
```javascript
// Example for an entity called "invoices"
async function getInvoices(userId) {
  const snapshot = await db.collection('users').doc(userId)
    .collection('invoices').orderBy('createdAt', 'desc').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function addInvoice(userId, data) {
  const title = data.title?.trim();
  if (!title) throw new Error('Invoice title is required');
  const docRef = await db.collection('users').doc(userId)
    .collection('invoices').add({
      ...data,
      title,
      createdAt: new Date()
    });
  return { id: docRef.id, ...data, title, createdAt: new Date() };
}

async function updateInvoice(userId, invoiceId, updates) {
  await db.collection('users').doc(userId)
    .collection('invoices').doc(invoiceId).update(updates);
}

async function deleteInvoice(userId, invoiceId) {
  await db.collection('users').doc(userId)
    .collection('invoices').doc(invoiceId).delete();
}
```

Also include a `logout()` function wrapping `auth.signOut()`.

#### 8. HTML files

Each HTML page follows this pattern:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{App Name} - {Page}</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <!-- Page content here -->

  <!-- Firebase SDK (compat mode, v10.8.0) -->
  <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js"></script>

  <!-- App scripts (order matters) -->
  <script src="firebase-config.js"></script>
  <script src="utils.js"></script>
  <!-- Page-specific script last -->
</body>
</html>
```

**Login page** must include:
- Login form (email + password)
- Register form (email + password, hidden by default)
- Toggle between forms
- Error message display area
- `onAuthStateChanged` redirect to main page if already logged in

**Main app page(s)** must include:
- Header with app name, user email display, logout button
- The core UI for the user's primary feature
- Error message display area
- `onAuthStateChanged` redirect to login if not authenticated

#### 9. public/login.js

Auth logic pattern:
- Wait for `auth` to be initialized (polling fallback)
- `onAuthStateChanged` → redirect to main page if authenticated
- Login form → `auth.signInWithEmailAndPassword(email, password)`
- Register form → `auth.createUserWithEmailAndPassword(email, password)` + write user doc to Firestore
- Error display with user-friendly messages
- Form toggle event listeners

#### 10. Feature JS files

One JS file per major feature/page. Each should:
- Check auth state on load, redirect if not logged in
- Load data from Firestore and render to DOM
- Handle user interactions (add, edit, delete, etc.)
- Include `escapeHtml()` for any user-generated content displayed in the DOM (XSS prevention)
- Show errors to the user with auto-dismiss

#### 11. public/style.css

If the user wants to use the `frontend-design` skill, generate minimal structural CSS only (layout, spacing) and note that styling will be handled separately.

Otherwise, generate a complete stylesheet with:
- CSS custom properties for theming
- Responsive layout (mobile-first)
- Auth page styling (centered card)
- App page styling (header + content)
- Form styling
- Entity list/card styling adapted to the user's data
- Button states and hover effects
- Error message styling

#### 12. __tests__/setup.js

Mock Firebase globally for Jest:

```javascript
global.firebase = {
  initializeApp: jest.fn(),
  auth: jest.fn(() => ({
    onAuthStateChanged: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    currentUser: null,
  })),
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        collection: jest.fn(),
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      })),
    })),
  })),
};
```

#### 13. Test files

Write tests for:
- **Validation logic** — input validation for each entity's fields
- **Data structures** — Firestore document schemas match expected shapes
- **UI helpers** — `escapeHtml()`, DOM manipulation helpers
- **Config validation** — Firebase config has all required fields

Focus on pure functions that can be tested without real Firebase. Don't test Firebase SDK calls directly — those are covered by Firestore security rules and integration testing.

#### 14. GitHub Actions workflows

**deploy-test.yml:**
```yaml
name: Deploy to Test

on:
  pull_request:
    branches: [main]

env:
  FIREBASE_PROJECT_ID: {app-name}-test
  GCP_PROJECT_NUMBER: YOUR_GCP_PROJECT_NUMBER

permissions:
  contents: read
  id-token: write

jobs:
  test-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 18

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Get pnpm store directory
        shell: bash
        run: echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_ENV

      - uses: actions/cache@v3
        with:
          path: ${{ env.STORE_PATH }}
          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: ${{ runner.os }}-pnpm-store-

      - run: pnpm install
      - run: pnpm test

      - name: Set Firebase config
        run: cp public/config/firebase-test.js public/firebase-config.js

      - id: auth
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: projects/${{ env.GCP_PROJECT_NUMBER }}/locations/global/workloadIdentityPools/github/providers/github
          service_account: github-firebase-deploy@${{ env.FIREBASE_PROJECT_ID }}.iam.gserviceaccount.com

      - name: Deploy to Firebase
        run: npx firebase-tools deploy --project ${{ env.FIREBASE_PROJECT_ID }}
```

**deploy-prod.yml:** Same structure but:
- Triggers on `push` to `main` (not pull_request)
- Uses prod project ID and GCP project number
- Copies `firebase-prod.js` instead of `firebase-test.js`

#### 15. CLAUDE.md

Generate a CLAUDE.md that documents:
- Available commands (install, serve, test, deploy)
- Environment setup (test vs prod Firebase projects)
- Architecture overview (file structure, auth flow, data model)
- Testing patterns
- CI/CD workflow
- Firestore data structure

Use the same format and level of detail as the reference project's CLAUDE.md.

---

## Phase 3: Post-Scaffold Guidance

After generating all files, tell the user what they need to do next:

1. **Create two Firebase projects** in the Firebase Console (test and prod)
2. **Enable Authentication** (Email/Password provider) in both projects
3. **Create Firestore databases** in both projects
4. **Copy Firebase configs** from Console → Project Settings → Your apps → paste into `public/config/firebase-test.js` and `firebase-prod.js`
5. **Set up Workload Identity Federation** for GitHub Actions OIDC (link to Google Cloud docs)
6. **Update `.firebaserc`** with actual project IDs
7. **Update GitHub Actions** workflow files with actual GCP project numbers
8. **Run locally**: `pnpm install && pnpm serve`
9. **Run tests**: `pnpm test`

If the user asked for the `frontend-design` skill for styling, remind them to invoke it now for the CSS/design phase.

---

## Key Principles

- **User-isolation by default**: Every Firestore path starts with `users/{userId}/`. Security rules enforce this. Only deviate if the user explicitly needs shared/public data.
- **Firebase SDK from CDN**: No npm install for Firebase. Use compat mode (`firebase-app-compat.js`) v10.8.0.
- **Config at build time**: Environment configs are committed (they're not secrets). The active config (`firebase-config.js`) is gitignored and generated by copying the right env file.
- **OIDC for CI/CD**: No stored secrets. GitHub Actions authenticates via Workload Identity Federation.
- **Escape user content**: Always use `escapeHtml()` before inserting user-generated content into the DOM.
- **pnpm**: Use pnpm as the package manager, not npm or yarn.