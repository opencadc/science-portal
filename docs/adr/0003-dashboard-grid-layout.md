# ADR 0003: Dashboard Widget Grid Layout with react-grid-layout

| Field | Value |
|-------|-------|
| **Status** | Proposed |
| **Date** | 2026-07-16 |
| **Authors** | Engineering |
| **Reviewers** | _TBD_ |
| **Supersedes** | — |
| **Related** | ADR 0001 (route owns layout), [state-management guide](../state-management.md) |

---

## Summary

Adopt **react-grid-layout v2** for arranging the authenticated sessions dashboard widgets (drag + resize), with an explicit **edit mode** and **feature-local `localStorage`** persistence. Layout state stays out of Zustand and nuqs.

---

## Context

The dashboard previously used two hardcoded flex rows (≈80/20 + 60/40). Users could not rearrange widgets. A reorder-only library (`@dnd-kit`) would not provide sizing or responsive grid math. Server-synced preferences are out of scope for v1.

Constraints:

- Launch form and session cards are dense interactive UIs — whole-widget drag would steal clicks.
- ADR 0001: the route/feature owns layout; Zustand is for cross-route UI.
- Below `md`, drag/resize is awkward on touch — stack via responsive layouts instead.

---

## Decision

1. **Library:** `react-grid-layout@^2` (hooks API: `ResponsiveGridLayout`, `useContainerWidth`).
2. **Interaction:** Customize toggle enables drag (handle-only) and resize; default view has both disabled.
3. **Persistence:** Versioned blob in `localStorage` (`canfar-dashboard-layout-v10`) with layouts + hidden widget ids, loaded/merged via `useDashboardLayout`. Not cleared on logout. Grid density is 24 columns / 40px rows for finer resize steps.
4. **Chrome:** Drag handle + hide (eye) control on `DashboardWidget` while editing; hidden widgets appear in an “Available widgets” tray under the toolbar. `SessionModalsHost` stays outside the grid.

---

## Consequences

### Positive

- Users can rearrange and resize the four widgets and keep the layout across reloads.
- Edit mode protects form controls and card actions.
- Forward-compatible merge fills in new widget ids when the catalog grows.

### Trade-offs

- Extra client bundle for one route (acceptable; can lazy-load later).
- Mouse-first rearrange; keyboard reorder is a follow-up.
- No cross-device sync until a preferences API exists.

### Follow-ups

- Server-backed per-user layouts
- Add/remove/hide widgets catalog
- Keyboard-only rearrange
