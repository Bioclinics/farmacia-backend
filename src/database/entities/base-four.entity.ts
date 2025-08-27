import { Column } from "typeorm";
import { BaseThreeEntity } from "./base-three.entity";

export class BaseFour extends BaseThreeEntity {
    @Column({ name: 'is_active', type: 'boolean' })
    isActive: boolean
}