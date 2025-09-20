import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsBoolean, IsIn } from "class-validator";
import { Type, Transform } from "class-transformer";
import { string } from "joi";
import { toBoolean } from "src/common/utils";

export class FindAllLaboratoryParamsDto {
    @ApiPropertyOptional({
        description: "Filtrar por nombre de laboratorio (coincidencia aproximada)",
        type: String,
        example: "Central",
        default: "",
    })
    @IsOptional()
    @IsString()
    name: string = '';

    @ApiPropertyOptional({
        description: "Filtrar por laboratorios activos o inactivos",
        type: Boolean,
        example: true,
        default: true,
    })
    @IsOptional()
    @Transform(({ value }) => (toBoolean(value,true)))
    isActive: boolean = true;

    @ApiPropertyOptional({
        description: "Ordenar por fecha de creación (ASC o DESC)",
        type: String,
        enum: ["ASC", "DESC"],
        example: "ASC",
        default: "DESC",
    })
    @IsOptional()
    @IsString()
    @IsIn(["ASC", "DESC"])
    createdAt: "ASC" | "DESC" = 'DESC';

    @ApiPropertyOptional({
        description: "Ordenar por fecha de actualización (ASC o DESC)",
        type: String,
        enum: ["ASC", "DESC"],
        example: "ASC",
        default: "DESC",
    })
    @IsOptional()
    @IsString()
    @IsIn(["ASC", "DESC"])
    updatedAt: "ASC" | "DESC" = 'DESC';
}
