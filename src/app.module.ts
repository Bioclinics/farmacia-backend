import { Module } from '@nestjs/common';
import { MyConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { EmailModule } from './shared/services/email/email.module';
import { ProductsModule } from './modules/products/products.module';
import { ProductOutputsModule } from './modules/product_outputs/product_outputs.module';
import { ProductInputsModule } from './modules/product_inputs/product_inputs.module';
import { ProductTypesModule } from './modules/product_types/product_types.module';
import { LaboratoriesModule } from './modules/laboratories/laboratories.module';
import { SalesModule } from './modules/sales/sales.module';
import { StaffModule } from './modules/staff/staff.module';
import { SalesProcessModule } from './app/sales-process/sales-process.module';

@Module({
	imports: [
		MyConfigModule,
		DatabaseModule,
		EmailModule,
		ProductsModule,
		ProductOutputsModule,
		ProductInputsModule,
		ProductTypesModule,
		LaboratoriesModule,
		SalesModule,
		StaffModule,
		SalesProcessModule,
	],
})
export class AppModule { }
