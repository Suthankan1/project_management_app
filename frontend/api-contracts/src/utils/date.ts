function isDateOnlyString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function normalizeDate(value: unknown): Date | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;

  if (Array.isArray(value)) {
    const [year, month, day, hour = 0, minute = 0, second = 0, ms = 0] = value;
    if (year !== undefined && month !== undefined && day !== undefined) {
      const d = new Date(year, month - 1, day, hour, minute, second, ms);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    if (typeof value === 'string' && isDateOnlyString(value)) {
      const [year, month, day] = value.split('-').map(Number);
      const localDate = new Date(year, month - 1, day);
      return isNaN(localDate.getTime()) ? null : localDate;
    }

    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

export function normalizeDateToISO(value: unknown): string | null {
  const d = normalizeDate(value);
  return d ? d.toISOString() : null;
}

export function formatLocalDate(value: unknown): string | null {
  const d = normalizeDate(value);
  if (!d) return null;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatLocalDateTime(value: unknown): string | null {
  const d = normalizeDate(value);
  if (!d) return null;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  const second = String(d.getSeconds()).padStart(2, '0');
  const millisecond = String(d.getMilliseconds()).padStart(3, '0');
  return `${year}-${month}-${day}T${hour}:${minute}:${second}.${millisecond}`;
}
