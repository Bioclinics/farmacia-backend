import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, EntityManager } from "typeorm";
import { Sale } from "../entities/sale.entity";

@Injectable()
export class SalesService {
    constructor(
        @InjectRepository(Sale)
        private readonly salesRepository: Repository<Sale>,
    ) {}

    async findAll(filters?: { date?: string }): Promise<Sale[]> {
        const qb = this.salesRepository.createQueryBuilder('sale')
            .leftJoinAndSelect('sale.user', 'user')
            .orderBy('sale.created_at', 'DESC');

        if (filters?.date) {
            // filter by exact day (UTC)
            const start = `${filters.date}T00:00:00.000Z`
            const end = `${filters.date}T23:59:59.999Z`
            qb.andWhere('sale.created_at BETWEEN :start AND :end', { start, end })
        }

        return await qb.getMany();
    }

    async create(payload: { idUser: number; total: number; notes?: string }, manager?: EntityManager): Promise<Sale> {
        const repo = manager ? manager.getRepository(Sale) : this.salesRepository;
        const newSale = repo.create({
            idUser: payload.idUser,
            total: payload.total,
            notes: payload.notes ?? null,
        } as Partial<Sale>);

        return await repo.save(newSale);
    }
}
