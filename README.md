# Cheese Passport Gift 🧀

An interactive world map of cheeses
(vegetarian entries flagged), a matching QR code, and a printable/digital
"Cheese Passport" for tracking cheeses tried.

## Structure

- `data/` — `cheeses.json`, the single source of truth shared by the map and passport
- `map/` — the Leaflet-based interactive map (`index.html`, deployed via GitHub Pages)
- `passport/` — the continuous-scroll printable/digital passport (`passport.html`)
- `scripts/` — helper scripts (e.g. QR code generator)

## Status

Scaffolding complete. Next: compile `data/cheeses.json`.
