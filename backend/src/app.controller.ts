import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';

@ApiTags('Health & System')
@Controller()
export class AppController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'System health, API overview, and documentation info' })
  getHealth() {
    return {
      name: 'Hospital Management System API',
      status: 'healthy',
      version: '1.0.0',
      database: 'MongoDB (Replica Set: rs0)',
      documentation: '/api/docs',
      roles: ['ADMIN', 'DOCTOR', 'PATIENT', 'PHARMACIST'],
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'System health check alias' })
  getHealthAlias() {
    return this.getHealth();
  }
}
