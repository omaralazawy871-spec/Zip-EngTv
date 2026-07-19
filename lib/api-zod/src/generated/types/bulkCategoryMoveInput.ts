export interface BulkCategoryMoveInput {
  /** @minItems 1 */
  ids: number[];
  /** @nullable */
  category_id: number | null;
}
