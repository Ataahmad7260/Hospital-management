import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DoctorsModule } from './modules/doctors/doctors.module';
import { PatientsModule } from './modules/patients/patients.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { PrescriptionsModule } from './modules/prescriptions/prescriptions.module';
import { PharmacyModule } from './modules/pharmacy/pharmacy.module';
import { BillingModule } from './modules/billing/billing.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    DoctorsModule,
    PatientsModule,
    AppointmentsModule,
    PrescriptionsModule,
    PharmacyModule,
    BillingModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
