import { ApiProperty } from '@nestjs/swagger';

/**
 * Generic paginated response shape used across the API.
 */
export class PaginatedResponseDto<T = any> {
  @ApiProperty({ description: 'Array of items' })
  data: T[];

  @ApiProperty({ description: 'Total number of items' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Items per page (limit)' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  pages: number;
}
