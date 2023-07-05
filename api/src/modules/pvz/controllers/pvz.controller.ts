import { Body, Controller, HttpStatus, Logger, Put, Res } from '@nestjs/common';
import { ApiAcceptedResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { TICK_UPDATED_PERIOD } from 'src/constatnts';
import { UpdatePvzDto } from '../dto';
import { PvzService } from '../services';

@Controller('pvz')
export class PvzController {
  private readonly logger = new Logger(PvzController.name);

  constructor(private readonly pvzService: PvzService) { }

  @ApiAcceptedResponse({ description: 'Update periods' })
  @Put('update')
  async updatePeriod(
    @Body() data: UpdatePvzDto,
    @Res() response: Response,
  ) {
    try {
      console.log(data);
      await this.pvzService.update(data)

      return response.status(HttpStatus.OK).send({
        data: TICK_UPDATED_PERIOD,
        error: [],
        status: response.statusCode,
      });
    } catch (error) {
      this.logger.error(error);
      return response.status(HttpStatus.OK).send({
        data: [],
        error: [{ message: error.message }],
        status: response.statusCode,
      });
    }
  }
}
