import { and, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { z } from 'zod';
import { auth } from './auth.ts';
import { db } from './db.ts';
import { mergeProgressStates, progressStatesEqual } from './progress-merge.ts';
import { learnerProgress } from './progress-schema.ts';

const MAX_LEDGER = 100;
const MAX_BODY_BYTES = 256 * 1024;

/** Mirrors Progress in src/lib/progress.ts (server-side copy for validation). */
const legStatusSchema = z.enum(['done', 'open', 'locked']);

const gateProgressSchema = z.object({
  legs: z.record(z.string(), legStatusSchema),
  checkScore: z.number().min(0).max(100).nullable(),
  checkAttempts: z.number().int().nonnegative(),
  mastered: z.boolean(),
});

const labScenarioSchema = z.object({
  attempts: z.number().int().nonnegative(),
  bestScore: z.number(),
  goldViewed: z.boolean().optional(),
  rewardedAttempts: z.number().int().nonnegative().optional(),
});

const milesEventSchema = z.object({
  id: z.string().min(1),
  at: z.string().min(1),
  amount: z.number(),
  label: z.string(),
});

export const progressStateSchema = z.object({
  v: z.literal(1),
  gates: z.record(z.string(), gateProgressSchema),
  miles: z.number(),
  wings: z.array(z.string()),
  lab: z.record(z.string(), labScenarioSchema),
  pledgeSigned: z.boolean(),
  certifiedAt: z.string().nullable(),
  ledger: z.array(milesEventSchema),
});

export type ProgressState = z.infer<typeof progressStateSchema>;

const putBodySchema = z
  .object({
    expectedRevision: z.number().int().nonnegative(),
    state: progressStateSchema,
  })
  .strict();

/** Legacy import body — session supplies user identity; no user_id accepted. */
const importLegacyBodySchema = z
  .object({
    expectedRevision: z.number().int().nonnegative(),
    state: progressStateSchema,
  })
  .strict();

function emptyProgress(): ProgressState {
  return {
    v: 1,
    gates: {},
    miles: 0,
    wings: [],
    lab: {},
    pledgeSigned: false,
    certifiedAt: null,
    ledger: [],
  };
}

function capLedger(state: ProgressState): ProgressState {
  if (state.ledger.length <= MAX_LEDGER) return state;
  return { ...state, ledger: state.ledger.slice(0, MAX_LEDGER) };
}

function progressPayload(state: ProgressState, revision: number) {
  return { state, revision };
}

async function requireUserId(c: { req: { raw: Request } }): Promise<string | null> {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  return session?.user?.id ?? null;
}

export const progressRoutes = new Hono();

progressRoutes.get('/', async (c) => {
  const userId = await requireUserId(c);
  if (!userId) {
    return c.json({ error: 'unauthorized' }, 401);
  }

  const existing = await db.query.learnerProgress.findFirst({
    where: eq(learnerProgress.userId, userId),
  });

  if (existing) {
    return c.json(
      progressPayload(existing.state as ProgressState, existing.revision),
    );
  }

  const state = emptyProgress();
  const [created] = await db
    .insert(learnerProgress)
    .values({
      userId,
      state,
      revision: 0,
    })
    .returning();

  return c.json(progressPayload(created.state as ProgressState, created.revision));
});

progressRoutes.post(
  '/import-legacy',
  bodyLimit({
    maxSize: MAX_BODY_BYTES,
    onError: (c) => c.json({ error: 'payload_too_large' }, 413),
  }),
  async (c) => {
    const userId = await requireUserId(c);
    if (!userId) {
      return c.json({ error: 'unauthorized' }, 401);
    }

    let raw: unknown;
    try {
      raw = await c.req.json();
    } catch {
      return c.json({ error: 'invalid_json' }, 400);
    }

    const parsed = importLegacyBodySchema.safeParse(raw);
    if (!parsed.success) {
      return c.json({ error: 'invalid_progress', details: parsed.error.flatten() }, 400);
    }

    const { expectedRevision, state: legacyIncoming } = parsed.data;
    const legacy = capLedger(legacyIncoming);
    const now = new Date();

    try {
      const result = await db.transaction(async (tx) => {
        const locked = await tx
          .select()
          .from(learnerProgress)
          .where(eq(learnerProgress.userId, userId))
          .for('update');

        let row = locked[0];

        if (!row) {
          if (expectedRevision !== 0) {
            return {
              kind: 'conflict' as const,
              state: emptyProgress(),
              revision: 0,
            };
          }
          const [created] = await tx
            .insert(learnerProgress)
            .values({
              userId,
              state: emptyProgress(),
              revision: 0,
              lastActiveAt: now,
              updatedAt: now,
            })
            .returning();
          row = created;
        }

        if (row.revision !== expectedRevision) {
          return {
            kind: 'conflict' as const,
            state: row.state as ProgressState,
            revision: row.revision,
          };
        }

        // Already imported — return existing state unchanged (idempotent).
        if (row.legacyImportedAt != null) {
          return {
            kind: 'ok' as const,
            state: row.state as ProgressState,
            revision: row.revision,
            imported: false,
          };
        }

        const serverState = row.state as ProgressState;
        const merged = mergeProgressStates(serverState, legacy);
        const stateChanged = !progressStatesEqual(serverState, merged);
        const nextRevision = stateChanged ? row.revision + 1 : row.revision;

        const [updated] = await tx
          .update(learnerProgress)
          .set({
            state: merged,
            revision: nextRevision,
            legacyImportedAt: now,
            lastActiveAt: now,
            updatedAt: now,
          })
          .where(eq(learnerProgress.userId, userId))
          .returning();

        return {
          kind: 'ok' as const,
          state: updated.state as ProgressState,
          revision: updated.revision,
          imported: true,
        };
      });

      if (result.kind === 'conflict') {
        return c.json(
          {
            error: 'revision_conflict',
            ...progressPayload(result.state, result.revision),
          },
          409,
        );
      }

      return c.json({
        ...progressPayload(result.state, result.revision),
        imported: result.imported,
      });
    } catch {
      return c.json({ error: 'import_failed' }, 500);
    }
  },
);

progressRoutes.put(
  '/',
  bodyLimit({
    maxSize: MAX_BODY_BYTES,
    onError: (c) => c.json({ error: 'payload_too_large' }, 413),
  }),
  async (c) => {
    const userId = await requireUserId(c);
    if (!userId) {
      return c.json({ error: 'unauthorized' }, 401);
    }

    let raw: unknown;
    try {
      raw = await c.req.json();
    } catch {
      return c.json({ error: 'invalid_json' }, 400);
    }

    const parsed = putBodySchema.safeParse(raw);
    if (!parsed.success) {
      return c.json({ error: 'invalid_progress', details: parsed.error.flatten() }, 400);
    }

    const { expectedRevision, state: incoming } = parsed.data;
    const state = capLedger(incoming);
    const now = new Date();

    const updated = await db
      .update(learnerProgress)
      .set({
        state,
        revision: expectedRevision + 1,
        lastActiveAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(learnerProgress.userId, userId),
          eq(learnerProgress.revision, expectedRevision),
        ),
      )
      .returning();

    if (updated.length > 0) {
      const row = updated[0];
      return c.json(progressPayload(row.state as ProgressState, row.revision));
    }

    const current = await db.query.learnerProgress.findFirst({
      where: eq(learnerProgress.userId, userId),
    });

    if (!current) {
      // First write: only succeed when client expects revision 0.
      if (expectedRevision !== 0) {
        return c.json(
          {
            error: 'revision_conflict',
            ...progressPayload(emptyProgress(), 0),
          },
          409,
        );
      }

      try {
        const [created] = await db
          .insert(learnerProgress)
          .values({
            userId,
            state,
            revision: 1,
            lastActiveAt: now,
            updatedAt: now,
          })
          .returning();
        return c.json(progressPayload(created.state as ProgressState, created.revision));
      } catch {
        const raced = await db.query.learnerProgress.findFirst({
          where: eq(learnerProgress.userId, userId),
        });
        if (!raced) {
          return c.json({ error: 'write_failed' }, 500);
        }
        return c.json(
          {
            error: 'revision_conflict',
            ...progressPayload(raced.state as ProgressState, raced.revision),
          },
          409,
        );
      }
    }

    return c.json(
      {
        error: 'revision_conflict',
        ...progressPayload(current.state as ProgressState, current.revision),
      },
      409,
    );
  },
);
