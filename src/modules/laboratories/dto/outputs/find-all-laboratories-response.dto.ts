import { ApiProperty } from "@nestjs/swagger";
import { LaboratoryDto } from "../laboratory.dto";

export class FindAlllaboratoriesResponseDto {
    @ApiProperty({
        description: 'lista de laboratorios',
        type: [LaboratoryDto]
    })
    laboratories: LaboratoryDto[]
}