/**
 * URL state utilities (nuqs).
 *
 * Use nuqs for bookmarkable route state (filters, paths, pagination).
 * Launch form params are wired directly in `sessionLaunchForm.tsx`.
 * Storage path hooks will be added in `useStorageUrlState.ts` with the /storage route.
 *
 * @see docs/state-management.md
 */

export {
  useQueryState,
  useQueryStates,
  parseAsString,
  parseAsInteger,
  parseAsBoolean,
  parseAsArrayOf,
  parseAsStringEnum,
} from 'nuqs';
