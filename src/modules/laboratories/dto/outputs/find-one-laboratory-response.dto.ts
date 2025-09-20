import { ApiProperty } from "@nestjs/swagger";
import { LaboratoryDto } from "../laboratory.dto";

export class FindOnelaboratoryResponse {
    @ApiProperty({
        description: 'Laboratorio solicitado',
        type: LaboratoryDto
    })
    laboratory: LaboratoryDto
}