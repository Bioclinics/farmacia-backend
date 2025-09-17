import { Controller, Get } from "@nestjs/common";
import { StaffService } from "../services/staff.service";
import { Staff } from "../entities/staff.entity";

@Controller("staff")
export class StaffController {
    constructor(private readonly staffService: StaffService) {}

    @Get()
    async findAll(): Promise<Staff[]> {
        return await this.staffService.findAll();
    }
}
