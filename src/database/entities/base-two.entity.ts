import { UpdateDateColumn } from "typeorm";
import { BaseOneEntity } from "./base-one.entity";

export class BaseTwoEntity extends BaseOneEntity {
    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp without time zone' })
    updatedAt: Date
}