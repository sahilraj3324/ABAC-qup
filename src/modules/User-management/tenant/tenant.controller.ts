import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { TenantService } from './tenant.service.js';

@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get()
  async list() {
    return this.tenantService.listAll();
  }

  @Get(':tenantId')
  async get(@Param('tenantId') tenantId: string) {
    return this.tenantService.get(tenantId);
  }

  @Post()
  async create(
    @Body() body: {
      tenant_data: {
        name: string;
        owner_email?: string;
        owner_password?: string;
        owner_first_name?: string;
        owner_last_name?: string;
      }
    },
  ) {
    const { name, owner_email, owner_password, owner_first_name, owner_last_name } = body.tenant_data;
    if (owner_email && owner_password && owner_first_name && owner_last_name) {
      return this.tenantService.createWithOwner(name, owner_email, owner_password, owner_first_name, owner_last_name);
    }
    // Simple create without owner
    return this.tenantService.createWithOwner(name, `owner@${name.toLowerCase().replace(/\s+/g, '')}.local`, 'changeme123', 'Owner', name);
  }

  @Put(':tenantId')
  async update(
    @Param('tenantId') tenantId: string,
    @Body() body: { tenant_data: { name?: string; is_active?: boolean } },
  ) {
    return this.tenantService.update(tenantId, body.tenant_data.name, body.tenant_data.is_active);
  }

  @Delete(':tenantId')
  async delete(@Param('tenantId') tenantId: string) {
    return this.tenantService.delete(tenantId);
  }
}
