import { Injectable } from '@nestjs/common';

import { ProductsService } from 'src/modules/products/services/products.service';
import { SalesService } from 'src/modules/sales/services/sales.service';
import { CreateSaleProcessDto } from '../dto/input/create-sale-process.dto';
import { DataSource } from 'typeorm';
import { ProductOutputsService } from 'src/modules/product_outputs/services/product_outputs.service';

@Injectable()
export class SalesProcessService {
	constructor(
		private readonly dataSource: DataSource,
		private readonly salesService: SalesService,
		private readonly productOutputsService: ProductOutputsService,
		private readonly productsService: ProductsService
	){}

	async create(data: CreateSaleProcessDto){
		return this.dataSource.transaction(async (manager) => {
			const outputsPrepared = await this.productOutputsService.prepareData(data.outputs);
			const sale = await this.salesService.create({
				idStaff: data.idStaff,
				total: outputsPrepared.total
			},manager)
			const outputs = await this.productOutputsService.createManyForSale(sale.id,outputsPrepared.outputs,manager);
			return {
				...sale,
				outputs: outputs
			};
		});
	}
}
