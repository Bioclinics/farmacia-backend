import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { ProductOutput } from '../entities/product_output.entity';
import { CreateProductOutputDto } from '../dto/create_product_output.dto';
import { UpdateProductOutputDto } from '../dto/update_product_output.dto';
import { Product } from 'src/modules/products/entities/product.entity';

@Injectable()
export class ProductOutputsService {
  constructor(
    @InjectRepository(ProductOutput)
    private readonly productOutputsRepository: Repository<ProductOutput>,
  ) {}

  async findAll(): Promise<ProductOutput[]> {
    return await this.productOutputsRepository.find();
  }

  async create(dto: CreateProductOutputDto): Promise<ProductOutput> {
    const subtotal = dto.subtotal ?? dto.quantity * dto.unit_price;

    const newOutput = this.productOutputsRepository.create({
      ...dto,
      subtotal,
    });

    return await this.productOutputsRepository.save(newOutput);
  }

  async findOne(id: number): Promise<ProductOutput | null> {
    return await this.productOutputsRepository.findOneBy({ id_output: id });
  }

  async update(id: number, dto: UpdateProductOutputDto): Promise<ProductOutput | null> {
    await this.productOutputsRepository.update(id, dto);
    return await this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.productOutputsRepository.delete(id);
  }

  /**
   * Prepare outputs: ensure subtotal is present and calculate total
   */
  async prepareData(outputs: any[]): Promise<{ total: number; outputs: any[] }>{
    let total = 0;
    const out = outputs.map(o => {
      const subtotal = o.subtotal ?? (o.quantity * (o.unit_price ?? o.unitPrice));
      total += Number(subtotal);
      return {
        ...o,
        subtotal
      };
    });
    return { total, outputs: out };
  }

  /**
   * Create many outputs for a sale inside a transaction manager and adjust product stock
   */
  async createManyForSale(saleId: number, outputs: any[], manager: EntityManager): Promise<ProductOutput[]>{
    const repo = manager.getRepository(ProductOutput);
    const productRepo = manager.getRepository(Product);
    const created: ProductOutput[] = [];

    for(const o of outputs){
      const idProduct = o.id_product ?? o.idProduct ?? o.idProduct;
      const unitPrice = o.unit_price ?? o.unitPrice ?? o.unit_price;
      const isAdjustment = o.is_adjustment ?? o.isAdjustment ?? false;

      const toCreate = repo.create({
        id_sale: saleId,
        id_product: idProduct,
        quantity: o.quantity,
        unit_price: unitPrice,
        subtotal: o.subtotal,
        is_adjustment: isAdjustment,
        reason: o.reason,
      });

      const saved = await repo.save(toCreate);
      created.push(saved);

      // adjust product stock (reduce by quantity)
      try{
        const product = await productRepo.findOne({ where: { id_product: saved.id_product } });
        if(product){
          product.stock = (product.stock ?? 0) - (saved.quantity ?? 0);
          await productRepo.save(product);
        }
      }catch(e){
        // ignore stock update errors here; transaction will roll back if needed
        throw e;
      }
    }

    return created;
  }
}
