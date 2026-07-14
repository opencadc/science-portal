# ADR 0001: Client State Management with Zustand

| Field | Value |
|-------|-------|
| **Status** | Proposed |
| **Date** | 2026-07-13 |
| **Authors** | Engineering (draft for architecture review) |
| **Reviewers** | _TBD_ |
| **Supersedes** | — |
| **Related** | CADC-15555 (platform load), opencadc/science-portal#158 |

---

## Summary

Adopt **Zustand** as the client-side UI state layer for cross-route orchestration, while retaining **TanStack Query** for server/async state, **NextAuth** for OIDC sessions, **React Context** for boot-time runtime config, and **nuqs** for URL-shareable state.

**Primary goal: lay a durable foundation before building new routes and file-management UI.** Feature work (storage browser, uploads, additional pages) starts only after the foundation gate is met.

This ADR does **not** propose moving server data, auth identity, or deployment configuration into Zustand.

---

## Foundation-first strategy

### Principle

> **Invest in patterns and infrastructure first; ship product features on top of them second.**

New UI (file upload, extra routes, bulk actions) will multiply whatever state patterns exist today. A foundation phase establishes:

1. **Documented boundaries** — where every kind of state lives ([state-management guide](../state-management.md))
2. **One server-state path** — all API data through TanStack Query hooks; no new manual `fetch` + `useState`
3. **One client-state path** — cross-route UI through Zustand slices with typed selectors
4. **One URL-state path** — bookmarkable navigation through nuqs
5. **Layout-level shared UI** — auth, app bar, logout reset, and (later) upload panel work on every route without per-page wiring
6. **Scaffolded store shape** — full slice interfaces defined up front; future features implement against known types, not ad-hoc additions

### Foundation vs feature work

| Foundation (do first) | Feature work (do after gate) |
|-----------------------|------------------------------|
| Accept ADR + developer guide | `/storage` route and file browser |
| Migrate manual fetch → React Query | Upload queue UI and progress |
| Extract `SessionsDashboard`; slim `page.tsx` | Bulk delete / clipboard |
| Zustand store scaffold + Phase 1 slices | `storageUi` and `uploads` slice logic |
| Layout-level AppBar + logout/Zustand reset | Session detail route |
| Unit tests for store + logout reset | RSC prefetch (optional follow-up ADR) |

**No new routes or upload flows ship until the foundation gate passes** (see below).

### Foundation gate (acceptance criteria)

All of the following must be true before starting `/storage` or other heavy UI:

- [ ] ADR 0001 status is **Accepted**
- [ ] [docs/state-management.md](../state-management.md) exists and is linked from README
- [ ] Zero manual `fetch` for server data in implementation components (storage widget, events modal migrated)
- [ ] `src/lib/stores/` exists with composed store, typed slices, selector hooks, and tests
- [ ] `sessionUi` and `modals.auth` slices migrated; logout reset clears Zustand
- [ ] `AppBarWithAuth` (or equivalent) mounted from layout — not owned by a single page
- [ ] `page.tsx` is a thin route shell delegating to a feature component
- [ ] Stub types/slices for `storageUi` and `uploads` are defined (interfaces + reset actions; logic added in feature phase)

### What “scaffold early” means

Phase 1 creates the **full store skeleton** even though `storageUi` and `uploads` are not populated yet:

```
src/lib/stores/
├── app-store.ts
├── types.ts              # All slice interfaces including UploadItem, storageUi
├── selectors.ts
├── slices/
│   ├── session-ui.ts     # ✅ implemented Phase 1
│   ├── modals.ts         # ✅ implemented Phase 1
│   ├── navigation.ts     # Phase 2
│   ├── storage-ui.ts     # stub: resetStorageUi() only
│   └── uploads.ts        # stub: resetUploads() only
└── index.ts
```

Future file-management work **fills in** stub slices rather than inventing new state homes mid-flight.

---

## Strategic direction

### Where the product is going

Today the portal is effectively a **single client page** (`src/app/page.tsx`) plus an OIDC callback route. The roadmap adds:

| Capability | State impact |
|------------|--------------|
| **Additional routes/pages** | State must survive navigation; layout-level modals, upload progress, and auth must work across routes without lifting everything into a god page |
| **File browser / storage management** | Directory navigation, multi-select, view modes, delete/create — server lists in React Query; current path and selection in URL or Zustand |
| **File upload** | Multi-file queue, per-file progress, retry/cancel, global progress UI visible from any route — inherently cross-component client state |
| **More session interactions** | Existing patterns (operating IDs, modals) extended; session list may become its own route |
| **Heavier UI surfaces** | Drawers, panels, bulk actions, confirmation flows — need a consistent home outside local `useState` |

### Why this changes the decision

The audit findings were tolerable on a single page. They become **blockers** when:

- Upload progress started on `/storage` must remain visible after navigating to `/` (sessions).
- Auth modals opened from the AppBar must work on every route without duplicating logic per page.
- File browser path (`/storage?path=/data/project-x`) must be bookmarkable while upload queue stays in memory.
- Each new page copy-pastes the auth + logout-reset + modal wiring currently embedded in `page.tsx`.

Zustand is recommended not only to clean up today's debt, but to **establish patterns before the heavier UI lands**.

---

## Context

### Background

The Science Portal is a Next.js 15 App Router application serving CANFAR/OIDC users. State is currently spread across several mechanisms without a documented boundary:

| Mechanism | Role today |
|-----------|------------|
| TanStack Query v5 | Sessions, images, launch context; CANFAR auth status |
| NextAuth v5 | OIDC session and token lifecycle |
| React Context | Theme, public runtime config |
| nuqs | Launch form URL deep linking (partial adoption) |
| Local `useState` / `useRef` | Modals, form drafts, page orchestration |

The README and project structure document **Zustand** and a `src/lib/stores/` directory, but neither exists in the codebase today. Documentation drift creates onboarding confusion and implies a decision that was never implemented.

**Storage APIs and React Query hooks already exist** for the upcoming file-management work (`src/lib/api/storage.ts`, `src/lib/hooks/useUserStorage.ts` — quota, list, upload, delete, create directory), but the UI still uses manual `fetch` in `userStorageWidget.tsx`.

### Current provider stack

Root layout (`src/app/layout.tsx`) nests providers in this order:

```
PublicRuntimeConfigProvider
  └── QueryProvider (TanStack Query)
        └── NuqsProvider
              └── AuthProvider (NextAuth SessionProvider)
                    └── ThemeProvider (React Context + MUI)
                          └── App
```

This ordering is sound and **must remain route-agnostic** — all new pages inherit the same stack via the root layout (or route-group layouts).

### Pain points identified in audit

1. **Orchestration concentrated in `page.tsx`**
   - The main page (~400 lines, `'use client'`) coordinates auth gating, all data hooks, session mutations, and UI flags such as `operatingSessionIds`.
   - **New routes cannot reuse this pattern** without duplicating or extracting a large coordinator.

2. **Inconsistent server-state access**
   - React Query hooks exist for storage and session events/logs, but UI uses manual `fetch` + `useState` (`userStorageWidget.tsx`, `eventsModal.tsx`).
   - File management features will multiply this inconsistency unless standardized first.

3. **URL state infrastructure ahead of usage**
   - `useUrlState.ts` defines search, pagination, filters, and modal deep-link hooks.
   - Only `sessionLaunchForm.tsx` uses nuqs directly. **File browser path navigation is a natural nuqs use case** not yet implemented.

4. **Modal and transient UI state is scattered**
   - Auth modals, launch overlay, session health check, per-card modals, mobile drawer — all local `useState`, not portable across routes.

5. **Logout reset is aggressive by design**
   - `useLogoutReset` invalidates React Query, clears URL params, full page reload.
   - Must extend to clear upload queues and file selection on logout; reload may remain until migrations complete.

6. **No global client-state library**
   - Acceptable for one page; **insufficient for upload queues and cross-route UI**.

### Problem statement

We need a **documented, scalable strategy** for where state lives as the app grows from a single dashboard into a multi-route portal with file management. The team must be able to answer:

> *"Does this belong in React Query, Zustand, nuqs, Context, or local component state — and at what scope (global, route, component)?"*

---

## Target application shape

Illustrative route map (exact paths TBD by product):

```
/                          → Sessions dashboard (today's page.tsx, slimmed)
/storage                   → File browser + quota (new)
/storage?path=/data/foo    → Deep-linked directory (nuqs)
/sessions/[id]             → Optional session detail route (future)
/oidc-callback             → Existing auth callback (unchanged)
```

### Recommended route-level architecture

Each route owns **data fetching and layout**; shared UI state lives in **Zustand** or **layout components**:

```
src/app/
├── layout.tsx                    # Root providers (unchanged stack)
├── page.tsx                      # Sessions — thin route shell
├── storage/
│   └── page.tsx                  # File management route
├── components/                   # Shared presentational components
└── (sessions)/                   # Optional route group

src/lib/
├── hooks/                        # TanStack Query domain hooks (per API)
├── stores/                       # Zustand slices (cross-route UI)
└── features/                     # Optional: colocate route logic
    ├── sessions/
    └── storage/
```

**Rule for new routes:** Route `page.tsx` should be a thin shell (< ~100 lines) that composes feature components. Data hooks are called inside feature components or route-specific hooks — not re-centralized into a new god page.

---

## Decision drivers

| Driver | Priority | Notes |
|--------|----------|-------|
| Scale to **multiple routes** without duplicating orchestration | **Critical** | Primary motivator |
| Support **file upload queue + progress** across navigation | **Critical** | Zustand + optional global UploadPanel |
| Clear boundaries between server state and UI state | High | Prevents React Query / Zustand duplication |
| **Bookmarkable file paths** and list filters | High | nuqs on `/storage` |
| Support dual auth modes (CANFAR / OIDC) on every route | High | Auth stays in NextAuth / `useAuthStatus` |
| Safe logout — no stale user files/quota in memory | High | Reset storage UI + upload queue |
| Reduce `page.tsx` god-component growth | High | Extract before adding routes |
| Shareable URLs for session filters/modals | Medium | nuqs on `/` |
| Align documentation with implementation | Medium | README drift |
| Testability of upload and multi-step flows | Medium | Store unit tests |
| Minimal new dependencies | Medium | Zustand only (+ immer) |

---

## Considered options

### Option A: Status quo (no Zustand)

Continue with React Query + Context + local `useState`, lifting state per page.

| Pros | Cons |
|------|------|
| No new dependency | **Each route reimplements auth gating, modals, logout behavior** |
| Simple today | **No upload queue home** — progress lost on navigation |
| | File browser state trapped in one widget |
| README remains inaccurate | Does not scale to planned UI |

**Verdict:** Rejected for roadmap goals.

### Option B: Zustand for client UI only (recommended)

Add Zustand for cross-route UI orchestration. Keep TanStack Query, NextAuth, Context, and nuqs in their roles.

| Pros | Cons |
|------|------|
| **Works across routes without prop drilling** | New dependency |
| **Natural fit for upload queue / progress** | Team learns selector discipline |
| Matches README intent | Requires ADR discipline in code review |
| Small API; React 19 compatible | Logout must reset new slices |
| Devtools for debugging multi-step flows | |

**Verdict:** Recommended.

### Option C: Redux Toolkit

| Pros | Cons |
|------|------|
| Mature ecosystem | Overlaps with TanStack Query for server data |
| | High ceremony for a portal-sized app |
| | Upload progress does not require normalized entity store |

**Verdict:** Rejected — TanStack Query already covers server cache.

### Option D: Expand React Context

| Pros | Cons |
|------|------|
| No new dependency | Re-render cost for upload progress updates |
| | Provider nesting grows with each route feature |
| | Awkward imperative access (cancel upload from outside tree) |

**Verdict:** Rejected — upload progress and queue management favor Zustand's imperative API.

### Option E: URL-only / nuqs for everything

| Pros | Cons |
|------|------|
| Shareable state | **Cannot represent upload bytes progress, File objects, or queues in URL** |
| | Pollutes URL for drawer/modal transient state |

**Verdict:** Rejected as sole strategy — nuqs complements Zustand for path/filters only.

---

## Decision

**We will adopt Option B: Zustand for client UI orchestration**, with a store design that includes **future slices for storage and uploads** (implemented incrementally).

**Related migrations (not stored in Zustand):**

1. Wire UI to existing React Query hooks (`useUserStorage`, `useSessionEvents`, etc.).
2. Slim `page.tsx` into a route shell before adding `/storage` and other routes.
3. Adopt nuqs for file browser path on the storage route.

We will **not** adopt Zustand for server/async data, auth identity, or deployment configuration.

---

## State boundaries

Every new piece of state MUST be classified before implementation:

```
┌─────────────────────────────────────────────────────────────────┐
│                        STATE CLASSIFICATION                      │
├─────────────────────┬───────────────────────────────────────────┤
│ TanStack Query      │ Server/async data: sessions, images,      │
│                     │ storage listings & quota, CANFAR auth     │
│                     │ status; upload/delete/create mutations    │
├─────────────────────┼───────────────────────────────────────────┤
│ NextAuth            │ OIDC session, token refresh, signIn/out   │
├─────────────────────┼───────────────────────────────────────────┤
│ React Context       │ Boot-time public runtime config (read-only │
│                     │ after hydration): useCanfar, serviceUrls  │
├─────────────────────┼───────────────────────────────────────────┤
│ nuqs                │ URL-shareable: launch form params,        │
│                     │ session filters, file browser path,     │
│                     │ pagination, deep-linked modals            │
├─────────────────────┼───────────────────────────────────────────┤
│ Zustand             │ Cross-route client UI: upload queue &     │
│                     │ progress, multi-select, global modals,    │
│                     │ navigation chrome, session operating IDs, │
│                     │ layout panels, toast/notification queue   │
├─────────────────────┼───────────────────────────────────────────┤
│ Local useState      │ Ephemeral: form field drafts, validation  │
│                     │ errors, MUI anchorEl, single-step wizards │
└─────────────────────┴───────────────────────────────────────────┘
```

### Classification rules

1. **If it came from an API** → TanStack Query (domain hooks in `src/lib/hooks/`).
2. **If it represents who is logged in (OIDC)** → NextAuth (`useSession` / `useAuthStatus`).
3. **If it is set once at deploy time** → `PublicRuntimeConfigProvider`.
4. **If a user should share or bookmark it** → nuqs (e.g. `?path=/data/project-x`).
5. **If it spans routes or persists across navigation within a session** → Zustand (e.g. upload queue).
6. **If only one component cares and it resets on unmount** → local `useState`.

### File management — worked example

| Concern | Owner | Example |
|---------|-------|---------|
| Directory listing | React Query | `useStorageNodes(username, path)` |
| Quota | React Query | `useUserStorageQuota(username)` |
| Upload/delete/create | React Query mutations | `useUploadFile`, `useDeleteStorageNode` |
| Current directory path | **nuqs** | `/storage?path=/data/foo` — bookmarkable |
| Selected files (multi-select) | **Zustand** | `storageUi.selectedPaths: Set<string>` |
| View mode (list/grid) | **Zustand** or local | Persist preference → Zustand `preferences` |
| Upload queue + progress | **Zustand** | `uploads.items[]` with `{ id, file, path, progress, status }` |
| Sort column in file table | **nuqs** or local | Shareable if product wants linkable sorted views |

**Upload flow pattern:**

```
User picks files → Zustand enqueueUpload(files, targetPath)
                → component calls useUploadFile.mutate per item
                → on progress: Zustand updateUploadProgress(id, pct)
                → on success: React Query invalidates storageKeys.nodeList + quota
                → on success: Zustand markUploadComplete(id)
Global UploadDrawer/Toast reads from Zustand — visible on any route
```

Server bytes are never stored in Zustand — only **client-side queue metadata and progress**.

### Explicit anti-patterns (do not do)

- Store file listings, quota, or session lists in Zustand.
- Mirror React Query cache into Zustand.
- Persist upload queue or selected files to `localStorage` (cleared on logout).
- Put `File` blobs in React Query cache.
- Put OIDC tokens in Zustand.
- Create a new god `page.tsx` per route — use feature components + shared store.

---

## Zustand store design

### Structure

One composed root store with slices. **Expect 6–8 slices** given the roadmap; split into multiple stores only if independent update rates cause measurable re-render issues.

**Location:** `src/lib/stores/`

```
src/lib/stores/
├── app-store.ts          # create() + middleware
├── types.ts              # slice interfaces
├── selectors.ts          # fine-grained hooks
├── slices/
│   ├── session-ui.ts     # Phase 1
│   ├── modals.ts         # Phase 1
│   ├── navigation.ts     # Phase 2
│   ├── storage-ui.ts     # Phase 4 (file browser)
│   ├── uploads.ts        # Phase 4 (upload queue)
│   └── preferences.ts    # Phase 5 (optional)
└── index.ts
```

### Store tree

```
useAppStore
│
├── sessionUi                         [Phase 1 — migrate from page.tsx]
│   ├── operatingSessionIds: Set<string>
│   ├── launchRequest: LaunchRequestState | null
│   └── actions: markOperating, clearOperating, setLaunchRequest, resetSessionUi
│
├── modals
│   ├── auth                          [Phase 1 — migrate from AppBarWithAuth]
│   │   ├── login, resetPassword, registration, oidcLoginPending
│   │   └── actions: open/close*, closeAllAuthModals
│   │
│   └── sessions                      [Phase 2]
│       ├── healthCheck: { open, checking }
│       ├── activeDetail: ActiveSessionDetail | null  (optional; prefer nuqs if deep-linked)
│       └── actions: openHealthCheck, closeHealthCheck, ...
│
├── navigation                        [Phase 2]
│   ├── mobileDrawerOpen: boolean
│   └── actions: open/close/toggleMobileDrawer
│
├── storageUi                         [Phase 4 — new /storage route]
│   ├── selectedPaths: Set<string>    Multi-select for bulk delete/move
│   ├── viewMode: 'list' | 'grid'
│   ├── clipboard: { op: 'copy'|'move'; paths: string[] } | null
│   └── actions:
│         selectPath, deselectPath, clearSelection, toggleSelect
│         setViewMode, setClipboard, clearClipboard
│         resetStorageUi()
│
├── uploads                           [Phase 4 — cross-route upload panel]
│   ├── items: UploadItem[]
│   │     UploadItem: { id, fileName, fileSize, targetPath, status, progress, error? }
│   ├── panelOpen: boolean            Global upload drawer expanded/collapsed
│   └── actions:
│         enqueueUpload(items: Omit<UploadItem, 'status'|'progress'>[])
│         updateUploadProgress(id, progress)
│         markUploadStatus(id, status, error?)
│         removeUpload(id), clearCompleted(), cancelUpload(id)
│         setPanelOpen(open), resetUploads()
│
└── preferences                       [Phase 5 — optional]
    ├── theme: 'light' | 'dark'
    ├── defaultStorageView: 'list' | 'grid'
    └── actions: setTheme, toggleTheme, setDefaultStorageView
```

**Note:** Current directory path is intentionally **not** in Zustand — use nuqs `?path=` on the storage route so paths are shareable and survive refresh.

### Type definitions (reference)

```typescript
type ThemeMode = 'light' | 'dark';
type AuthModalTrigger = 'auto' | 'manual';
type LaunchRequestStatus = 'requesting' | 'success' | 'error';
type UploadStatus = 'queued' | 'uploading' | 'success' | 'error' | 'cancelled';
type StorageViewMode = 'list' | 'grid';

interface LaunchRequestState {
  status: LaunchRequestStatus;
  error?: string;
  sessionData?: SessionFormData;
}

interface UploadItem {
  id: string;
  fileName: string;
  fileSize: number;
  targetPath: string;
  status: UploadStatus;
  progress: number; // 0–100
  error?: string;
}

interface ActiveSessionDetail {
  sessionId: string;
  kind: 'events' | 'logs' | 'delete' | 'renew';
}
```

### Middleware

| Middleware | Purpose |
|------------|---------|
| `devtools` | Debug multi-step upload and modal flows |
| `subscribeWithSelector` | Logout reset, upload cancellation |
| `persist` | **User preferences only** — theme, default view mode; NOT uploads or selection |
| `immer` | `Set` mutations, upload queue updates |

### Selector hooks

```typescript
// Cross-route — use in layout or global UploadPanel
useUploadQueue()
useActiveUploads()          // status === 'uploading' | 'queued'
useUploadPanelOpen()

// Route-specific — use in /storage
useStorageSelection()
useIsPathSelected(path: string)

// Existing portal
useIsSessionOperating(sessionId)
useLoginModal()
useMobileDrawer()
```

---

## Integration with existing systems

### TanStack Query — expand as primary server-state layer

| Hook file | Domain | Roadmap |
|-----------|--------|---------|
| `useSessions.ts` | Sessions CRUD, logs, events | Existing + possible `/sessions/[id]` route |
| `useImages.ts` | Container images, context | Existing launch form |
| `useAuth.ts` | CANFAR / OIDC abstraction | All routes |
| `useUserStorage.ts` | Quota, list, upload, delete, mkdir | **`/storage` route — primary consumer** |

**Phase 0 migration (required before heavy UI):**

| Component | Today | Target |
|-----------|-------|--------|
| `userStorageWidget.tsx` | manual `fetch` | `useUserStorageQuota()` |
| `eventsModal.tsx` | local fetch | `useSessionEvents(sessionId)` |
| New storage page | — | `useStorageNodes`, mutation hooks |

**Mutation + Zustand coordination:** Mutations stay in React Query. Zustand holds queue/progress; mutation `onMutate`/`onSuccess`/`onError` callbacks update Zustand items. Consider `XMLHttpRequest` or `fetch` with `ReadableStream` if upload progress events are needed — progress callbacks write to Zustand, not Query cache.

### NextAuth / dual auth (unchanged)

- Layout-level `AuthProvider` + `AppBarWithAuth` on all routes.
- `useAuthStatus()` gates `enabled` on storage and session queries.
- No route should implement its own auth check pattern — use shared hooks.

### nuqs — expand for navigable routes

| Route | nuqs params | Hook (existing or new) |
|-------|-------------|------------------------|
| `/` (sessions) | `search`, `page`, `sessionTypes`, `events`, `launch` | `useUrlState.ts` (wire or trim) |
| `/storage` | `path`, `sort`, `order` | **New:** `useStoragePath()`, `useStorageSorting()` |
| Launch form (embedded) | tab, image, resources | Already in `sessionLaunchForm.tsx` |

Add nuqs hooks to `useUrlState.ts` or `src/lib/hooks/useStorageUrlState.ts` alongside the storage route.

### Logout reset

On auth `true → false`, extend `useLogoutReset`:

1. Invalidate/remove non-auth React Query keys (existing).
2. Reset Zustand: `resetSessionUi()`, `closeAllAuthModals()`, `resetStorageUi()`, **`resetUploads()`** (cancel in-flight uploads if possible), `closeMobileDrawer()`.
3. Clear URL search params (existing).
4. Full page reload until Phase 0 complete; then revisit soft reset.

### Layout-level global UI (new)

Introduce optional layout components fed by Zustand:

```
RootLayout
  └── …providers…
        └── GlobalUploadPanel     ← reads uploads slice; mounted once
        └── AppBarWithAuth        ← reads modals.auth, navigation
        └── {children}            ← route pages
```

This ensures upload progress survives route changes without lifting state into each page.

---

## Migration plan

Two tracks: **Foundation** (required, sequential) and **Features** (after foundation gate).

```
Foundation Track                          Feature Track (blocked until gate)
─────────────────                         ─────────────────────────────────
F0  Server-state consistency              S1  /storage route (data layer)
F1  Zustand scaffold + core slices          S2  storageUi + uploads slices
F2  Remaining portal UI slices              S3  Global upload panel
F3  Layout shell + docs + gate review       S4  Additional routes
```

---

### Foundation track

#### F0: Server-state consistency (no Zustand)

- [ ] Migrate `userStorageWidget.tsx` → `useUserStorageQuota`
- [ ] Migrate `eventsModal.tsx` → `useSessionEvents`
- [ ] Slim `page.tsx` — extract `SessionsDashboard` feature component
- [ ] Add [docs/state-management.md](../state-management.md)
- [ ] Update README (tech stack, project structure, links to ADR + guide)

#### F1: Zustand scaffold + core slices

- [ ] Add `zustand` (+ `immer`) to `package.json`
- [ ] Create full `src/lib/stores/` tree (see “scaffold early” above)
- [ ] Implement `sessionUi` and `modals.auth` slices; stub `storageUi` + `uploads` with reset-only actions
- [ ] Define all TypeScript interfaces in `types.ts` (`UploadItem`, etc.) before feature work
- [ ] Move `operatingSessionIds` and auth modal state out of page/AppBar
- [ ] Extend `useLogoutReset` to call all slice reset actions
- [ ] Unit tests for implemented slices + logout reset

#### F2: Remaining portal UI slices

- [x] `navigation` slice — mobile drawer
- [x] `sessionUi.launchRequest` — launch overlay
- [x] `modals.sessions` — health check dialog
- [x] Trim unused `useUrlState.ts` exports (nuqs re-exports only; route hooks added when needed)

#### F3: Layout shell + gate review

- [ ] Mount `AppBarWithAuth` from root layout (or shared route-group layout)
- [ ] Introduce `useLogoutReset` at layout level (not page-only)
- [ ] Team review: verify **foundation gate** checklist
- [ ] Mark ADR **Accepted**

**Foundation complete → unlock feature track.**

---

### Feature track (after foundation gate)

#### S1: Storage route — data layer

- [ ] Add `src/app/storage/page.tsx` (thin shell, follows route conventions in guide)
- [ ] File browser via `useStorageNodes`, `useDeleteStorageNode`, `useCreateDirectory`
- [ ] nuqs: `useStoragePath()` for `?path=` (bookmarkable directories)
- [ ] Colocate storage feature under `src/lib/features/storage/` (optional but recommended)

#### S2: Storage route — client UI

- [ ] Implement `storageUi` slice (multi-select, view mode, clipboard)
- [ ] Implement `uploads` slice (queue, progress, cancel)
- [ ] Extend `uploadFile` API client for progress callbacks if needed

#### S3: Global upload panel

- [ ] `GlobalUploadPanel` in root layout
- [ ] Upload progress survives navigation between `/` and `/storage`
- [ ] Logout cancels in-flight uploads and clears queue

#### S4: Further routes and polish

- [ ] Additional routes (session detail, etc.) using same patterns
- [ ] Optional: `preferences` slice (theme migration)
- [ ] Optional: soft logout reset; RSC prefetch (follow-up ADR)

---

## Consequences

### Positive

- **Ready for multi-route portal** without per-page orchestration copy-paste.
- **Upload progress and file selection** have a defined, testable home.
- File browser paths bookmarkable via nuqs; upload queue survives navigation.
- Existing `useUserStorage` hooks become the storage route foundation — no greenfield API layer.
- Clear code-review checklist for new features.
- README and implementation aligned.

### Negative

- Upfront investment before first new route ships.
- Upload progress may require fetch/XHR changes if current `uploadFile` API client lacks progress callbacks.
- Temporary overlap during migration (some state local, some in store).
- Team must enforce boundaries — file listings in Zustand would be a review failure.

### Neutral

- Single store with slices is sufficient until profiling says otherwise.
- Theme can stay in Context through Phase 4.
- Session dashboard may remain `'use client'`; RSC optimization is a separate decision.

---

## Documentation (foundation deliverable)

Part of **F0**, not deferred:

1. [docs/state-management.md](../state-management.md) — developer guide
2. README tech stack and project structure updated
3. README links to ADR index and state-management guide

---

## Testing strategy

| Area | Approach |
|------|----------|
| Slice actions | Unit tests; reset store between tests |
| Upload queue lifecycle | enqueue → progress → complete → clear; cancel mid-upload |
| Logout reset | Clears uploads, selection, modals, query cache |
| Storage route | Integration: path nuqs sync, list refetch on mutation |
| React Query hooks | vitest for `useUserStorage` invalidation on upload/delete |
| Cross-route | Manual/E2E: start upload on `/storage`, navigate to `/`, panel still shows progress |

---

## Open questions for review

| # | Question | Options | Recommendation |
|---|----------|---------|----------------|
| 1 | **`/storage` route path and scope** | Widget expand vs dedicated route | **Dedicated route** — file management needs space; widget stays as summary on `/` |
| 2 | Upload progress API | Extend `uploadFile` with XHR/progress vs indeterminate spinner | **Progress callback** — required for multi-file UX; plan API client change in Phase 4 |
| 3 | Global upload panel vs page-local | Layout `GlobalUploadPanel` vs inline on `/storage` only | **Layout panel** — cross-route visibility |
| 4 | File path in URL | nuqs `?path=` vs path segments `/storage/data/foo` | **`?path=`** first — simpler; migrate to segments later if SEO matters |
| 5 | Theme in Zustand vs ThemeContext | Keep Context vs migrate | **Keep Context** until Phase 5 |
| 6 | Soft logout after migrations | Full reload vs store+query reset only | Revisit after Phase 4; **must cancel uploads** either way |
| 7 | `useUrlState.ts` on sessions route | Wire, defer, or delete unused | **Wire filters when `/` gets list UX**; delete dead exports otherwise |
| 8 | Feature folder `src/lib/features/` | Adopt vs keep flat `components/` | **Adopt when `/storage` lands** — colocate storage hooks + components |

---

## Alternatives rejected (summary)

| Option | Reason rejected |
|--------|-----------------|
| Status quo | Does not scale to multi-route + upload flows |
| Redux | Overlaps with TanStack Query |
| Context expansion | Poor fit for upload progress update frequency |
| URL-only state | Cannot represent File objects, queues, or progress |

---

## References

### Codebase

- Provider tree: `src/app/layout.tsx`
- Storage API + hooks: `src/lib/api/storage.ts`, `src/lib/hooks/useUserStorage.ts`
- Query defaults: `src/lib/providers/QueryProvider.tsx`
- Page orchestrator (to slim): `src/app/page.tsx`
- URL state: `src/lib/hooks/useUrlState.ts`
- Manual fetch (to migrate): `userStorageWidget.tsx`, `eventsModal.tsx`

### External

- [TanStack Query — Mutations](https://tanstack.com/query/latest/docs/framework/react/guides/mutations)
- [Zustand — Slices pattern](https://docs.pmnd.rs/zustand/guides/slices-pattern)
- [nuqs — Next.js App Router](https://nuqs.47ng.com/docs/adapters/next-app-router)

---

## Changelog

| Date | Change |
|------|--------|
| 2026-07-13 | Initial draft (Proposed) |
| 2026-07-13 | Revised: strategic direction for multi-route UI, file management, upload queue slices |
| 2026-07-13 | Revised: foundation-first strategy, foundation gate, Foundation vs Feature tracks, scaffold-early store shape |
