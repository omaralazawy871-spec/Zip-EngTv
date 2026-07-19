import type { Channel } from './channel';
import type { Category } from './category';
import type { Source } from './source';

export interface BackupData {
  exported_at: string;
  channels: Channel[];
  categories: Category[];
  sources: Source[];
  settings: { key: string; value: string }[];
}
