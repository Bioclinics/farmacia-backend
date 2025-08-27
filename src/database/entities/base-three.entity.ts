import { Column } from "typeorm";
import { BaseTwoEntity } from "./base-two.entity";

export class BaseThreeEntity extends BaseTwoEntity {
    @Column({ name: 'is_deleted', type: 'boolean' })
    isDeleted: boolean
}