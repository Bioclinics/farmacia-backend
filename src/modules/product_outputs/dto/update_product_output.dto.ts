import { PartialType } from "@nestjs/swagger";
import { CreateProductOutputDto } from "./create_product_output.dto";

export class UpdateProductOutputDto extends PartialType(CreateProductOutputDto) {}
