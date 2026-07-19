process.env.ADMIN_JWT_SECRET = "test-secret-key";
process.env.XTREAM_ENCRYPTION_KEY = "test-encryption-key-32chars!";
process.env.ADMIN_PASSWORD = "test-admin-password";

import { vi } from "vitest";

function createDb(resolveValue: any = []) {
  const chainMethods = [
    "select", "from", "where", "orderBy", "limit", "offset",
    "insert", "values", "update", "set", "delete",
    "returning", "execute", "innerJoin", "leftJoin", "rightJoin",
    "on", "groupBy", "having",
  ];

  const makePromise = (val: any) => {
    const p = Promise.resolve(val) as any;
    for (const m of chainMethods) {
      p[m] = vi.fn(() => p);
    }
    return p;
  };

  const promise = makePromise(resolveValue);

  for (const m of chainMethods) {
    promise[m] = vi.fn(() => promise);
  }

  promise.transaction = vi.fn().mockImplementation(async (cb: (tx: any) => Promise<any>) => {
    const tx = createDb([]);
    return cb(tx);
  });

  return promise;
}

vi.mock("@workspace/db", () => {
  const channelsTable = { id: 1, sort_order: 0 };
  const categoriesTable = { id: 1, sort_order: 0 };
  const sourcesTable = { id: 1 };
  const settingsTable = { key: "" };
  const syncHistoryTable = { id: 1 };

  return {
    db: createDb([]),
    channelsTable,
    categoriesTable,
    sourcesTable,
    settingsTable,
    syncHistoryTable,
  };
});
