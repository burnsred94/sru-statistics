import { Controller, Get, HttpStatus, Logger, Param, Res, UseGuards } from '@nestjs/common';
import { MetricsService } from './services/metrics.service';
import { CurrentUser, JwtAuthGuard, User } from 'src/modules/auth';
import { ApiAcceptedResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { Types } from 'mongoose';

@Controller('metrics')
export class MetricsController {
  protected readonly logger = new Logger(MetricsController.name);

  constructor(private readonly metricsService: MetricsService) {}

  @ApiAcceptedResponse({ description: 'Get metrics article' })
  @UseGuards(JwtAuthGuard)
  @Get('/:id')
  async getMetrics(
    @Param('id') id: Types.ObjectId,
    @CurrentUser() user: User,
    @Res() response: Response,
  ) {
    try {
      const metrics = await this.metricsService.getMetrics(user, id);

      return response.status(HttpStatus.OK).send({
        data: metrics,
        error: [],
        status: response.statusCode,
      });
    } catch (error) {
      this.logger.error(error.message);
      return response.status(HttpStatus.OK).send({
        data: [],
        error: [{ message: error.message }],
        status: response.statusCode,
      });
    }
  }
}
