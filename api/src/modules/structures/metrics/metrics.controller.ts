import { Body, Controller, HttpStatus, Logger, Param, Post, Res, UseGuards } from '@nestjs/common';
import { MetricsService } from './services/metrics.service';
import { CurrentUser, JwtAuthGuard, User } from 'src/modules/auth';
import { ApiAcceptedResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { Types } from 'mongoose';
import { GetMetricsDto } from './dto/metrics.dto';

@Controller('metrics')
export class MetricsController {
  protected readonly logger = new Logger(MetricsController.name);

  constructor(private readonly metricsService: MetricsService) { }

  @ApiAcceptedResponse({ description: 'Get metrics article' })
  @UseGuards(JwtAuthGuard)
  @Post('/:id')
  async getMetrics(
    @Param('id') id: Types.ObjectId,
    @Body() dto: GetMetricsDto,
    @CurrentUser() user: User,
    @Res() response: Response,
  ) {
    try {
      const metrics = await this.metricsService.getMetrics(user, id, dto);

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
