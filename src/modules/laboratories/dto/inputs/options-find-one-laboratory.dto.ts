import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsOptional } from "class-validator";
import { OptionsFindOne } from "src/common/utils";

export class OptionsFindOneLaboratory extends OptionsFindOne {
    onlyActive?: boolean = true;
}