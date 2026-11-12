import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to MongoDB via Prisma');
      await this.ensureRoleViews();
    } catch (error) {
      this.logger.error('Failed to connect to MongoDB', error);
      // Let Nest continue to boot so dev server doesn't crash if local DB isn't started yet
    }
  }

  /**
   * Ensures MongoDB has distinct role collections/views (folders):
   * - admins: contains all ADMIN users + admin_profiles
   * - doctors: contains all DOCTOR users + doctor_profiles
   * - patients: contains all PATIENT users + patient_profiles
   * - pharmacists: contains all PHARMACIST users + pharmacist_profiles
   */
  async ensureRoleViews() {
    const rolesConfig = [
      { name: 'doctors', role: 'DOCTOR', profileCollection: 'doctor_profiles' },
      { name: 'patients', role: 'PATIENT', profileCollection: 'patient_profiles' },
      { name: 'admins', role: 'ADMIN', profileCollection: 'admin_profiles' },
      { name: 'pharmacists', role: 'PHARMACIST', profileCollection: 'pharmacist_profiles' },
    ];

    for (const { name, role, profileCollection } of rolesConfig) {
      try {
        await this.$runCommandRaw({
          create: name,
          viewOn: 'users',
          pipeline: [
            { $match: { role } },
            {
              $lookup: {
                from: profileCollection,
                localField: '_id',
                foreignField: 'userId',
                as: 'profile',
              },
            },
            { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } },
            {
              $project: {
                passwordHash: 0,
                'profile.userId': 0,
              },
            },
            {
              $addFields: {
                isSuperAdmin: {
                  $cond: [{ $eq: ['$email', 'ataah@gmail.com'] }, 1, 0],
                },
              },
            },
            { $sort: { isSuperAdmin: -1, createdAt: -1 } },
          ],
        });
        this.logger.log(`Ensured MongoDB folder/view: ${name}`);
      } catch (err: any) {
        // If view already exists, update view definition with new sort order
        if (err?.code === 48 || String(err?.message || err).includes('NamespaceExists')) {
          try {
            await this.$runCommandRaw({
              collMod: name,
              viewOn: 'users',
              pipeline: [
                { $match: { role } },
                {
                  $lookup: {
                    from: profileCollection,
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'profile',
                  },
                },
                { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } },
                {
                  $project: {
                    passwordHash: 0,
                    'profile.userId': 0,
                  },
                },
                {
                  $addFields: {
                    isSuperAdmin: {
                      $cond: [{ $eq: ['$email', 'ataah@gmail.com'] }, 1, 0],
                    },
                  },
                },
                { $sort: { isSuperAdmin: -1, createdAt: -1 } },
              ],
            });
          } catch {
            // view modification ignored if collMod not permitted
          }
        } else {
          this.logger.debug(`MongoDB view ${name} status: ${err?.message || err}`);
        }
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from MongoDB');
  }
}
