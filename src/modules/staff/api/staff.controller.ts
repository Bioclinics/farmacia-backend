import { Controller, Get } from "@nestjs/common";
import { UseGuards } from '@nestjs/common';
import { Roles } from 'src/common/utils/roles.decorator';
import { RolesGuard } from 'src/common/utils/roles.guard';
import { RolesEnum } from 'src/shared/enums/roles.enum';
import { StaffService } from "../services/staff.service";
import { Staff } from "../entities/staff.entity";

@Controller("staff")
@UseGuards(RolesGuard)
export class StaffController {
    constructor(private readonly staffService: StaffService) {}

    @Get()
    @Roles(RolesEnum.ADMIN)
    async findAll(): Promise<Staff[]> {
        return await this.staffService.findAll();
    }
}
