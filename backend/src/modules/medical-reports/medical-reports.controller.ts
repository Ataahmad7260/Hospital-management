import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { MedicalReportsService, type UploadedReportFile } from './medical-reports.service';
import { UploadMedicalReportDto } from './dto/upload-medical-report.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Medical Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('medical-reports')
export class MedicalReportsController {
  constructor(private readonly medicalReportsService: MedicalReportsService) {}

  @Roles(Role.PATIENT, Role.DOCTOR, Role.ADMIN)
  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload PDF or image medical report linked to patient profile or consultation' })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, callback) => {
        const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowed.includes(file.mimetype.toLowerCase())) {
          callback(
            new BadRequestException('Only PDF, PNG, JPG, or WEBP medical report files are allowed'),
            false,
          );
          return;
        }
        callback(null, true);
      },
    }),
  )
  async uploadReport(
    @UploadedFile() file: UploadedReportFile,
    @Body() dto: UploadMedicalReportDto,
    @CurrentUser() user: any,
  ) {
    return this.medicalReportsService.uploadReport(file, dto, user);
  }

  @Roles(Role.PATIENT, Role.DOCTOR, Role.ADMIN)
  @Get()
  @ApiOperation({ summary: 'List uploaded medical reports scoped by user role' })
  @ApiQuery({ name: 'appointmentId', required: false })
  @ApiQuery({ name: 'patientId', required: false })
  async findAll(
    @CurrentUser() user: any,
    @Query('appointmentId') appointmentId?: string,
    @Query('patientId') patientId?: string,
  ) {
    return this.medicalReportsService.findAll(user, { appointmentId, patientId });
  }

  @Roles(Role.PATIENT, Role.DOCTOR, Role.ADMIN)
  @Get(':id/file')
  @ApiOperation({ summary: 'Stream uploaded medical report file (PDF or image) with RBAC checks' })
  async getFile(@Param('id') id: string, @CurrentUser() user: any): Promise<StreamableFile> {
    return this.medicalReportsService.getReportFile(id, user);
  }

  @Roles(Role.PATIENT, Role.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Remove an uploaded medical report' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.medicalReportsService.removeReport(id, user);
  }
}
