import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as path from 'path';
import * as fs from 'fs';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { getPostmanHubHtml } from './postman/postman-hub.html';


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

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global API Prefix
  app.setGlobalPrefix('api/v1');

  // Global Cross-Origin Resource Sharing (CORS)
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global Validation Pipe for Request DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global Error Filter & Response Envelope
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger OpenAPI Documentation UI Setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('AURA Hospital Management System API')
    .setDescription(
      'Enterprise Clinical RBAC API: Patient Admissions, Doctor Consultations, Prescriptions, Pharmacy Dispensary, Hospital Billing, and Express Page Telemetry',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Input your Bearer JWT token to test role-protected endpoints',
        in: 'header',
      },
      'bearer',
    )
    .addTag('Health', 'Core system & MongoDB rs0 diagnostic endpoints')
    .addTag('Auth', 'Authentication, registration & JWT session tokens')
    .addTag('Users', 'Staff management & user role activation')
    .addTag('Doctors', 'Specialist directory & consultations')
    .addTag('Patients', 'Patient admissions, clinical files, and case overview')
    .addTag('Appointments', 'Consultations booking and scheduling queue')
    .addTag('Prescriptions', 'Clinical prescriptions & dispensary fulfillment')
    .addTag('Pharmacy', 'Medicine inventory stock & dispensary tracking')
    .addTag('Billing & Invoicing', 'Hospital bills, invoicing, and payment processing')
    .addTag('Page Tracking', 'Express page and route telemetry tracking')
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs/swagger', app, swaggerDocument, {
    customSiteTitle: 'AURA API Docs // Swagger UI',
    customCss: '.swagger-ui .topbar { background-color: #09090b; border-bottom: 1px solid #27272a; } .swagger-ui { background-color: #0c0a09; color: #f4f4f5; }',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
    },
  });
  SwaggerModule.setup('swagger', app, swaggerDocument);

  // Postman API Documentation (Positioned at /api/docs)
  const collectionFile = findPostmanFile('hospital-management.postman_collection.json');
  const environmentFile = findPostmanFile('hospital-management.postman_environment.json');

  const httpAdapter = app.getHttpAdapter();
  const expressInstance = httpAdapter.getInstance();

  // Root documentation endpoint (/api/docs)
  expressInstance.get('/api/docs', (req: any, res: any) => {
    const acceptsHtml = req.headers['accept'] && req.headers['accept'].includes('text/html');
    const isPostmanOrJson = req.headers['user-agent']?.includes('Postman') ||
      req.query.format === 'json' ||
      (!acceptsHtml && !req.query.view);

    if (req.query.download === 'environment') {
      res.setHeader('Content-Disposition', 'attachment; filename="hospital-management.postman_environment.json"');
      res.setHeader('Content-Type', 'application/json');
      return res.sendFile(environmentFile);
    }

    if (req.query.download === 'collection' || isPostmanOrJson) {
      res.setHeader('Content-Disposition', 'inline; filename="hospital-management.postman_collection.json"');
      res.setHeader('Content-Type', 'application/json');
      return res.sendFile(collectionFile);
    }

    // Default browser view: Clean Postman Hub interface
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:4000';
    return res.type('html').send(getPostmanHubHtml(`${protocol}://${host}`));
  });

  // Direct collection download route
  expressInstance.get('/api/docs/collection', (_req: any, res: any) => {
    res.setHeader('Content-Disposition', 'attachment; filename="hospital-management.postman_collection.json"');
    res.setHeader('Content-Type', 'application/json');
    res.sendFile(collectionFile);
  });

  // Direct environment download route
  expressInstance.get('/api/docs/environment', (_req: any, res: any) => {
    res.setHeader('Content-Disposition', 'attachment; filename="hospital-management.postman_environment.json"');
    res.setHeader('Content-Type', 'application/json');
    res.sendFile(environmentFile);
  });

  const port = configService.get<number>('PORT') || 4000;
  await app.listen(port);

  logger.log(`🏥 Hospital Management Backend running on: http://localhost:${port}/api/v1`);
  logger.log(`📮 Postman Documentation available at: http://localhost:${port}/api/docs`);
  logger.log(`📖 Swagger OpenAPI available at: http://localhost:${port}/api/docs/swagger`);
}

void bootstrap();
