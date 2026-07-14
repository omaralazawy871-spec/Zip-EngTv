/**
 * Drizzle returns `timestamp` columns as native JS `Date` objects, but the
 * generated Zod response schemas (from the OpenAPI spec) expect date fields
 * as ISO strings. Parsing a raw DB row directly against those schemas throws
 * a ZodError ("Expected string, received date"), which surfaces as a 500 on
 * every list/detail endpoint even though the query itself succeeded.
 *
 * This helper deep-converts any `Date` instance to an ISO string so rows
 * (or arrays of rows) can be safely passed into `SomeResponse.parse(...)`.
 */
export function serializeDates<T>(value: T): T {
  if (value instanceof Date) {
    return value.toISOString() as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => serializeDates(item)) as unknown as T;
  }
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      result[key] = serializeDates(val);
    }
    return result as T;
  }
  return value;
}
