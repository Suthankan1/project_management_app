export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export {
  normalizeDate,
  normalizeDateToISO,
  formatLocalDate,
  formatLocalDateTime,
} from '@planora/contracts';
