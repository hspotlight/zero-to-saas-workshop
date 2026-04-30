# PRD: Link-in-Bio App for Creators

## Problem Statement

Creators and influencers share content across multiple platforms (Instagram, TikTok, YouTube, newsletters) but social media bios allow only a single link. They need a single landing page that aggregates all their important links so followers can find everything in one place — and they need to know which links actually get clicked so they can optimize their content strategy.

## Solution

A Link-in-Bio web app where creators sign up with a custom username, build a public profile page at `yourapp.com/{username}`, add links with icons and toggle them on/off, reorder them by drag-and-drop, and view click analytics (per-link clicks + total profile views) from a private dashboard.

## User Stories

1. As a creator, I want to register with my email, password, and a unique username, so that I can claim my personal profile URL immediately.
2. As a creator, I want to be told if my chosen username is already taken during signup, so that I can pick an available one without submitting the form.
3. As a creator, I want my username to be validated for allowed characters (letters, numbers, hyphens), so that my profile URL is clean and shareable.
4. As a creator, I want to log in with my email and password, so that I can access my dashboard.
5. As a creator, I want to log out of my account, so that my dashboard is not accessible on shared devices.
6. As a creator, I want to set my display name, so that my public profile shows my real name or brand name.
7. As a creator, I want to write a short bio (≤160 characters), so that visitors know who I am at a glance.
8. As a creator, I want to provide a profile photo URL, so that my public page feels personal and recognizable.
9. As a creator, I want to add a link with a title, URL, icon (emoji or image URL), and enabled/disabled status, so that I can curate what appears on my public profile.
10. As a creator, I want to edit an existing link's title, URL, or icon, so that I can keep my profile up to date.
11. As a creator, I want to delete a link, so that I can remove outdated or irrelevant links permanently.
12. As a creator, I want to toggle a link on or off without deleting it, so that I can hide seasonal links and re-enable them later.
13. As a creator, I want to reorder my links by dragging them, so that my most important links appear at the top.
14. As a creator, I want to preview my public profile page from the dashboard, so that I can see exactly what my followers see.
15. As a creator, I want to see the total number of clicks each link has received, so that I know which content resonates with my audience.
16. As a creator, I want to see the total number of profile views, so that I can understand my overall reach.
17. As a creator, I want my analytics dashboard to show per-link click counts alongside each link, so that I can compare performance at a glance.
18. As a follower/visitor, I want to visit a creator's public profile at `yourapp.com/{username}`, so that I can find all their important links in one place.
19. As a follower/visitor, I want the public profile to show the creator's photo, name, and bio, so that I know I've found the right person.
20. As a follower/visitor, I want to only see enabled links on the public profile, so that I'm not shown broken or placeholder links.
21. As a follower/visitor, I want links to open in a new tab when I click them, so that I don't lose my place on the profile page.
22. As a follower/visitor, I want the public profile to load quickly even without an account, so that I don't need to wait through auth flows.
23. As a creator, I want the app to work well on mobile, so that I can manage my profile from my phone.
24. As a creator, I want my profile page to look good on mobile, so that the majority of my followers who visit on phones have a good experience.

## Implementation Decisions

### Modules

**`username` module**
- Validates slug format: lowercase letters, numbers, hyphens only; 3–30 characters
- Checks availability by reading `usernames/{slug}` in Firestore
- Reserves a slug atomically during signup using a Firestore transaction (write `usernames/{slug}` + create user profile document in one transaction)
- Interface: `validateFormat(slug)`, `isAvailable(slug)`, `reserveUsername(userId, slug)` (transactional)

**`auth` module**
- Wraps Firebase Auth: register (email + password + username), login, logout, onAuthStateChanged listener
- Registration calls `username.reserveUsername` as part of the flow
- Interface: `register(email, password, username)`, `login(email, password)`, `logout()`, `onAuthChange(callback)`

**`profile` module**
- Reads and writes `users/{userId}/profile` document: `displayName`, `bio`, `photoURL`
- Interface: `getProfile(userId)`, `updateProfile(userId, fields)`

**`links` module**
- CRUD on `users/{userId}/links/{linkId}` documents
- Fields: `title`, `url`, `icon`, `enabled` (boolean), `order` (integer), `clickCount` (integer)
- Reorder: accepts new ordered array of link IDs, batch-writes updated `order` values
- Interface: `getLinks(userId)`, `addLink(userId, data)`, `updateLink(userId, linkId, data)`, `deleteLink(userId, linkId)`, `reorderLinks(userId, orderedIds)`

**`analytics` module**
- Records a profile view: increments `users/{userId}/analytics/totals.profileViews`
- Records a link click: increments `users/{userId}/analytics/totals.linkClicks.{linkId}` and `users/{userId}/links/{linkId}.clickCount`
- Reads aggregated stats for the dashboard
- Interface: `recordProfileView(userId)`, `recordLinkClick(userId, linkId)`, `getStats(userId)`

**`public-profile` module**
- Fetches profile + enabled links by username slug (no auth required)
- Resolves slug → userId via `usernames/{slug}`, then fetches profile + links
- Returns sorted (by `order`), enabled-only links
- Interface: `getPublicProfile(slug)`

**`drag-reorder` (UI module)**
- Handles drag-and-drop events in the dashboard
- On drop, computes new order array and calls `links.reorderLinks`
- No Firebase SDK calls — pure DOM + calls to `links` module

### Data Model (Firestore)

- `usernames/{slug}` → `{ userId }`
- `users/{userId}/profile` → `{ displayName, bio, photoURL, username }`
- `users/{userId}/links/{linkId}` → `{ title, url, icon, enabled, order, clickCount, createdAt }`
- `users/{userId}/analytics/totals` → `{ profileViews, linkClicks: { [linkId]: count } }`

### Security Rules

- `usernames/{slug}`: read = public, write = only during account creation (via transaction)
- `users/{userId}/**`: read/write = `request.auth.uid == userId` only
- Public profile read: `users/{userId}/profile` and `users/{userId}/links` allow public reads (anyone can view a profile page)

### Architectural Notes

- Public profile page (`/{username}`) must be readable without authentication — Firestore rules must allow public reads of profile and links subcollections
- Analytics increments use `FieldValue.increment()` for atomic updates without read-modify-write races
- The public profile route requires Firebase Hosting rewrites to serve the same HTML file for all username paths
- Profile photo: accept a URL input for MVP (avoids Firebase Storage complexity)
- Username slugs are always stored lowercase; display name is separate

## Testing Decisions

**What makes a good test:**
Tests verify observable behavior through public module interfaces, not internal implementation. A good test reads like a specification: given some inputs, assert the outputs or side effects. Tests must not reach into private functions or depend on Firebase SDK internals — mock only at the Firebase boundary using the global mock in `__tests__/setup.js`.

**Modules with tests:**

- **`username` module**: Test `validateFormat` with valid slugs, slugs that are too short/long, and slugs with invalid characters. Test `isAvailable` returns true/false based on mocked Firestore reads. Test `reserveUsername` calls the correct Firestore transaction paths.

- **`links` module**: Test `addLink` creates a document with correct fields and an `order` value. Test `reorderLinks` produces the correct batch of `order` updates. Test `deleteLink` removes the correct document. Test `getLinks` returns links sorted by `order`.

- **`analytics` module**: Test `recordProfileView` calls `FieldValue.increment(1)` on the correct path. Test `recordLinkClick` increments both `analytics/totals` and the link document's `clickCount`. Test `getStats` returns correctly shaped data.

**Prior art:**
Tests follow the Jest + jsdom pattern from `firebase-webapp-scaffold`, using the global Firebase mock in `__tests__/setup.js` and testing pure data-transformation logic without live SDK calls.

## Out of Scope

- Paid tiers, subscription management, or payment processing
- Custom domains per user
- Link thumbnail previews fetched from URLs (Open Graph scraping)
- Time-series analytics charts (totals only for MVP)
- Social handle fields (these are just regular links)
- Email verification or password reset flows
- Admin dashboard or moderation tools
- Link scheduling (set a link to appear/disappear on a date)
- QR code generation for profiles
- File upload for profile photos (URL input only)

## Further Notes

- Scaffold using `/firebase-webapp-scaffold` with two Firebase projects (test + prod) following the workshop's CI/CD pattern (GitHub Actions + OIDC).
- The `frontend-design` plugin can be invoked after scaffolding to apply visual polish.
- Username uniqueness must be enforced at the data layer (Firestore transaction), not just the UI layer — the UI check is for UX only and is not a security guarantee.
