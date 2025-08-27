import { BaseEntity, CreateDateColumn } from "typeorm";

export class BaseOneEntity extends BaseEntity {
    @CreateDateColumn({ name: 'created_at', type: 'timestamp without time zone' })
    createdAt: Date
}