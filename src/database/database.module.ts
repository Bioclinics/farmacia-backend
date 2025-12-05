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
                    type: dbConfig.type as 'postgres',
                    host: dbConfig.host ?? 'localhost',
                    port: dbConfig.port ?? 5432,
                    username: dbConfig.username ?? 'postgres',
                    password: dbConfig.password ?? '12345',
                    database: dbConfig.database ?? 'db-farmacia',
                    autoLoadEntities: true,
                    synchronize: false,
                    logging: dbConfig.logging ?? false,
                };
            },
        }),
    ],
})
export class DatabaseModule { }
