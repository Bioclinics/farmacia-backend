import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DashboardService {
  constructor(private readonly dataSource: DataSource) {}

  private getLocalDateKey(date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getDayBounds(date?: string): { start: string; end: string; value: string } {
    const base = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : this.getLocalDateKey();
    return {
      value: base,
      start: `${base} 00:00:00`,
      end: `${base} 23:59:59.999`,
    };
  }

  private parseLimit(limit: number, fallback: number): number {
    if (!Number.isFinite(limit) || limit <= 0) return fallback;
    return Math.min(Math.floor(limit), 100);
  }

  async getKpis(date?: string) {
    const { start, end } = this.getDayBounds(date);

    const [salesToday, revenueToday, salesThisMonth, productsStats, ioToday] = await Promise.all([
      this.dataSource.query(
        `SELECT COUNT(*)::int AS total FROM sales WHERE created_at BETWEEN $1 AND $2`,
        [start, end],
      ),
      this.dataSource.query(
        `SELECT COALESCE(SUM(total), 0)::float AS total FROM sales WHERE created_at BETWEEN $1 AND $2`,
        [start, end],
      ),
      this.dataSource.query(
        `SELECT COUNT(*)::int AS total
         FROM sales
         WHERE date_trunc('month', created_at) = date_trunc('month', $1::timestamp)` ,
        [`${date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : this.getLocalDateKey()} 12:00:00`],
      ),
      this.dataSource.query(
        `SELECT
            COUNT(*)::int AS catalog,
          COUNT(*) FILTER (WHERE stock <= CASE WHEN COALESCE(min_stock, 0) > 0 THEN min_stock ELSE 5 END)::int AS low_stock,
            COUNT(*) FILTER (WHERE stock <= 0)::int AS out_stock
         FROM products
         WHERE is_deleted = false`,
      ),
      this.dataSource.query(
        `SELECT
            (SELECT COALESCE(SUM(quantity * units_per_box), 0)::int FROM products_inputs WHERE created_at BETWEEN $1 AND $2) AS inputs,
            (SELECT COALESCE(SUM(quantity), 0)::int FROM product_outputs WHERE created_at BETWEEN $1 AND $2) AS outputs`,
        [start, end],
      ),
    ]);

    const salesCount = Number(salesToday[0]?.total ?? 0);
    const revenue = Number(revenueToday[0]?.total ?? 0);

    return {
      salesToday: salesCount,
      revenueToday: revenue,
      salesThisMonth: Number(salesThisMonth[0]?.total ?? 0),
      averageTicketToday: salesCount > 0 ? revenue / salesCount : 0,
      catalogProducts: Number(productsStats[0]?.catalog ?? 0),
      lowStockProducts: Number(productsStats[0]?.low_stock ?? 0),
      outOfStockProducts: Number(productsStats[0]?.out_stock ?? 0),
      inputsToday: Number(ioToday[0]?.inputs ?? 0),
      outputsToday: Number(ioToday[0]?.outputs ?? 0),
    };
  }

  async getAlerts(limit = 30) {
    const safeLimit = this.parseLimit(limit, 30);
    return this.dataSource.query(
      `SELECT
          p.id_product AS "productId",
          p.name,
          p.stock,
          p.min_stock AS "minStock",
          CASE WHEN p.stock <= 0 THEN 'critical' ELSE 'warning' END AS severity
       FROM products p
       WHERE p.is_deleted = false
         AND p.stock <= CASE WHEN COALESCE(p.min_stock, 0) > 0 THEN p.min_stock ELSE 5 END
       ORDER BY (p.stock <= 0) DESC, p.stock ASC, p.name ASC
       LIMIT $1`,
      [safeLimit],
    );
  }

  async getSalesTrend(startDate?: string, endDate?: string) {
    const from = startDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate) ? startDate : this.getLocalDateKey();
    const to = endDate && /^\d{4}-\d{2}-\d{2}$/.test(endDate) ? endDate : from;

    return this.dataSource.query(
      `SELECT
          to_char(date_trunc('day', s.created_at), 'YYYY-MM-DD') AS date,
          COUNT(*)::int AS "salesCount",
          COALESCE(SUM(s.total), 0)::float AS "totalAmount"
       FROM sales s
         WHERE s.created_at BETWEEN $1::timestamp AND $2::timestamp + interval '23 hours 59 minutes 59.999 seconds'
       GROUP BY date_trunc('day', s.created_at)
       ORDER BY date_trunc('day', s.created_at) ASC`,
      [from, to],
    );
  }

  async getTopProducts(startDate?: string, endDate?: string, limit = 5) {
    const from = startDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate) ? startDate : this.getLocalDateKey();
    const to = endDate && /^\d{4}-\d{2}-\d{2}$/.test(endDate) ? endDate : from;
    const safeLimit = this.parseLimit(limit, 5);

    return this.dataSource.query(
      `SELECT
          p.id_product AS "productId",
          p.name,
          COALESCE(SUM(po.quantity), 0)::int AS quantity,
          COALESCE(SUM(po.subtotal), 0)::float AS amount
       FROM product_outputs po
       INNER JOIN products p ON p.id_product = po.id_product
         WHERE po.created_at BETWEEN $1::timestamp AND $2::timestamp + interval '23 hours 59 minutes 59.999 seconds'
       GROUP BY p.id_product, p.name
       ORDER BY quantity DESC, amount DESC
       LIMIT $3`,
      [from, to, safeLimit],
    );
  }

  async getInventoryMovements(date?: string, limit = 15) {
    const { start, end } = this.getDayBounds(date);
    const safeLimit = this.parseLimit(limit, 15);

    return this.dataSource.query(
      `SELECT * FROM (
          SELECT
            'input'::text AS type,
            pi.id_product AS "productId",
            p.name,
            (pi.quantity * pi.units_per_box)::int AS quantity,
            pi.created_at AS "createdAt"
          FROM products_inputs pi
          INNER JOIN products p ON p.id_product = pi.id_product
          WHERE pi.created_at BETWEEN $1 AND $2

          UNION ALL

          SELECT
            'output'::text AS type,
            po.id_product AS "productId",
            p.name,
            po.quantity,
            po.created_at AS "createdAt"
          FROM product_outputs po
          INNER JOIN products p ON p.id_product = po.id_product
          WHERE po.created_at BETWEEN $1 AND $2
       ) x
       ORDER BY x."createdAt" DESC
       LIMIT $3`,
      [start, end, safeLimit],
    );
  }
}
