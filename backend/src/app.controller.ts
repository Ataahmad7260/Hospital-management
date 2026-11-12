import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { Public } from './common/decorators/public.decorator';

function findPostmanFile(filename: string): string {
  const candidates = [
    path.resolve(process.cwd(), filename),
    path.resolve(process.cwd(), '..', filename),
    path.resolve(__dirname, '../../', filename),
    path.resolve(__dirname, '../', filename),
    path.resolve(__dirname, filename),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return candidates[0];
}

@Controller()
export class AppController {
  @Public()
  @Get()
  getHealth() {
    return {
      name: 'Hospital Management System API',
      status: 'healthy',
      version: '1.0.0',
      database: 'MongoDB (Replica Set: rs0)',
      documentation: '/api/docs',
      postmanCollection: '/api/docs/collection',
      postmanEnvironment: '/api/docs/environment',
      roles: ['ADMIN', 'DOCTOR', 'PATIENT', 'PHARMACIST'],
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('health')
  getHealthAlias() {
    return this.getHealth();
  }

  @Public()
  @Get('postman/collection')
  getPostmanCollection(@Res() res: Response) {
    const file = findPostmanFile('hospital-management.postman_collection.json');
    res.setHeader('Content-Disposition', 'attachment; filename="hospital-management.postman_collection.json"');
    res.setHeader('Content-Type', 'application/json');
    return res.sendFile(file);
  }

  @Public()
  @Get('postman/environment')
  getPostmanEnvironment(@Res() res: Response) {
    const file = findPostmanFile('hospital-management.postman_environment.json');
    res.setHeader('Content-Disposition', 'attachment; filename="hospital-management.postman_environment.json"');
    res.setHeader('Content-Type', 'application/json');
    return res.sendFile(file);
  }
}
