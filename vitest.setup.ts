import { vi } from 'vitest';

// Pre-existing image-parser.test.ts calls `jest.spyOn(...)`. Vitest's
// equivalent is `vi.spyOn`; alias `jest` to `vi` so the legacy test runs
// without needing to be rewritten. New tests should use `vi` directly.
(globalThis as unknown as { jest: typeof vi }).jest = vi;
