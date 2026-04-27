# Zero to SaaS Workshop

A collection of Claude Code skills for building production-ready SaaS web apps with Firebase.

## Skills Included

### `firebase-webapp-scaffold`
Scaffolds a complete web app/SaaS project from scratch. Run `/firebase-webapp-scaffold` in Claude Code to start an interview about your app, then get a fully generated project with:

- Plain HTML/CSS/JS frontend (no framework)
- Firebase Auth (email/password)
- Cloud Firestore (user-isolated data)
- Firebase Hosting
- Jest tests
- GitHub Actions CI/CD via OIDC (no stored secrets)

### `tdd`
Guides you through test-driven development with a red-green-refactor loop.

### `grill-me`
Stress-tests your plan or design through relentless questioning before you commit to building.

### `frontend-design`
Generates distinctive, production-grade frontend UI — avoiding generic AI aesthetics. Used as a styling phase after `firebase-webapp-scaffold` scaffolds structure. Installed as a plugin (`frontend-design@claude-code-plugins`).

### `to-prd`
Turns your current conversation into a structured PRD and submits it as a GitHub issue.

## Usage

This repository is used as a Claude Code project directory. Open it in Claude Code and invoke skills with `/skill-name`.

## Adding Skills

- **Skills**: managed via `skills-lock.json`. Local skills in `.claude/skills/`, imported in `.agents/skills/`.
- **Plugins**: installed via `/plugin install <name>@<source>` (e.g. `/plugin install frontend-design@claude-code-plugins`). Run `/reload-plugins` after installing.
