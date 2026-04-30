# PRD: Link-in-Bio App

## Problem Statement

Managing a personal online presence requires linking to many different platforms (social media, portfolio, projects, etc.) from a single shareable URL. Existing solutions like Linktree are third-party services with limited control. A self-hosted Firebase app gives full ownership, zero recurring cost beyond hosting, and complete control over design and data.

## Solution

A single-user Link-in-Bio web app hosted on Firebase Hosting. A public-facing profile page displays the owner's name, bio, and curated list of links. A password-protected admin panel allows the owner to add, edit, delete, reorder, and toggle visibility of links. Firebase Analytics tracks page views and link clicks automatically.

## User Stories

### Public Visitor
1. As a visitor, I want to see the owner's name and bio on the profile page, so that I know whose page I'm on.
2. As a visitor, I want to see a list of clickable links, so that I can navigate to the owner's content.
3. As a visitor, I want to only see links that are marked as visible, so that I don't see draft or hidden links.
4. As a visitor, I want links to open in a new tab, so that I don't lose my place on the profile page.
5. As a visitor, I want the page to load quickly on mobile, so that I can access it from any device.
6. As a visitor, I want the profile page to be available at the root URL, so that it's easy to share.

### Owner (Admin)
7. As the owner, I want to log in with email and password, so that my admin panel is protected from unauthorized access.
8. As the owner, I want to be redirected to the admin panel after logging in, so that I can immediately manage my links.
9. As the owner, I want to log out of the admin panel, so that I can secure my session on shared devices.
10. As the owner, I want to add a new link with a title and URL, so that I can grow my list of links.
11. As the owner, I want to edit an existing link's title and URL, so that I can keep links up to date.
12. As the owner, I want to delete a link, so that I can remove outdated or irrelevant links.
13. As the owner, I want to toggle a link between visible and hidden, so that I can temporarily remove links without deleting them.
14. As the owner, I want to drag and drop links to reorder them, so that I can control the order links appear to visitors.
15. As the owner, I want the reordered sequence to persist after page refresh, so that my changes are saved.
16. As the owner, I want to edit my profile name and bio, so that I can keep my intro text current.
17. As the owner, I want to see a preview of my public page from the admin panel, so that I can verify changes before sharing.
18. As the owner, I want to be redirected away from the admin panel if I'm not logged in, so that the admin page is never accessible without auth.

### Analytics
19. As the owner, I want page views on my public profile to be tracked automatically, so that I can see how much traffic I'm getting.
20. As the owner, I want each link click to be tracked as a custom event in Firebase Analytics, so that I can see which links get the most engagement.
21. As the owner, I want link click events to include the link title and URL, so that I can identify specific links in the analytics dashboard.

## Implementation Decisions

### Modules

- **Auth module** — Wraps Firebase Authentication. Handles sign-in, sign-out, and auth state observation. Exposes a simple interface: `signIn(email, password)`, `signOut()`, `onAuthStateChanged(callback)`. All admin pages consume this module to guard access.

- **Links module** — Wraps all Firestore CRUD for the links collection. Exposes: `getLinks()`, `addLink(title, url)`, `updateLink(id, data)`, `deleteLink(id)`, `setLinkVisibility(id, visible)`, `reorderLinks(orderedIds)`. This is the deepest module — it encapsulates the Firestore path, ordering logic, and data shape.

- **Profile module** — Wraps Firestore read/write for the owner's profile (name, bio). Exposes: `getProfile()`, `updateProfile(name, bio)`.

- **Analytics module** — Thin wrapper around Firebase Analytics `logEvent`. Exposes: `trackLinkClick(title, url)`. Page views are tracked automatically by Firebase Analytics with no custom code required.

- **Public page (index.html + index.js)** — Reads profile and visible links, renders them to the DOM, fires `trackLinkClick` on each link click. No auth required.

- **Admin page (admin.html + admin.js)** — Protected by auth state check on load. Renders full link list (visible + hidden), provides add/edit/delete/toggle UI, and implements drag-to-reorder using the HTML5 Drag and Drop API. Calls profile module for name/bio editing.

### Data Shape (Firestore)

```
users/{userId}/links/{linkId}
  title: string
  url: string
  visible: boolean
  order: number
  createdAt: timestamp

users/{userId}/profile
  name: string
  bio: string
```

### Routing
- `/` — Public profile page (no auth)
- `/admin` — Admin panel (redirects to `/login` if not authenticated)
- `/login` — Login page (redirects to `/admin` if already authenticated)

### Security Rules
- All Firestore writes under `users/{userId}/` require `request.auth.uid == userId`
- Public profile and links must be readable without auth — the `profile` document and `links` subcollection under the owner's userId are readable by anyone
- **Link write validation** — on create/update, enforce that:
  - `title` is a non-empty string (max 100 chars)
  - `url` is a non-empty string starting with `https://` (max 500 chars)
  - `visible` is a boolean
  - `order` is an integer >= 0
  - `createdAt` is a server timestamp (only on create, immutable after)
  - No extra fields are allowed (`request.resource.data.keys()` is exactly the expected set)
- **Profile write validation** — on update, enforce that:
  - `name` is a non-empty string (max 100 chars)
  - `bio` is a string (max 300 chars, may be empty)
  - No extra fields are allowed
- **Immutability** — `createdAt` on links cannot be changed after creation (`request.resource.data.createdAt == resource.data.createdAt`)
- **Delete** — only the authenticated owner may delete their own link documents

### Ordering
- Each link has an `order` field (integer). Links are sorted ascending by `order` on read.
- On drag-to-reorder, all links in the new sequence are batch-updated with new `order` values.

### XSS Prevention
- All user-supplied content (link titles, profile name/bio) must be escaped before insertion into the DOM using an `escapeHtml()` utility.

## Testing Decisions

### What makes a good test
- Tests verify observable behavior through the module's public interface, not implementation details.
- Tests do not call Firebase SDK directly — Firebase is mocked at the system boundary (in `__tests__/setup.js`).
- Each test sets up its own state and makes assertions on return values or DOM state.

### Modules to test
- **Links module** — Test `addLink`, `updateLink`, `deleteLink`, `setLinkVisibility`, `reorderLinks` against the mocked Firestore. Verify correct data shapes and ordering behavior.
- **Profile module** — Test `getProfile` and `updateProfile` against mocked Firestore.
- **Auth module** — Test `signIn` and `signOut` against mocked Firebase Auth.
- **Analytics module** — Test that `trackLinkClick` calls `logEvent` with the correct event name and parameters.
- **Public page (index.js)** — Test that only visible links are rendered, that `escapeHtml` is applied, and that link click handlers call `trackLinkClick`.

### Prior art
- Jest + jsdom test environment (as per the Firebase webapp scaffold)
- Global Firebase mock in `__tests__/setup.js`
- Tests import and call module functions directly, asserting on return values and mock call arguments

## Out of Scope

- Multi-user / multi-tenant support
- Custom domain configuration
- Profile avatar / thumbnail images
- Click analytics beyond Firebase Analytics (no per-link counters in Firestore)
- Theming (background color, fonts, button styles)
- Link icons or social platform detection
- Pagination or search in the admin panel
- Link scheduling (show/hide by date)

## Further Notes

- The app uses the Firebase CDN compat SDK (v10.8.0) — no bundler required.
- Firebase Analytics requires the app to be hosted (not just `file://`) to function correctly; `pnpm serve` satisfies this for local development.
- Drag-and-drop reordering uses the native HTML5 Drag and Drop API to avoid adding a library dependency.
- The single-user constraint means the `userId` is constant at runtime — it is the UID of the one registered account and can be hardcoded or read from `onAuthStateChanged` on the public page via an anonymous read pattern.
