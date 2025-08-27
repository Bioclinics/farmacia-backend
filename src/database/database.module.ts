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
                    type: (dbConfig.type ?? 'postgres') as any,
                    host: dbConfig.host ?? undefined,
                    port: dbConfig.port,
                    username: dbConfig.username ?? undefined,
                    password: dbConfig.password ?? undefined,
                    database: dbConfig.database ?? undefined,
                    autoLoadEntities: true,
                    synchronize: false,
                    logging: dbConfig.logging ?? false,
                };
            },
        }),
    ],
})
export class DatabaseModule { }
