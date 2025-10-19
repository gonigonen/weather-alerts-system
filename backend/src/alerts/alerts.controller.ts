import { Controller, Get, Post, Body, Param, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { CreateAlertDto } from './dto/create-alert.dto';

@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post()
  async create(@Body() createAlertDto: CreateAlertDto) {
    try {
      return await this.alertsService.create(createAlertDto);
    } catch (error) {
      if (error.message.includes('conflicts')) {
        throw new HttpException(error.message, HttpStatus.CONFLICT);
      }
      throw new HttpException('Failed to create alert', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get()
  async findAll() {
    return this.alertsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const alert = await this.alertsService.findOne(id);
    if (!alert) {
      throw new HttpException('Alert not found', HttpStatus.NOT_FOUND);
    }
    return alert;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return await this.alertsService.remove(id);
    } catch (error) {
      throw new HttpException('Alert not found', HttpStatus.NOT_FOUND);
    }
  }
}
