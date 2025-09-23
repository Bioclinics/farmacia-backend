// src/database/database.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MyConfigModule } from 'src/config/config.module';
import { MyDataBaseConfig } from 'src/config/services/database.config';

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [MyConfigModule],
            inject: [MyDataBaseConfig],
            useFactory: (configService: MyDataBaseConfig) => {
                const dbConfig = configService.get();
                return {
                    type: 'postgres',
                    host: 'localhost',
                    port: 5432,
                    username: 'postgres',
                    password: '12345',
                    database: 'bd_bioclinics_farmacia',
                    autoLoadEntities: true,
                    synchronize: false,
                    logging: dbConfig.logging ?? false,
                };
            },
        }),
    ],
})
export class DatabaseModule { }
