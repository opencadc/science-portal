# Architecture Decision Records (ADR)

This directory contains Architecture Decision Records for the Science Portal (CADC) project.

## Format

Each ADR follows a structured format:

- **Status** — Proposed, Accepted, Deprecated, Superseded
- **Context** — What problem or situation prompted the decision
- **Decision** — What we decided and why
- **Consequences** — Expected outcomes, trade-offs, and follow-up work

## Index

| ADR | Title | Status |
|-----|-------|--------|
| [0001](./0001-client-state-management.md) | Client State Management with Zustand | Proposed |
| [0002](./0002-portal-modal-unification.md) | Portal Modal Unification | Proposed |
| [0003](./0003-dashboard-grid-layout.md) | Dashboard Widget Grid Layout with react-grid-layout | Proposed |

## Related guides

- [State management developer guide](../state-management.md) — day-to-day rules for where state lives (companion to ADR 0001)

## Contributing

1. Copy the next sequential number (`0002`, `0003`, …).
2. Set status to **Proposed** and open a PR for review.
3. After team approval, change status to **Accepted** and merge.
4. If a decision is reversed, mark the old ADR **Superseded** and link to the replacement.
