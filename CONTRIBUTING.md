# Contributing to ResQAI

Thank you for your interest in ResQAI! We welcome issues, discussions, and pull requests.

## Ground rules

- Be respectful — see [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).
- One logical change per PR. Keep diffs focused and reviewable.
- All new code must pass `bun run lint` and `bun run build` locally.
- Never commit real secrets. Use `.env` (git-ignored) and update `.env.example` when adding a new variable.

## Development setup

```bash
bun install
cp .env.example .env    # then fill in the values
bun run dev
```

## Branching & commits

- Create a feature branch from `main`: `feat/<short-name>` or `fix/<short-name>`.
- Use [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.
- Reference issues in the commit body when applicable.

## Pull requests

1. Fill out the PR template.
2. Ensure CI is green (lint + build).
3. Include screenshots or a short GIF for UI changes.
4. Request review from a maintainer.

## Reporting bugs / requesting features

Use the templates under `.github/ISSUE_TEMPLATE/`. Provide reproduction steps, expected vs actual behaviour, environment info, and screenshots.

## Security

Do **not** open public issues for vulnerabilities — follow [`SECURITY.md`](SECURITY.md).
