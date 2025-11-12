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

    async findAll(): Promise<Sale[]> {
        return await this.salesRepository.find();
    }

    async create(payload: { idStaff: number; total: number; notes?: string }, manager?: EntityManager): Promise<Sale> {
        const repo = manager ? manager.getRepository(Sale) : this.salesRepository;
        const newSale = repo.create({
            idStaff: payload.idStaff,
            total: payload.total,
            notes: payload.notes ?? null,
        } as Partial<Sale>);

        return await repo.save(newSale);
    }
}
