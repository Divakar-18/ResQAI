# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Enterprise repository structure: `.github/`, `docs/`, `database/`, `scripts/`, `tests/`.
- README, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, LICENSE.
- GitHub Actions CI (lint + build).
- Issue and pull-request templates.
- EditorConfig and richer ESLint / Prettier baselines.

## [1.0.0] — Production MVP

### Added
- Groq `llama-3.3-70b-versatile` classification with structured JSON output.
- AI Matching Engine (100-point composite score for volunteers).
- Auto-execute threshold with human-in-the-loop review queue.
- Real-time Command Center dashboard (Supabase Realtime).
- Live map intake with OpenStreetMap + Nominatim reverse geocoding.
- Discord webhook and Lovable Email alerts for critical incidents.
- RBAC: Citizen, Volunteer, Coordinator, Admin.
- Immutable execution audit log.
