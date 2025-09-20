import { ApiProperty } from "@nestjs/swagger"

export class LaboratoryDto {
    @ApiProperty({
        description: 'Id del laboratorio',
        type: String
    })
    id: number

    @ApiProperty({
        description: 'Nombre del laboratorio',
        type: String
    })
    name: string

    @ApiProperty({
        description: 'Determina si el laboratorio esta activo',
        type: Boolean
    })
    isActive: boolean
}