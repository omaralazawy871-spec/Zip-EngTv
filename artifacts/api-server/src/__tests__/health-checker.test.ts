import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { runHealthCheck } from "../lib/health-checker";

describe("health-checker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty summary when no channels to check", async () => {
    const { db } = await import("@workspace/db");
    // Mock select chain to return empty array
    (db.select as any).mockReturnThis();
    (db.from as any).mockReturnThis();
    (db.where as any).mockResolvedValue([]);

    const result = await runHealthCheck({ ids: [] });
    expect(result.checked).toBe(0);
    expect(result.healthy).toBe(0);
    expect(result.broken).toBe(0);
  });

  it("should handle missing ids option gracefully", async () => {
    const { db } = await import("@workspace/db");
    (db.select as any).mockReturnThis();
    (db.from as any).mockReturnThis();
    (db.where as any).mockResolvedValue([]);

    const result = await runHealthCheck();
    expect(result.checked).toBe(0);
  });

  it("should skip when requested IDs exceed found channels", async () => {
    const { db } = await import("@workspace/db");
    (db.select as any).mockReturnThis();
    (db.from as any).mockReturnThis();
    (db.where as any).mockResolvedValue([]);

    const result = await runHealthCheck({ ids: [999] });
    expect(result.skipped).toBe(1);
  });
});
