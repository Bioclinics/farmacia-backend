import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength, MinLength } from "class-validator";

export class CreateLaboratoryDto {
    @ApiProperty({
        description: 'Nombre de laboratorio',
        type: String
    })
    @IsString()
    @MinLength(1)
    @MaxLength(150)
    name: string
}
