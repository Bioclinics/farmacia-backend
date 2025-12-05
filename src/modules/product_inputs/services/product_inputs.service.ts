import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ProductInput } from "../entities/product_input.entity";
import { Product } from 'src/modules/products/entities/product.entity';
import { Laboratory } from 'src/modules/laboratories/entities/laboratory.entity';
import { CreateProductInputDto } from '../dto/create_product_input.dto';
import { UpdateProductInputDto } from '../dto/update_product_input.dto';

@Injectable()
export class ProductInputsService {
  constructor(
    @InjectRepository(ProductInput)
    private readonly productInputsRepository: Repository<ProductInput>
  ) {}

  async create(dto: CreateProductInputDto): Promise<ProductInput> {
    const subtotal = dto.subtotal ?? Number(dto.unitCost ?? 0) * dto.quantity * dto.unitsPerBox;
    const input = this.productInputsRepository.create({
      ...dto,
      subtotal,
    });
    return await this.productInputsRepository.save(input);
  }

  async findAll(): Promise<ProductInput[]> {
    // Enrich product inputs with product and laboratory info, ordered newest first
    const rows = await this.productInputsRepository.createQueryBuilder('i')
      .leftJoin(Product, 'p', 'p.id_product = i.idProduct')
      .leftJoin(Laboratory, 'l', 'l.id_laboratory = i.idLaboratory')
      .select([
        'i.id AS id_input',
        'i.idProduct AS id_product',
        'i.idLaboratory AS id_laboratory',
        'i.quantity AS quantity',
        'i.unitsPerBox AS units_per_box',
        'i.unitCost AS unit_cost',
        'i.subtotal AS subtotal',
        'i.isAdjustment AS is_adjustment',
        'i.reason AS reason',
        'i.createdAt AS created_at',
        'p.id_product AS product_id',
        'p.name AS product_name',
        'p.price AS product_price',
        'p.stock AS product_stock',
        'l.id_laboratory AS lab_id',
        'l.name AS lab_name',
      ])
      .orderBy('i.createdAt', 'DESC')
      .getRawMany();

    return rows.map(r => ({
      id_input: r.id_input,
      id_product: r.id_product,
      id_laboratory: r.id_laboratory,
      quantity: r.quantity,
      units_per_box: r.units_per_box,
      unitsPerBox: r.units_per_box,
      unit_cost: r.unit_cost,
      subtotal: r.subtotal,
      is_adjustment: r.is_adjustment,
      reason: r.reason,
      created_at: r.created_at,
      product: {
        id_product: r.product_id,
        name: r.product_name,
        price: r.product_price,
        stock: r.product_stock,
      },
      laboratory: {
        id_laboratory: r.lab_id,
        name: r.lab_name,
      }
    })) as any;
  }

  async findOne(id: number): Promise<ProductInput> {
    const input = await this.productInputsRepository.findOne({ where: { id } });
    if (!input) throw new NotFoundException(`ProductInput #${id} not found`);
    return input;
  }

  async update(id: number, dto: UpdateProductInputDto): Promise<ProductInput> {
    const input = await this.findOne(id);
    Object.assign(input, dto);
    return await this.productInputsRepository.save(input);
  }

  async remove(id: number): Promise<void> {
    const input = await this.findOne(id);
    await this.productInputsRepository.remove(input);
  }
}
