# guisosi

Source for [guisosi.github.io](https://guisosi.github.io): portfolio, research, write-ups, labs and tools.

Built with [Astro](https://astro.build). Static, no trackers.

## Run

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # output in dist/
npm run preview  # serves dist/ (CSP on)
```

## Writing

Posts are Markdown files in `src/content/<section>/`:

| Folder | URL |
|---|---|
| `research/` | `/research/` |
| `write-ups/` | `/write-ups/` |
| `labs/` | `/labs/` |
| `tools/` | `/tools/` |

Copy `src/content/write-ups/_template.md` to start. Files starting with `_` are ignored.
`draft: true` shows up in dev only.

Frontmatter:

```yaml
title: Machine name
description: One line.
date: 2026-01-01
tags: [htb, windows]
attack: [T1046, T1558.003]   # MITRE ATT&CK IDs
status: writing              # writing | finished | pwned
draft: false
```

Profile, roadmap and projects live in `src/data/profile.ts`.

## Before publishing

- No client data, internal IPs, hostnames, usernames or tokens in text or screenshots.
- HTB/THM write-ups only for retired machines.

---

All content is for study and for use in your own environments or with written authorization.
