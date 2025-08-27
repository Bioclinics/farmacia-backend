import { Module } from '@nestjs/common';
import { MyConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { EmailModule } from './shared/services/email/email.module';

@Module({
	imports: [
		MyConfigModule,
		DatabaseModule,
		EmailModule,
	],
})
export class AppModule { }
