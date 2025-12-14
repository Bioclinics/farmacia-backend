import { CompositionProductsReportDto } from '../dto/composition-products-report.dto';
import { CompositionSalesReportDto } from '../dto/composition-sales-report.dto';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 200;

export interface PaginationParams {
  search?: string;
  page: number;
  limit: number;
}

export function parsePagination(query: Record<string, any>): PaginationParams {
  const rawPage = Number(query?.page);
  const rawLimit = Number(query?.limit);

  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : DEFAULT_PAGE;
  const limitCandidate = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.floor(rawLimit) : undefined;
  const limit = limitCandidate ? Math.min(limitCandidate, MAX_LIMIT) : DEFAULT_LIMIT;

  const search = typeof query?.search === 'string' && query.search.trim() ? query.search.trim() : undefined;

  return { page, limit, search };
}

export function parseProductsReportFilters(query: Record<string, any>): CompositionProductsReportDto {
  return {
    compositionIds: parseNumericArray(query?.compositionIds),
    includeInactiveProducts: parseBooleanFlag(query?.includeInactiveProducts),
  };
}

export function parseSalesReportFilters(query: Record<string, any>): CompositionSalesReportDto {
  return {
    compositionIds: parseNumericArray(query?.compositionIds),
    includeInactiveProducts: parseBooleanFlag(query?.includeInactiveProducts),
    startDate: parseDateValue(query?.startDate),
    endDate: parseDateValue(query?.endDate),
  };
}

export function parseNumericArray(raw: unknown): number[] | undefined {
  if (raw === undefined || raw === null || raw === '') {
    return undefined;
  }

  const values = Array.isArray(raw)
    ? raw
    : typeof raw === 'string'
    ? raw.split(',')
    : [raw];

  const parsed = values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0)
    .map((value) => Math.floor(value));

  return parsed.length ? Array.from(new Set(parsed)) : undefined;
}

export function parseBooleanFlag(raw: unknown): boolean | undefined {
  if (raw === undefined || raw === null || raw === '') {
    return undefined;
  }

  if (typeof raw === 'boolean') {
    return raw;
  }

  if (typeof raw === 'number') {
    if (raw === 1) return true;
    if (raw === 0) return false;
  }

  if (typeof raw === 'string') {
    const normalized = raw.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') {
      return true;
    }
    if (normalized === 'false' || normalized === '0') {
      return false;
    }
  }

  return undefined;
}

export function parseDateValue(raw: unknown): string | undefined {
  if (typeof raw !== 'string' || !raw.trim()) {
    return undefined;
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? undefined : raw;
}
