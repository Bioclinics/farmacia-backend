import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class UpdateLaboratoryDto {
    @ApiPropertyOptional({
        description: "Nombre del laboratorio",
        type: String,
        example: "Laboratorio Central",
    })
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(150)
    name?: string = '';
}
