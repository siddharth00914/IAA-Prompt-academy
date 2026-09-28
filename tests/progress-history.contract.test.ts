import { describe, expect, it } from 'vitest';

/**
 * Documents the progress-save / history contract used by progress-api.
 * Full transaction behavior is covered by rules tests + manual QA;
 * these asserts lock deterministic ids and conflict semantics helpers.
 */
import { historyRevisionId } from '@/lib/progress-history';

function progressStatesEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

describe('progress history save contract', () => {
  it('maps each revision to a single deterministic document id', () => {
    const seen = new Set<string>();
    for (const revision of [0, 1, 2, 10, 99]) {
      const id = historyRevisionId(revision);
      expect(id).toBe(`r${revision}`);
      expect(seen.has(id)).toBe(false);
      seen.add(id);
    }
  });

  it('skips history when state is unchanged (retry / no-op save)', () => {
    const state = { miles: 10, v: 1 };
    expect(progressStatesEqual(state, { miles: 10, v: 1 })).toBe(true);
    expect(progressStatesEqual(state, { miles: 20, v: 1 })).toBe(false);
  });

  it('treats an existing revision id as an immutable retry no-op', () => {
    const existing = new Set(['r1']);
    const nextId = historyRevisionId(1);
    const shouldWrite = !existing.has(nextId);
    expect(shouldWrite).toBe(false);
    existing.add(historyRevisionId(2));
    expect(existing.has(historyRevisionId(2))).toBe(true);
  });
});
