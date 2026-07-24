# Security Policy

## Supported Versions

We support security fixes on the latest `main` branch. Older releases are not maintained.

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security-sensitive reports.

Email **security@resqai.dev** with:

- A description of the issue and its impact
- Steps to reproduce (proof-of-concept, if possible)
- The commit hash or deployed URL where the issue was observed
- Your preferred contact for follow-up and credit

We aim to acknowledge reports within **72 hours** and to provide a fix or mitigation within **14 days** for critical issues. Coordinated disclosure is appreciated.

## Scope

In scope:

- Authentication / authorization bypass
- RLS policy escapes on any table
- Server-function or webhook input-validation issues
- Sensitive data leakage (PII, secrets, tokens)
- Supply-chain concerns for dependencies

Out of scope:

- Automated scanner output without a working PoC
- Denial-of-service via volumetric traffic
- Vulnerabilities in third-party services (report to that vendor)

## Hall of Fame

We publicly credit researchers who report valid issues (opt-in).
