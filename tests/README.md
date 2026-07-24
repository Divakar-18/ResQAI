# Tests

```
tests/
├── unit/          # pure functions, hooks
├── integration/   # server functions against a test Postgres
└── e2e/           # Playwright user flows
```

Add tests alongside new features; CI will run `bun run test` once test tooling is wired up.
