/**
 * Firestore rules tests for learnerActivity + progressHistory.
 * Run via: npm run test:rules
 * Requires the Firestore emulator (firebase emulators:exec).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

const PROJECT_ID = 'iaa-prompt-academy-rules-test';

const emptyProgress = {
  v: 1,
  gates: {},
  miles: 0,
  wings: [],
  lab: {},
  pledgeSigned: false,
  certifiedAt: null,
  ledger: [],
};

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv?.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

async function seedAdmin(uid: string) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'users', uid), {
      email: 'admin@example.com',
      role: 'admin',
      active: true,
      status: 'active',
      firstName: 'Ada',
      lastName: 'Admin',
      displayName: 'Ada Admin',
    });
  });
}

async function seedLearner(uid: string) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'users', uid), {
      email: `${uid}@example.com`,
      role: 'learner',
      active: true,
      status: 'active',
      firstName: 'Lee',
      lastName: 'Learner',
      displayName: 'Lee Learner',
    });
  });
}

describe('firestore.rules learnerActivity + progressHistory', () => {
  it('allows a learner to create and heartbeat their own activity session', async () => {
    await seedLearner('learner1');
    const db = testEnv.authenticatedContext('learner1', { email: 'learner1@example.com' }).firestore();

    await assertSucceeds(
      setDoc(doc(db, 'learnerActivity', 'learner1'), {
        uid: 'learner1',
        totalActiveSeconds: 0,
        lastActiveAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );

    await assertSucceeds(
      setDoc(doc(db, 'learnerActivity', 'learner1', 'sessions', 's1'), {
        uid: 'learner1',
        startedAt: serverTimestamp(),
        lastHeartbeatAt: serverTimestamp(),
        endedAt: null,
        activeSeconds: 0,
        status: 'active',
        currentRoute: '/journey',
        gateId: null,
      }),
    );

    await assertSucceeds(
      updateDoc(doc(db, 'learnerActivity', 'learner1', 'sessions', 's1'), {
        activeSeconds: 60,
        lastHeartbeatAt: serverTimestamp(),
        currentRoute: '/journey',
        gateId: null,
        status: 'active',
        endedAt: null,
      }),
    );
  });

  it('rejects reading or writing another learner’s activity', async () => {
    await seedLearner('learner1');
    await seedLearner('learner2');
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'learnerActivity', 'learner1'), {
        uid: 'learner1',
        totalActiveSeconds: 10,
        lastActiveAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    const db = testEnv.authenticatedContext('learner2', { email: 'learner2@example.com' }).firestore();
    await assertFails(getDoc(doc(db, 'learnerActivity', 'learner1')));
    await assertFails(
      setDoc(doc(db, 'learnerActivity', 'learner1'), {
        uid: 'learner1',
        totalActiveSeconds: 0,
        lastActiveAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('allows an active admin to read learner activity', async () => {
    await seedAdmin('admin1');
    await seedLearner('learner1');
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'learnerActivity', 'learner1'), {
        uid: 'learner1',
        totalActiveSeconds: 42,
        lastActiveAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    const db = testEnv.authenticatedContext('admin1', { email: 'admin@example.com' }).firestore();
    await assertSucceeds(getDoc(doc(db, 'learnerActivity', 'learner1')));
  });

  it('allows creating an immutable progress history revision and rejects updates/deletes', async () => {
    await seedLearner('learner1');
    const db = testEnv.authenticatedContext('learner1', { email: 'learner1@example.com' }).firestore();

    await assertSucceeds(
      setDoc(doc(db, 'progressHistory', 'learner1'), {
        uid: 'learner1',
        baselineRevision: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );

    await assertSucceeds(
      setDoc(doc(db, 'progressHistory', 'learner1', 'revisions', 'r0'), {
        uid: 'learner1',
        revision: 0,
        state: emptyProgress,
        changedAt: serverTimestamp(),
        source: 'baseline',
        isBaseline: true,
      }),
    );

    await assertFails(
      updateDoc(doc(db, 'progressHistory', 'learner1', 'revisions', 'r0'), {
        isBaseline: false,
      }),
    );

    await assertFails(deleteDoc(doc(db, 'progressHistory', 'learner1', 'revisions', 'r0')));
  });

  it('rejects history docs that spoof another uid or wrong revision id', async () => {
    await seedLearner('learner1');
    const db = testEnv.authenticatedContext('learner1', { email: 'learner1@example.com' }).firestore();

    await assertFails(
      setDoc(doc(db, 'progressHistory', 'learner1', 'revisions', 'r1'), {
        uid: 'other',
        revision: 1,
        state: emptyProgress,
        changedAt: serverTimestamp(),
        source: 'save',
        isBaseline: false,
      }),
    );

    await assertFails(
      setDoc(doc(db, 'progressHistory', 'learner1', 'revisions', 'r2'), {
        uid: 'learner1',
        revision: 1,
        state: emptyProgress,
        changedAt: serverTimestamp(),
        source: 'save',
        isBaseline: false,
      }),
    );
  });

  it('rejects session heartbeats that jump more than 120 seconds', async () => {
    await seedLearner('learner1');
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'learnerActivity', 'learner1', 'sessions', 's1'), {
        uid: 'learner1',
        startedAt: serverTimestamp(),
        lastHeartbeatAt: serverTimestamp(),
        endedAt: null,
        activeSeconds: 0,
        status: 'active',
        currentRoute: '/journey',
        gateId: null,
      });
    });

    const db = testEnv.authenticatedContext('learner1', { email: 'learner1@example.com' }).firestore();
    await assertFails(
      updateDoc(doc(db, 'learnerActivity', 'learner1', 'sessions', 's1'), {
        activeSeconds: 121,
        lastHeartbeatAt: serverTimestamp(),
        currentRoute: '/journey',
        gateId: null,
        status: 'active',
        endedAt: null,
      }),
    );
    await assertSucceeds(
      updateDoc(doc(db, 'learnerActivity', 'learner1', 'sessions', 's1'), {
        activeSeconds: 120,
        lastHeartbeatAt: serverTimestamp(),
        currentRoute: '/journey',
        gateId: null,
        status: 'active',
        endedAt: null,
      }),
    );
  });

  it('rejects session deletes', async () => {
    await seedLearner('learner1');
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'learnerActivity', 'learner1', 'sessions', 's1'), {
        uid: 'learner1',
        startedAt: serverTimestamp(),
        lastHeartbeatAt: serverTimestamp(),
        endedAt: null,
        activeSeconds: 0,
        status: 'active',
        currentRoute: '/journey',
        gateId: null,
      });
    });

    const db = testEnv.authenticatedContext('learner1', { email: 'learner1@example.com' }).firestore();
    await assertFails(deleteDoc(doc(db, 'learnerActivity', 'learner1', 'sessions', 's1')));
  });
});
